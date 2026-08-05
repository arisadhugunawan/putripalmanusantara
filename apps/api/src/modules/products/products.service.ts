import { Injectable } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AddProductGalleryItemDto,
  UpdateProductGalleryItemDto,
  UpsertProductDownloadDto,
  UpsertProductPackagingApplicationDto,
  UpsertProductSpecificationDto,
} from './dto/product-subresources.dto';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { toProductDetail, toProductSummary } from './product.mapper';

const DETAIL_INCLUDE = {
  coverImage: true,
  gallery: { include: { media: true } },
  specifications: true,
  packagingAndApps: { include: { media: true } },
  downloads: true,
} as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public ──────────────────────────────────────────────────────────
  async findPublished(locale?: string) {
    const products = await this.prisma.product.findMany({
      where: { status: 'published' },
      include: { coverImage: true },
      orderBy: { order: 'asc' },
    });
    return products.map((product) => toProductSummary(product, locale));
  }

  async findFeatured(locale?: string) {
    const products = await this.prisma.product.findMany({
      where: { status: 'published', isFeatured: true },
      include: { coverImage: true },
      orderBy: { order: 'asc' },
    });
    return products.map((product) => toProductSummary(product, locale));
  }

  async findPublishedBySlug(slug: string, locale?: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: 'published' },
      include: DETAIL_INCLUDE,
    });
    if (!product) {
      throw new ApiException('NOT_FOUND', 'Product not found.', 404);
    }
    return toProductDetail(product, locale);
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

  async findByIdForAdmin(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!product) {
      throw new ApiException('NOT_FOUND', 'Product not found.', 404);
    }
    return toProductDetail(product);
  }

  async create(dto: CreateProductDto) {
    await this.assertSlugAvailable(dto.slug);
    const product = await this.prisma.product.create({
      data: {
        slug: dto.slug,
        name: dto.name,
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
              })),
            }
          : undefined,
      },
      include: DETAIL_INCLUDE,
    });
    return toProductDetail(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.assertExists(id);
    if (dto.slug) {
      await this.assertSlugAvailable(dto.slug, id);
    }
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        slug: dto.slug,
        name: dto.name,
        category: dto.category,
        shortDescription: dto.short_description,
        fullDescription: dto.full_description,
        coverImageId: dto.cover_image_id,
        metaTitle: dto.meta_title,
        metaDescription: dto.meta_description,
        isFeatured: dto.is_featured,
        status: dto.status,
        order: dto.order,
        translations: dto.translations,
      },
      include: DETAIL_INCLUDE,
    });
    return toProductDetail(product);
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.product.delete({ where: { id } });
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
    return this.prisma.productGalleryImage.create({
      data: { productId, mediaId: dto.media_id, order: dto.order ?? 0 },
      include: { media: true },
    });
  }

  async updateGalleryItem(
    productId: string,
    galleryId: string,
    dto: UpdateProductGalleryItemDto,
  ) {
    await this.assertGalleryItemExists(productId, galleryId);
    return this.prisma.productGalleryImage.update({
      where: { id: galleryId },
      data: { order: dto.order },
      include: { media: true },
    });
  }

  async removeGalleryItem(productId: string, galleryId: string) {
    await this.assertGalleryItemExists(productId, galleryId);
    await this.prisma.productGalleryImage.delete({ where: { id: galleryId } });
    return { deleted: true };
  }

  // ── Specification sub-resource ─────────────────────────────────────
  async addSpecification(
    productId: string,
    dto: UpsertProductSpecificationDto,
  ) {
    await this.assertExists(productId);
    return this.prisma.productSpecification.create({
      data: {
        productId,
        specKey: dto.spec_key,
        specValue: dto.spec_value,
        order: dto.order ?? 0,
      },
    });
  }

  async updateSpecification(
    productId: string,
    specId: string,
    dto: UpsertProductSpecificationDto,
  ) {
    await this.assertSpecificationExists(productId, specId);
    return this.prisma.productSpecification.update({
      where: { id: specId },
      data: {
        specKey: dto.spec_key,
        specValue: dto.spec_value,
        order: dto.order,
      },
    });
  }

  async removeSpecification(productId: string, specId: string) {
    await this.assertSpecificationExists(productId, specId);
    await this.prisma.productSpecification.delete({ where: { id: specId } });
    return { deleted: true };
  }

  // ── Download sub-resource ──────────────────────────────────────────
  async addDownload(productId: string, dto: UpsertProductDownloadDto) {
    await this.assertExists(productId);
    return this.prisma.productDownload.create({
      data: { productId, fileName: dto.file_name, fileUrl: dto.file_url },
    });
  }

  async updateDownload(
    productId: string,
    downloadId: string,
    dto: UpsertProductDownloadDto,
  ) {
    await this.assertDownloadExists(productId, downloadId);
    return this.prisma.productDownload.update({
      where: { id: downloadId },
      data: { fileName: dto.file_name, fileUrl: dto.file_url },
    });
  }

  async removeDownload(productId: string, downloadId: string) {
    await this.assertDownloadExists(productId, downloadId);
    await this.prisma.productDownload.delete({ where: { id: downloadId } });
    return { deleted: true };
  }

  // ── Packaging / Application sub-resource ───────────────────────────
  async addPackagingApplication(
    productId: string,
    dto: UpsertProductPackagingApplicationDto,
  ) {
    await this.assertExists(productId);
    return this.prisma.productPackagingApplication.create({
      data: {
        productId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        mediaId: dto.media_id,
      },
      include: { media: true },
    });
  }

  async updatePackagingApplication(
    productId: string,
    entryId: string,
    dto: UpsertProductPackagingApplicationDto,
  ) {
    await this.assertPackagingApplicationExists(productId, entryId);
    return this.prisma.productPackagingApplication.update({
      where: { id: entryId },
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        mediaId: dto.media_id,
      },
      include: { media: true },
    });
  }

  async removePackagingApplication(productId: string, entryId: string) {
    await this.assertPackagingApplicationExists(productId, entryId);
    await this.prisma.productPackagingApplication.delete({
      where: { id: entryId },
    });
    return { deleted: true };
  }

  // ── Guards ──────────────────────────────────────────────────────────
  private async assertExists(id: string) {
    const exists = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new ApiException('NOT_FOUND', 'Product not found.', 404);
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
      select: { id: true },
    });
    if (!item)
      throw new ApiException('NOT_FOUND', 'Specification not found.', 404);
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
      select: { id: true },
    });
    if (!item)
      throw new ApiException(
        'NOT_FOUND',
        'Packaging/application entry not found.',
        404,
      );
  }
}
