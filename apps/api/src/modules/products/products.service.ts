import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@ppn/shared-types';
import { ApiException } from '../../common/exceptions/api.exception';
import {
  CONTENT_PUBLISHED_EVENT,
  type ContentPublishedEvent,
} from '../../common/events/content-published.event';
import { buildPaginationMeta } from '../../common/dto/pagination-query.dto';
import { mergeTranslations } from '../../common/utils/i18n.util';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AddProductGalleryItemDto,
  UpdateProductGalleryItemDto,
  UpsertProductDownloadDto,
  UpsertProductPackagingApplicationDto,
  UpsertProductShapeDto,
  UpsertProductSpecificationDto,
} from './dto/product-subresources.dto';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import type { ProductQueryDto } from './dto/product-query.dto';
import { toProductDetail, toProductSummary } from './product.mapper';

/** Actor recorded on a snapshot — deliberately just the two display fields, not a full
 * `CurrentAdminPayload`, since that's all `ProductPublishedSnapshot` denormalizes (see its
 * schema doc comment for why: no FK to `Admin`, history must outlive the account). */
interface PublishActor {
  id: string;
  name: string;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** JSON round-trips through the `Json` column turn every Date into a plain ISO string — this
 * reconstructs real Date objects so the existing mapper functions (which call `.toISOString()`
 * on some fields) work unmodified against snapshot data. Same helper as
 * about-company.service.ts/homepage.service.ts, duplicated per-service by this codebase's
 * documented convention rather than extracted into a shared util. */
function reviveDates<T>(value: T): T {
  if (Array.isArray(value)) {
    const items = value as unknown[];
    return items.map((v) => reviveDates(v)) as never;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] =
        typeof val === 'string' && ISO_DATE_RE.test(val)
          ? new Date(val)
          : reviveDates(val);
    }
    return out as T;
  }
  return value;
}

/** Snapshot history is capped at the same depth as About Company's (`take: 20`) — old rows are
 * never deleted, just no longer listed; restoring one older than this would need its id known
 * some other way, which the UI never surfaces, matching the existing precedent exactly. */
const SNAPSHOT_LIST_LIMIT = 20;

/** Admin forms post `""` for a cleared optional field; store that as SQL NULL so "no accent"
 * has exactly one representation. */
function emptyToNull(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value.trim() === '' ? null : value;
}

