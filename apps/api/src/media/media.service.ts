import { Inject, Injectable, Logger } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { imageSize } from 'image-size';
import { getMediaPolicy } from '@ppn/shared-types';
import { ApiException } from '../common/exceptions/api.exception';
import { buildPaginationMeta } from '../common/dto/pagination-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import type { MediaQueryDto } from './dto/media-query.dto';
import { capImageDimensions } from './image-resize.util';
import { toMedia } from './media.mapper';
import { findLiveUsage } from './media-usage-registry';
import { findSnapshotUsage } from './media-snapshot-registry';
import { renderPdfFirstPageToPng } from './pdf-thumbnail.util';
import type {
  StorageDriver,
  UploadedFileInput,
} from './storage/storage-driver.interface';
import { STORAGE_DRIVER } from './storage/storage-driver.interface';

const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];
const ALLOWED_MIME_EXACT = ['application/pdf'];
const SVG_MIME_TYPE = 'image/svg+xml';

// Allowlist of structural/presentation SVG tags and attributes. `script`
// and `foreignObject` are deliberately excluded (dropped along with their
// content), and no `on*` event-handler attribute is ever listed, so both
// are stripped by omission rather than by a fallible blocklist.
const SVG_ALLOWED_TAGS = [
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'defs',
  'use',
  'symbol',
  'clipPath',
  'mask',
  'linearGradient',
  'radialGradient',
  'stop',
  'filter',
  'feGaussianBlur',
  'feOffset',
  'feMerge',
  'feMergeNode',
  'feColorMatrix',
  'feBlend',
  'feComposite',
  'title',
  'desc',
  'pattern',
  'marker',
  'metadata',
];

const SVG_ALLOWED_ATTRS = [
  'id',
  'class',
  'transform',
  'fill',
  'fill-rule',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-opacity',
  'opacity',
  'viewBox',
  'xmlns',
  'xmlns:xlink',
  'version',
  'width',
  'height',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'd',
  'points',
  'preserveAspectRatio',
  'gradientUnits',
  'gradientTransform',
  'offset',
  'stop-color',
  'stop-opacity',
  'clip-path',
  'mask',
  'filter',
  'font-size',
  'font-family',
  'font-weight',
  'text-anchor',
  'xlink:href',
  'href',
];

function resolveFileType(mimeType: string): 'image' | 'video' | 'pdf' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'pdf';
}

export function isAllowedMimeType(mimeType: string): boolean {
  return (
    ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix)) ||
    ALLOWED_MIME_EXACT.includes(mimeType)
  );
}

/** Magic-byte signatures for the well-defined formats we actually accept. Multi-alternative
 * entries (GIF, WebP) list every byte pattern that counts as a match. */
const FILE_SIGNATURES: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  'image/gif': [Buffer.from('GIF87a', 'ascii'), Buffer.from('GIF89a', 'ascii')],
  'application/pdf': [Buffer.from('%PDF-', 'ascii')],
};

/** First bytes of content that is unambiguously executable/scriptable markup, never a real
 * image/video/PDF — the specific pattern the client-declared-MIME gap actually enables (a
 * `.html`/`.svg`-with-script payload relabelled with an allowed Content-Type). */
const TEXT_SMUGGLING_PATTERNS = [
  /^\s*<!doctype\s+html/i,
  /^\s*<html[\s>]/i,
  /^\s*<script[\s>]/i,
  /^\s*<%/, // JSP/ASP-style server-page markers
  /^\s*<\?php/i,
];

/**
 * Verifies the uploaded bytes actually look like the declared MIME type — the client-declared
 * `Content-Type` header is otherwise trusted as-is (docs/07 security audit finding). WebP is
 * checked separately (its signature spans a 4-byte gap: `RIFF????WEBP`). Formats with no
 * signature table entry (most video containers) only get the smuggling-pattern check, not a
 * full magic-byte match — an exhaustive per-container signature database is disproportionate to
 * the actual threat (videos aren't executable in-browser the way HTML/SVG/JS are); the real risk
 * this closes is a script/HTML payload relabelled with an allowed Content-Type.
 */
