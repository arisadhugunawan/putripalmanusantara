import { Inject, Injectable } from '@nestjs/common';
import { imageSize } from 'image-size';
import { ApiException } from '../common/exceptions/api.exception';
import { PrismaService } from '../prisma/prisma.service';
import type {
  StorageDriver,
  UploadedFileInput,
} from './storage/storage-driver.interface';
import { STORAGE_DRIVER } from './storage/storage-driver.interface';

const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];
const ALLOWED_MIME_EXACT = ['application/pdf'];

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

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_DRIVER) private readonly storage: StorageDriver,
  ) {}

  async upload(file: UploadedFileInput, altText: string) {
    if (!isAllowedMimeType(file.mimeType)) {
      throw new ApiException(
        'UNSUPPORTED_FILE_TYPE',
        'Only image, video, and PDF files are supported.',
        400,
      );
    }

    const fileType = resolveFileType(file.mimeType);
    let width: number | null = null;
    let height: number | null = null;

    if (fileType === 'image') {
      try {
        const dimensions = imageSize(file.buffer);
        width = dimensions.width ?? null;
        height = dimensions.height ?? null;
      } catch {
        // Non-fatal — CLS prevention data is best-effort (docs/04-database.md §3.14).
      }
    }

    const { url } = await this.storage.upload(file);

    return this.prisma.media.create({
      data: { fileUrl: url, fileType, altText, width, height },
    });
  }

  async delete(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new ApiException('NOT_FOUND', 'Media not found.', 404);
    }

    try {
      await this.prisma.media.delete({ where: { id } });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2003') {
        throw new ApiException(
          'MEDIA_IN_USE',
          'This media file is still referenced by other content and cannot be deleted.',
          409,
        );
      }
      throw error;
    }

    await this.storage.delete(media.fileUrl);
    return { deleted: true };
  }
}