const DETAIL_INCLUDE = {
  coverImage: true,
  gallery: { include: { media: true } },
  shapes: { include: { media: true }, orderBy: { order: 'asc' as const } },
  specifications: true,
  packagingAndApps: {
    include: { media: true },
    orderBy: { order: 'asc' as const },
  },
  downloads: true,
} as const;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  // ── Public — reads the latest PUBLISHED SNAPSHOT, never the live draft row ──────────────
  //
  // `status: 'published'` on the live `Product` row is the visibility gate (only ever flipped
  // by publish()/unpublish()/restoreSnapshot(), never by ordinary update()); the CONTENT shown
  // — every field captured in `DETAIL_INCLUDE`, including `order`/`isFeatured` — comes from
  // that product's own latest `ProductPublishedSnapshot.data`, frozen at publish time. A draft
  // edit (including a reorder or featured-toggle) is therefore invisible publicly until the
  // next Publish, exactly like Homepage/About Company's snapshot boundary — deliberately with
  // no exceptions for "low-risk" fields like order, to keep the boundary a single simple rule
  // rather than a partially-live/partially-frozen split that would be harder to reason about.

  private async latestSnapshotsByProduct(
    productIds: string[],
  ): Promise<Map<string, Record<string, unknown>>> {
    if (productIds.length === 0) return new Map();
    const rows = await this.prisma.productPublishedSnapshot.findMany({
      where: { productId: { in: productIds } },
      orderBy: [{ productId: 'asc' }, { version: 'desc' }],
      distinct: ['productId'],
    });
    return new Map(
      rows.map((row) => [
        row.productId,
        reviveDates(row.data as Record<string, unknown>),
      ]),
    );
  }

  /** Shared by `findPublished`/`findFeatured` — one query for which products are visible at
   * all, one for their latest snapshots, sorted/filtered from the frozen snapshot data (not
   * the live row) so a draft reorder or featured-toggle stays invisible until published. */
  private async publishedSummaries(locale?: string) {
    const published = await this.prisma.product.findMany({
      where: { status: 'published' },
      select: { id: true },
    });
    const latest = await this.latestSnapshotsByProduct(
      published.map((p) => p.id),
    );
    const rows = [...latest.values()] as (Record<string, unknown> & {
      id: string;
      order?: number;
      isFeatured?: boolean;
    })[];
    rows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return rows.map((data) => ({
      summary: toProductSummary(data as never, locale),
      isFeatured: Boolean(data.isFeatured),
    }));
  }

  async findPublished(locale?: string) {
    return (await this.publishedSummaries(locale)).map((r) => r.summary);
  }

  async findFeatured(locale?: string) {
    return (await this.publishedSummaries(locale))
      .filter((r) => r.isFeatured)
      .map((r) => r.summary);
  }

  async findPublishedBySlug(slug: string, locale?: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: 'published' },
      select: { id: true },
    });
    if (!product) {
      throw new ApiException('NOT_FOUND', 'Product not found.', 404);
    }
    const snapshot = await this.prisma.productPublishedSnapshot.findFirst({
      where: { productId: product.id },
      orderBy: { version: 'desc' },
    });
    if (!snapshot) {
      // status flipped to 'published' but no snapshot exists yet — can only happen via direct
      // API use bypassing publish() (see create()'s dto.status passthrough); never reachable
      // through the admin UI, which only ever sets status via publish().
      throw new ApiException('NOT_FOUND', 'Product not found.', 404);
    }
    return toProductDetail(reviveDates(snapshot.data as never), locale);
  }

  // ── Publish / Preview / Version History / Restore (Post-Launch) ────────────────────────

  private async buildSnapshotData(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: DETAIL_INCLUDE,
    });
    if (!product)
      throw new ApiException('NOT_FOUND', 'Product not found.', 404);
    return product;
  }

  /** Full detail of the live DRAFT row, for the admin "Preview" screen only — never exposed on
   * a public/unauthenticated route. Identical shape to `findByIdForAdmin`; kept as a separate,
   * clearly-named method so it's obvious at every call site which one is safe to expose where. */
  async findDraftForPreview(id: string) {
    return this.findByIdForAdmin(id);
  }

  async publish(id: string, actor: PublishActor) {
    await this.assertExists(id);
    const data = await this.buildSnapshotData(id);
    const last = await this.prisma.productPublishedSnapshot.findFirst({
      where: { productId: id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (last?.version ?? 0) + 1;
    const now = new Date();
    const [snapshot] = await this.prisma.$transaction([
      this.prisma.productPublishedSnapshot.create({
        data: {
          productId: id,
          version,
          data: data as never,
          publishedById: actor.id,
          publishedByName: actor.name,
          publishedAt: now,
        },
      }),
      // `updatedAt` is set explicitly here (not left to Prisma's auto `@updatedAt`) so it
      // lands on the exact same instant as `lastPublishedAt` — otherwise `@updatedAt` stamps
      // whatever moment this query actually executes, a few ms after `now` was computed above,
      // which made `has_unpublished_changes` (`updatedAt > lastPublishedAt`) read `true`
      // immediately after every publish. Caught live during Phase 2 verification.
      this.prisma.product.update({
        where: { id },
        data: { status: 'published', lastPublishedAt: now, updatedAt: now },
      }),
    ]);
    // Only the id — never the product payload itself; the AI listener re-reads through the
    // normal published-data path (`findPublishedBySlug`), never from the event.
    const event: ContentPublishedEvent = { source: 'products', entityId: id };
    this.events.emit(CONTENT_PUBLISHED_EVENT, event);
    return {
      id: snapshot.id,
      version: snapshot.version,
      published_at: snapshot.publishedAt.toISOString(),
    };
  }

  /** Takes the product off the public site without discarding any snapshot — Publish again
   * later re-snapshots whatever is current in the draft row at that time, exactly like a fresh
   * publish. Mirrors `ContactPageService.unpublish()`. */
  async unpublish(id: string) {
    await this.assertExists(id);
    await this.prisma.product.update({
      where: { id },
      data: { status: 'draft' },
    });
    return { unpublished: true };
  }

  async listSnapshots(productId: string) {
    await this.assertExists(productId);
    const snapshots = await this.prisma.productPublishedSnapshot.findMany({
      where: { productId },
      orderBy: { version: 'desc' },
      take: SNAPSHOT_LIST_LIMIT,
      select: {
        id: true,
        version: true,
        publishedAt: true,
        publishedByName: true,
      },
    });
    return snapshots.map((s) => ({
      id: s.id,
      version: s.version,
      published_at: s.publishedAt.toISOString(),
      published_by_name: s.publishedByName,
    }));
  }

  /** Never mutates or deletes a snapshot — restoring re-`create`s a brand-new row copying the
   * selected version's frozen `data`, so it becomes the new latest while every prior version
   * (including the one that was live right before this restore) stays exactly as it was.
   * Mirrors `AboutCompanyService.restoreSnapshot()`/`HomepageService.restoreSnapshot()`. */
  async restoreSnapshot(
    productId: string,
    snapshotId: string,
    actor: PublishActor,
  ) {
    const source = await this.prisma.productPublishedSnapshot.findFirst({
      where: { id: snapshotId, productId },
    });
    if (!source)
      throw new ApiException('NOT_FOUND', 'Snapshot not found.', 404);
    const last = await this.prisma.productPublishedSnapshot.findFirst({
      where: { productId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (last?.version ?? 0) + 1;
    const now = new Date();
    const [snapshot] = await this.prisma.$transaction([
      this.prisma.productPublishedSnapshot.create({
        data: {
          productId,
          version,
          data: source.data as never,
          publishedById: actor.id,
          publishedByName: actor.name,
          publishedAt: now,
        },
      }),
      // See publish()'s identical comment above — `updatedAt` must be pinned to the same
      // instant as `lastPublishedAt` explicitly, not left to Prisma's auto `@updatedAt`.
      this.prisma.product.update({
        where: { id: productId },
        data: { status: 'published', lastPublishedAt: now, updatedAt: now },
      }),
    ]);
    // A restore is a publish of an old snapshot — the public site changes exactly like a fresh
    // publish, so it must trigger the same AI resync. Only the id, never the payload — same
    // rule as publish(). Emitted only after the transaction above has committed.
    const event: ContentPublishedEvent = {
      source: 'products',
      entityId: productId,
    };
    this.events.emit(CONTENT_PUBLISHED_EVENT, event);
    return {
      id: snapshot.id,
      version: snapshot.version,
      published_at: snapshot.publishedAt.toISOString(),
    };
  }

  /** Lightweight lookup used by the controller to revalidate the right public URL after a sub-resource mutation. */
  async getSlug(id: string): Promise<string | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { slug: true },
    });
    return product?.slug ?? null;
  }

  // ── Admin ───────────────────────────────────────────────────────────
  async findAllForAdmin() {
    const products = await this.prisma.product.findMany({
      include: DETAIL_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return products.map((product) => toProductDetail(product));
  }

  /** Backs the admin Products list page (Phase 5C) — paginated, searchable, filterable. Only
   * reached when the caller explicitly passes `page` (see `AdminProductsController.findAll()`);
   * every other admin surface still gets the full unpaginated list via `findAllForAdmin()`. */
  async findAllForAdminPaginated(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit;
    const q = query.q?.trim();
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.featured !== undefined
        ? { isFeatured: query.featured === 'true' }
        : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { category: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: DETAIL_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      items: products.map((product) => toProductDetail(product)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findByIdForAdmin(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!product) {
      throw new ApiException('NOT_FOUND', 'Product not found.', 404);
    }
    return {
      ...toProductDetail(product),
      last_published_at: product.lastPublishedAt?.toISOString() ?? null,
      // No snapshot yet at all → always "has changes" (nothing to compare against). Otherwise
      // any edit to the draft row since the last publish — status/order/isFeatured no longer
      // included, since those are also publish-gated now (see the Public section above).
      has_unpublished_changes:
        !product.lastPublishedAt || product.updatedAt > product.lastPublishedAt,
    };
  }

  /** The 6 master-content fields `translate()` actually resolves (see product.mapper.ts) —
   * "translated" means an Admin (or a future generator) has filled in real text for a
   * locale, not just that the row exists. Never claims "translated" for an empty string. */
  private static readonly TRANSLATABLE_PRODUCT_FIELDS = [
    'name',
    'category',
    'shortDescription',
    'fullDescription',
    'metaTitle',
    'metaDescription',
  ] as const;

  /** Per-locale coverage of the product's own master-content fields — lets the Admin see at a
   * glance which languages actually have real text vs. are silently falling back to English,
   * without opening every LocaleTabs tab. Deliberately does NOT attempt "needs update since
   * master changed" detection (brief-requested but would need new version-tracking columns
   * this session didn't add) — see README.
   */
  async getTranslationStatus(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        translations: true,
        name: true,
        category: true,
        shortDescription: true,
        fullDescription: true,
        metaTitle: true,
        metaDescription: true,
      },
    });
    if (!product)
      throw new ApiException('NOT_FOUND', 'Product not found.', 404);
    const translations = (product.translations ?? {}) as Record<
      string,
      Record<string, unknown> | undefined
    >;
    // Only fields the English master itself actually has content for are "expected" to be
    // translated — an unset optional field like metaTitle shouldn't count as a missing
    // translation, or every product would be permanently stuck at "partial".
    const expectedFields = ProductsService.TRANSLATABLE_PRODUCT_FIELDS.filter(
      (field) => {
        const value = product[field];
        return typeof value === 'string' && value.trim() !== '';
      },
    );

    return SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map(
      (locale) => {
        const block = translations[locale] ?? {};
        const translatedCount = expectedFields.filter(
          (field) =>
            typeof block[field] === 'string' && block[field].trim() !== '',
        ).length;
        const status =
          expectedFields.length === 0 ||
          translatedCount === expectedFields.length
            ? 'translated'
            : translatedCount === 0
              ? 'not_translated'
              : 'partial';
        return {
          locale,
          status,
          fields_translated: translatedCount,
          fields_total: expectedFields.length,
        };
      },
    );
  }

  /** "Generate Translations" (brief §3/§14) — no machine-translation provider is configured
   * anywhere in this project (see README "Internationalization"), so this cannot fabricate
   * translations. It degrades honestly instead of pretending to succeed, same pattern as the
   * Instagram oEmbed import when no access token is set.
   */
  generateTranslations() {
    return {
      available: false as const,
      reason: 'not_configured' as const,
      message:
        'Automatic translation is not configured for this project. Enter translations manually using the language tabs above.',
    };
  }

  async create(dto: CreateProductDto) {
    await this.assertSlugAvailable(dto.slug);
    const product = await this.prisma.product.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        titleAccent: emptyToNull(dto.title_accent),
        category: dto.category,
        shortDescription: dto.short_description,
        fullDescription: dto.full_description,
        coverImageId: dto.cover_image_id,
        metaTitle: dto.meta_title,
        metaDescription: dto.meta_description,
        isFeatured: dto.is_featured ?? false,
        status: dto.status ?? 'draft',
        order: dto.order ?? 0,
        translations: dto.translations,
        specifications: dto.specifications
          ? {
              create: dto.specifications.map((spec, index) => ({
                specKey: spec.spec_key,
                specValue: spec.spec_value,
                order: spec.order ?? index,
                group: spec.group ?? 'specification',
              })),
            }
          : undefined,
      },
      include: DETAIL_INCLUDE,
    });
    return toProductDetail(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.assertExists(id);
    if (dto.slug) {
      await this.assertSlugAvailable(dto.slug, id);
    }
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        slug: dto.slug,
        name: dto.name,
        titleAccent:
          dto.title_accent === undefined
            ? undefined
            : emptyToNull(dto.title_accent),
        category: dto.category,
        shortDescription: dto.short_description,
        fullDescription: dto.full_description,
        coverImageId: dto.cover_image_id,
        metaTitle: dto.meta_title,
        metaDescription: dto.meta_description,
        isFeatured: dto.is_featured,
        // `status` is deliberately NOT written here (`UpdateProductDto` still accepts it for
        // API backward-compatibility, but this is now the "Save Draft" action — it must never
        // change public visibility). Only publish()/unpublish()/restoreSnapshot() may change
        // status, matching the brief's Edit → Save Draft → Publish separation.
        order: dto.order,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
      },
      include: DETAIL_INCLUDE,
    });
    return toProductDetail(product);
  }

  async remove(id: string) {
    await this.assertExists(id);
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2003') {
        // Mirrors MediaService.delete()'s MEDIA_IN_USE pattern — the FK on
        // ProductPublishedSnapshot.productId has no onDelete: Cascade specifically so this
        // fails instead of silently erasing publish history.
        throw new ApiException(
          'PRODUCT_HAS_PUBLISHED_HISTORY',
          'This product has published version history and cannot be permanently deleted. Unpublish it first if you want to remove it from the public site.',
          409,
        );
      }
      throw error;
    }
    return { deleted: true };
  }

  async setFeatured(id: string, isFeatured: boolean) {
    await this.assertExists(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { isFeatured },
      include: DETAIL_INCLUDE,
    });
    return toProductDetail(product);
  }

  // ── Gallery sub-resource ────────────────────────────────────────────
  async addGalleryItem(productId: string, dto: AddProductGalleryItemDto) {
    await this.assertExists(productId);
    const item = await this.prisma.productGalleryImage.create({
      data: {
        productId,
        mediaId: dto.media_id,
        section: (dto.section as never) ?? 'gallery',
        caption: dto.caption?.trim() ? dto.caption : null,
        order: dto.order ?? 0,
      },
      include: { media: true },
    });
    await this.touchProduct(productId);
    return item;
  }

  async updateGalleryItem(
    productId: string,
    galleryId: string,
    dto: UpdateProductGalleryItemDto,
  ) {
    await this.assertGalleryItemExists(productId, galleryId);
    const item = await this.prisma.productGalleryImage.update({
      where: { id: galleryId },
      data: {
        order: dto.order,
        section: dto.section as never,
        caption:
          dto.caption === undefined
            ? undefined
            : dto.caption?.trim()
              ? dto.caption
              : null,
      },
      include: { media: true },
    });
    await this.touchProduct(productId);
    return item;
  }

  async removeGalleryItem(productId: string, galleryId: string) {
    await this.assertGalleryItemExists(productId, galleryId);
    await this.prisma.productGalleryImage.delete({ where: { id: galleryId } });
    await this.touchProduct(productId);
    return { deleted: true };
  }

  // ── Shape & Size sub-resource ──────────────────────────────────────
  async addShape(productId: string, dto: UpsertProductShapeDto) {
    await this.assertExists(productId);
    const count = await this.prisma.productShape.count({
      where: { productId },
    });
    const shape = await this.prisma.productShape.create({
      data: {
        productId,
        name: dto.name,
        mediaId: dto.media_id ?? null,
        sizes: dto.sizes ?? '',
        order: dto.order ?? count,
        translations: dto.translations,
      },
      include: { media: true },
    });
    await this.touchProduct(productId);
    return shape;
  }

  async updateShape(
    productId: string,
    shapeId: string,
    dto: Partial<UpsertProductShapeDto>,
  ) {
    const existing = await this.assertShapeExists(productId, shapeId);
    const shape = await this.prisma.productShape.update({
      where: { id: shapeId },
      data: {
        name: dto.name,
        mediaId: dto.media_id === undefined ? undefined : dto.media_id,
        sizes: dto.sizes,
        order: dto.order,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
      },
      include: { media: true },
    });
    await this.touchProduct(productId);
    return shape;
  }

  async removeShape(productId: string, shapeId: string) {
    await this.assertShapeExists(productId, shapeId);
    await this.prisma.productShape.delete({ where: { id: shapeId } });
    await this.touchProduct(productId);
    return { deleted: true };
  }

  private async assertShapeExists(productId: string, shapeId: string) {
    const shape = await this.prisma.productShape.findFirst({
      where: { id: shapeId, productId },
    });
    if (!shape) throw new ApiException('NOT_FOUND', 'Shape not found.', 404);
    return shape;
  }

  // ── Specification sub-resource ─────────────────────────────────────
  async addSpecification(
    productId: string,
    dto: UpsertProductSpecificationDto,
  ) {
    await this.assertExists(productId);
    const spec = await this.prisma.productSpecification.create({
      data: {
        productId,
        specKey: dto.spec_key,
        specValue: dto.spec_value,
        order: dto.order ?? 0,
        group: dto.group ?? 'specification',
        variantLabel: emptyToNull(dto.variant_label),
        translations: dto.translations,
      },
    });
    await this.touchProduct(productId);
    return spec;
  }

  async updateSpecification(
    productId: string,
    specId: string,
    dto: UpsertProductSpecificationDto,
  ) {
    const existing = await this.assertSpecificationExists(productId, specId);
    const spec = await this.prisma.productSpecification.update({
      where: { id: specId },
      data: {
        specKey: dto.spec_key,
        specValue: dto.spec_value,
        order: dto.order,
        group: dto.group,
        variantLabel:
          dto.variant_label !== undefined
            ? emptyToNull(dto.variant_label)
            : undefined,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
      },
    });
    await this.touchProduct(productId);
    return spec;
  }

  async removeSpecification(productId: string, specId: string) {
    await this.assertSpecificationExists(productId, specId);
    await this.prisma.productSpecification.delete({ where: { id: specId } });
    await this.touchProduct(productId);
    return { deleted: true };
  }

  // ── Download sub-resource ──────────────────────────────────────────
  async addDownload(productId: string, dto: UpsertProductDownloadDto) {
    await this.assertExists(productId);
    const download = await this.prisma.productDownload.create({
      data: { productId, fileName: dto.file_name, fileUrl: dto.file_url },
    });
    await this.touchProduct(productId);
    return download;
  }

  async updateDownload(
    productId: string,
    downloadId: string,
    dto: UpsertProductDownloadDto,
  ) {
    await this.assertDownloadExists(productId, downloadId);
    const download = await this.prisma.productDownload.update({
      where: { id: downloadId },
      data: { fileName: dto.file_name, fileUrl: dto.file_url },
    });
    await this.touchProduct(productId);
    return download;
  }

  async removeDownload(productId: string, downloadId: string) {
    await this.assertDownloadExists(productId, downloadId);
    await this.prisma.productDownload.delete({ where: { id: downloadId } });
    await this.touchProduct(productId);
    return { deleted: true };
  }

  // ── Packaging / Application sub-resource ───────────────────────────
  async addPackagingApplication(
    productId: string,
    dto: UpsertProductPackagingApplicationDto,
  ) {
    await this.assertExists(productId);
    const count = await this.prisma.productPackagingApplication.count({
      where: { productId, type: dto.type },
    });
    const entry = await this.prisma.productPackagingApplication.create({
      data: {
        productId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        mediaId: dto.media_id,
        order: dto.order ?? count,
        translations: dto.translations,
      },
      include: { media: true },
    });
    await this.touchProduct(productId);
    return entry;
  }

  async updatePackagingApplication(
    productId: string,
    entryId: string,
    dto: UpsertProductPackagingApplicationDto,
  ) {
    const existing = await this.assertPackagingApplicationExists(
      productId,
      entryId,
    );
    const entry = await this.prisma.productPackagingApplication.update({
      where: { id: entryId },
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        mediaId: dto.media_id,
        order: dto.order,
        translations: mergeTranslations(
          existing.translations,
          dto.translations,
        ),
      },
      include: { media: true },
    });
    await this.touchProduct(productId);
    return entry;
  }

  async removePackagingApplication(productId: string, entryId: string) {
    await this.assertPackagingApplicationExists(productId, entryId);
    await this.prisma.productPackagingApplication.delete({
      where: { id: entryId },
    });
    await this.touchProduct(productId);
    return { deleted: true };
  }

  /** Sub-resource tables (specifications/shapes/gallery/downloads/packaging) carry no
   * `updatedAt` of their own — bumping the parent Product's `updatedAt` on every sub-resource
   * write is what keeps `findByIdForAdmin()`'s `has_unpublished_changes` accurate for edits
   * that never touch the main product row at all (e.g. editing only a specification). */
  private async touchProduct(productId: string) {
    await this.prisma.product.update({ where: { id: productId }, data: {} });
  }

  // ── Guards ──────────────────────────────────────────────────────────
  private async assertExists(id: string) {
    const exists = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, translations: true },
    });
    if (!exists) throw new ApiException('NOT_FOUND', 'Product not found.', 404);
    return exists;
  }

  private async assertSlugAvailable(slug: string, excludeId?: string) {
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new ApiException(
        'CONFLICT',
        `Slug "${slug}" is already in use.`,
        409,
      );
    }
  }

  private async assertGalleryItemExists(productId: string, galleryId: string) {
    const item = await this.prisma.productGalleryImage.findFirst({
      where: { id: galleryId, productId },
      select: { id: true },
    });
    if (!item)
      throw new ApiException('NOT_FOUND', 'Gallery item not found.', 404);
  }

  private async assertSpecificationExists(productId: string, specId: string) {
    const item = await this.prisma.productSpecification.findFirst({
      where: { id: specId, productId },
      select: { id: true, translations: true },
    });
    if (!item)
      throw new ApiException('NOT_FOUND', 'Specification not found.', 404);
    return item;
  }

  private async assertDownloadExists(productId: string, downloadId: string) {
    const item = await this.prisma.productDownload.findFirst({
      where: { id: downloadId, productId },
      select: { id: true },
    });
    if (!item) throw new ApiException('NOT_FOUND', 'Download not found.', 404);
  }

  private async assertPackagingApplicationExists(
    productId: string,
    entryId: string,
  ) {
    const item = await this.prisma.productPackagingApplication.findFirst({
      where: { id: entryId, productId },
      select: { id: true, translations: true },
    });
    if (!item)
      throw new ApiException(
        'NOT_FOUND',
        'Packaging/application entry not found.',
        404,
      );
    return item;
  }
}