export function verifyFileSignature(buffer: Buffer, mimeType: string): boolean {
  const head = buffer.subarray(0, 16);
  const asText = head.toString('latin1');
  if (TEXT_SMUGGLING_PATTERNS.some((pattern) => pattern.test(asText))) {
    return false;
  }

  if (mimeType === 'image/webp') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return true; // No known signature (SVG is text/XML, most video containers) — smuggling check above still applies.
  return signatures.some((sig) => buffer.subarray(0, sig.length).equals(sig));
}

/**
 * Strips <script>/<foreignObject> elements, on* event handlers, and
 * javascript: URIs from an uploaded SVG before it reaches storage — SVG is
 * XML and executes inline when rendered, unlike raster image formats.
 */
export function sanitizeSvg(buffer: Buffer): Buffer {
  const clean = sanitizeHtml(buffer.toString('utf-8'), {
    allowedTags: SVG_ALLOWED_TAGS,
    allowedAttributes: { '*': SVG_ALLOWED_ATTRS },
    allowedSchemes: ['http', 'https', 'data'],
    allowedSchemesAppliedToAttributes: ['href', 'xlink:href'],
    disallowedTagsMode: 'discard',
    parser: { xmlMode: true },
  });
  return Buffer.from(clean, 'utf-8');
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_DRIVER) private readonly storage: StorageDriver,
  ) {}

  /** Backs the admin "Media Library" — every uploaded file across every module, searchable by
   * alt text and filterable by type. Defaults to the `active` tab (`deletedAt IS NULL`);
   * `status: 'trash'` shows soft-deleted rows instead — the two tabs never overlap. */
  async findAll(query: MediaQueryDto) {
    const where = {
      deletedAt: query.status === 'trash' ? { not: null } : null,
      ...(query.file_type ? { fileType: query.file_type } : {}),
      ...(query.q?.trim()
        ? {
            altText: { contains: query.q.trim(), mode: 'insensitive' as const },
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.media.count({ where }),
    ]);
    return {
      items: items.map(toMedia),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async upload(file: UploadedFileInput, altText: string, context?: string) {
    if (!isAllowedMimeType(file.mimeType)) {
      throw new ApiException(
        'UNSUPPORTED_FILE_TYPE',
        'Only image, video, and PDF files are supported.',
        400,
      );
    }

    if (!verifyFileSignature(file.buffer, file.mimeType)) {
      throw new ApiException(
        'FILE_CONTENT_MISMATCH',
        "This file's content doesn't match its declared type.",
        400,
      );
    }

    const fileType = resolveFileType(file.mimeType);
    let width: number | null = null;
    let height: number | null = null;

    let uploadFile: UploadedFileInput =
      fileType === 'image' && file.mimeType === SVG_MIME_TYPE
        ? { ...file, buffer: sanitizeSvg(file.buffer) }
        : file;

    // Upload-time maximum-dimension cap (Post-Launch Phase 3) — only ever resizes the buffer
    // about to be stored for THIS new upload; never touches any existing Media row or file,
    // so an old Product snapshot's image reference can never be invalidated by this step.
    if (fileType === 'image') {
      const policy = getMediaPolicy(context);
      const capped = await capImageDimensions(
        uploadFile.buffer,
        file.mimeType,
        policy.maxWidth,
        policy.maxHeight,
      );
      if (capped !== uploadFile.buffer)
        uploadFile = { ...uploadFile, buffer: capped };
    }

    if (fileType === 'image') {
      try {
        const dimensions = imageSize(uploadFile.buffer);
        width = dimensions.width ?? null;
        height = dimensions.height ?? null;
      } catch {
        // Non-fatal — CLS prevention data is best-effort (docs/04-database.md §3.14).
      }
    }

    const { url } = await this.storage.upload(uploadFile);

    return this.prisma.media.create({
      data: {
        fileUrl: url,
        fileType,
        altText,
        width,
        height,
        sizeBytes: uploadFile.buffer.length,
      },
    });
  }

  /**
   * Renders a PDF's first page to a PNG and stores it as a new Media record,
   * for use as an auto-generated thumbnail. Never throws — thumbnail
   * generation is best-effort; callers fall back to no preview on `null`.
   */
  async generatePdfThumbnail(
    pdfFileUrl: string,
    altText: string,
  ): Promise<{ id: string } | null> {
    try {
      const response = await fetch(pdfFileUrl);
      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }
      const pdfBytes = new Uint8Array(await response.arrayBuffer());
      const pngBuffer = await renderPdfFirstPageToPng(pdfBytes);

      const media = await this.upload(
        {
          buffer: pngBuffer,
          originalName: 'pdf-preview.png',
          mimeType: 'image/png',
        },
        altText,
      );
      return { id: media.id };
    } catch (error) {
      this.logger.warn(
        `Could not generate PDF thumbnail for "${pdfFileUrl}": ${(error as Error).message}`,
      );
      return null;
    }
  }

  /** "Move to Trash" (Post-Launch Phase 3) — the row and the underlying storage file both
   * stay exactly as they are; only `deletedAt` changes. This is now what `DELETE
   * /admin/media/:id` does — a deliberate behavior change from the previous hard delete,
   * since a mistaken trash is always recoverable via `restore()` and nothing that only an
   * old Product snapshot references (invisible to the live-relation check) can be silently
   * destroyed by an ordinary delete click. Permanently removing a file is `permanentDelete()`
   * below, a separate, explicitly-guarded action. */
  async trash(id: string) {
    const media = await this.findActiveOrThrow(id);
    await this.prisma.media.update({
      where: { id: media.id },
      data: { deletedAt: new Date() },
    });
    return { trashed: true };
  }

  async restore(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new ApiException('NOT_FOUND', 'Media not found.', 404);
    if (!media.deletedAt) return { restored: true }; // already active — no-op, not an error
    // The id/fileUrl/dimensions/metadata are untouched by trash(), so restoring is exactly
    // clearing this one column — no new Media record, nothing else changes.
    await this.prisma.media.update({
      where: { id },
      data: { deletedAt: null },
    });
    return { restored: true };
  }

  /**
   * Truly removes the file and its DB row — only reachable from the Trash tab, and only once
   * both guards below pass. Order matters: storage is deleted FIRST, and the DB row is only
   * removed if that succeeds, so a storage failure can never leave a dangling DB row pointing
   * at nothing (the reverse — a DB-delete failure after a successful storage delete — is
   * accepted as the safer failure mode: an orphaned file wastes storage but breaks nothing
   * visible, versus an orphaned DB row that would 404 for every viewer).
   */
  async permanentDelete(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new ApiException('NOT_FOUND', 'Media not found.', 404);

    const snapshotRefs = await findSnapshotUsage(this.prisma, id);
    if (snapshotRefs.length > 0) {
      throw new ApiException(
        'MEDIA_IN_VERSION_HISTORY',
        'This media file is still referenced by published content history and cannot be permanently removed.',
        409,
      );
    }

    try {
      await this.storage.delete(media.fileUrl);
    } catch (error) {
      this.logger.warn(
        `Could not delete storage object for media "${id}": ${(error as Error).message}`,
      );
      throw new ApiException(
        'MEDIA_STORAGE_DELETE_FAILED',
        'Could not remove the stored file. The media record was not deleted — please try again.',
        502,
      );
    }

    try {
      await this.prisma.media.delete({ where: { id } });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2003') {
        throw new ApiException(
          'MEDIA_IN_USE',
          'This media file is currently used by published content.',
          409,
        );
      }
      throw error;
    }

    return { deleted: true };
  }

  /** "Used By" — computed on demand only (media detail/delete dialog), never for every card
   * in a Media Library list. Live references come from real Prisma relations (the same ones
   * `permanentDelete()`'s FK constraint already protects); version-history references come
   * from `SNAPSHOT_REFERENCE_CHECKS` and reflect content that's no longer editable but was
   * once published with this file. */
  async getUsage(id: string) {
    await this.assertExists(id);
    const [live, snapshots] = await Promise.all([
      findLiveUsage(this.prisma, id),
      findSnapshotUsage(this.prisma, id),
    ]);
    return {
      live,
      version_history: snapshots.map((s) => ({
        module: s.module,
        content_label: s.contentLabel,
        version: s.version,
        published_at: s.publishedAt.toISOString(),
      })),
    };
  }

  private async assertExists(id: string) {
    const exists = await this.prisma.media.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new ApiException('NOT_FOUND', 'Media not found.', 404);
  }

  private async findActiveOrThrow(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new ApiException('NOT_FOUND', 'Media not found.', 404);
    return media;
  }
}
