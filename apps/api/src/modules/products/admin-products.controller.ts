import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import type { CurrentAdminPayload } from '../../common/decorators/current-admin.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RevalidationService } from '../../revalidation/revalidation.service';
import { ProductQueryDto } from './dto/product-query.dto';
import {
  AddProductGalleryItemDto,
  UpdateProductGalleryItemDto,
  UpsertProductDownloadDto,
  UpsertProductPackagingApplicationDto,
  UpsertProductShapeDto,
  UpsertProductSpecificationDto,
} from './dto/product-subresources.dto';
import {
  CreateProductDto,
  SetFeaturedDto,
  UpdateProductDto,
} from './dto/product.dto';
import { ProductsService } from './products.service';

@Controller('api/v1/admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly revalidation: RevalidationService,
  ) {}

  // ── Publish / Preview / Version History / Restore (Post-Launch) ────────────────────────
  // Only publish/unpublish/restore are role-restricted — matching the exact scope Homepage/
  // About Company's publish/restore already use. Save Draft (the existing `update()` route
  // below) and viewing snapshot history stay open to every authenticated admin, same as before.

  @Get(':id/preview')
  preview(@Param('id') id: string) {
    return this.productsService.findDraftForPreview(id);
  }

  @Post(':id/publish')
  @Roles('super_admin')
  async publish(
    @Param('id') id: string,
    @CurrentAdmin() admin: CurrentAdminPayload,
  ) {
    const snapshot = await this.productsService.publish(id, admin);
    const slug = await this.productsService.getSlug(id);
    await this.revalidation.revalidate([
      '/products',
      ...(slug ? [`/products/${slug}`] : []),
      '/',
    ]);
    return snapshot;
  }

  @Post(':id/unpublish')
  @Roles('super_admin')
  async unpublish(@Param('id') id: string) {
    const result = await this.productsService.unpublish(id);
    await this.revalidation.revalidate(['/products', '/']);
    return result;
  }

  @Get(':id/snapshots')
  listSnapshots(@Param('id') id: string) {
    return this.productsService.listSnapshots(id);
  }

  @Post(':id/snapshots/:snapshotId/restore')
  @Roles('super_admin')
  async restoreSnapshot(
    @Param('id') id: string,
    @Param('snapshotId') snapshotId: string,
    @CurrentAdmin() admin: CurrentAdminPayload,
  ) {
    const snapshot = await this.productsService.restoreSnapshot(
      id,
      snapshotId,
      admin,
    );
    const slug = await this.productsService.getSlug(id);
    await this.revalidation.revalidate([
      '/products',
      ...(slug ? [`/products/${slug}`] : []),
      '/',
    ]);
    return snapshot;
  }

  // `page` present → the Products list page (Phase 5C, paginated/searchable/filterable).
  // `page` absent → every other admin surface (Dashboard, Homepage pickers, WhatWeDoEditor)
  // that still needs the full unpaginated list — unchanged from before Phase 5C.
  @Get()
  findAll(@Query() query: ProductQueryDto) {
    if (query.page === undefined) {
      return this.productsService.findAllForAdmin();
    }
    return this.productsService.findAllForAdminPaginated(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findByIdForAdmin(id);
  }

  @Get(':id/translation-status')
  getTranslationStatus(@Param('id') id: string) {
    return this.productsService.getTranslationStatus(id);
  }

  @Post(':id/translations/generate')
  generateTranslations(@Param('id') id: string) {
    return this.productsService.generateTranslations(id);
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productsService.create(dto);
    await this.revalidation.revalidate([
      '/products',
      `/products/${product.slug}`,
      '/',
    ]);
    return product;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const product = await this.productsService.update(id, dto);
    await this.revalidation.revalidate([
      '/products',
      `/products/${product.slug}`,
      '/',
    ]);
    return product;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.productsService.remove(id);
    await this.revalidation.revalidate(['/products', '/']);
    return result;
  }

  @Put(':id/featured')
  async setFeatured(@Param('id') id: string, @Body() dto: SetFeaturedDto) {
    const product = await this.productsService.setFeatured(id, dto.is_featured);
    await this.revalidation.revalidate(['/products', '/']);
    return product;
  }

  /** Sub-resources (gallery/specs/downloads/packaging) all live on the product detail page. */
  private async revalidateProduct(id: string) {
    const slug = await this.productsService.getSlug(id);
    if (slug) await this.revalidation.revalidate([`/products/${slug}`]);
  }

  // ── Gallery ─────────────────────────────────────────────────────────
  @Post(':id/shapes')
  addShape(@Param('id') id: string, @Body() dto: UpsertProductShapeDto) {
    return this.productsService.addShape(id, dto);
  }

  @Put(':id/shapes/:shapeId')
  updateShape(
    @Param('id') id: string,
    @Param('shapeId') shapeId: string,
    @Body() dto: UpsertProductShapeDto,
  ) {
    return this.productsService.updateShape(id, shapeId, dto);
  }

  @Delete(':id/shapes/:shapeId')
  removeShape(@Param('id') id: string, @Param('shapeId') shapeId: string) {
    return this.productsService.removeShape(id, shapeId);
  }

  @Post(':id/gallery')
  async addGalleryItem(
    @Param('id') id: string,
    @Body() dto: AddProductGalleryItemDto,
  ) {
    const result = await this.productsService.addGalleryItem(id, dto);
    await this.revalidateProduct(id);
    return result;
  }

  @Put(':id/gallery/:galleryId')
  async updateGalleryItem(
    @Param('id') id: string,
    @Param('galleryId') galleryId: string,
    @Body() dto: UpdateProductGalleryItemDto,
  ) {
    const result = await this.productsService.updateGalleryItem(
      id,
      galleryId,
      dto,
    );
    await this.revalidateProduct(id);
    return result;
  }

  @Delete(':id/gallery/:galleryId')
  async removeGalleryItem(
    @Param('id') id: string,
    @Param('galleryId') galleryId: string,
  ) {
    const result = await this.productsService.removeGalleryItem(id, galleryId);
    await this.revalidateProduct(id);
    return result;
  }

  // ── Specifications ──────────────────────────────────────────────────
  @Post(':id/specifications')
  async addSpecification(
    @Param('id') id: string,
    @Body() dto: UpsertProductSpecificationDto,
  ) {
    const result = await this.productsService.addSpecification(id, dto);
    await this.revalidateProduct(id);
    return result;
  }

  @Put(':id/specifications/:specId')
  async updateSpecification(
    @Param('id') id: string,
    @Param('specId') specId: string,
    @Body() dto: UpsertProductSpecificationDto,
  ) {
    const result = await this.productsService.updateSpecification(
      id,
      specId,
      dto,
    );
    await this.revalidateProduct(id);
    return result;
  }

  @Delete(':id/specifications/:specId')
  async removeSpecification(
    @Param('id') id: string,
    @Param('specId') specId: string,
  ) {
    const result = await this.productsService.removeSpecification(id, specId);
    await this.revalidateProduct(id);
    return result;
  }

  // ── Downloads ───────────────────────────────────────────────────────
  @Post(':id/downloads')
  async addDownload(
    @Param('id') id: string,
    @Body() dto: UpsertProductDownloadDto,
  ) {
    const result = await this.productsService.addDownload(id, dto);
    await this.revalidateProduct(id);
    return result;
  }

  @Put(':id/downloads/:downloadId')
  async updateDownload(
    @Param('id') id: string,
    @Param('downloadId') downloadId: string,
    @Body() dto: UpsertProductDownloadDto,
  ) {
    const result = await this.productsService.updateDownload(
      id,
      downloadId,
      dto,
    );
    await this.revalidateProduct(id);
    return result;
  }

  @Delete(':id/downloads/:downloadId')
  async removeDownload(
    @Param('id') id: string,
    @Param('downloadId') downloadId: string,
  ) {
    const result = await this.productsService.removeDownload(id, downloadId);
    await this.revalidateProduct(id);
    return result;
  }

  // ── Packaging / Application (FR-CMS-03, docs/04-database.md §6) ─────
  @Post(':id/packaging-applications')
  async addPackagingApplication(
    @Param('id') id: string,
    @Body() dto: UpsertProductPackagingApplicationDto,
  ) {
    const result = await this.productsService.addPackagingApplication(id, dto);
    await this.revalidateProduct(id);
    return result;
  }

  @Put(':id/packaging-applications/:entryId')
  async updatePackagingApplication(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpsertProductPackagingApplicationDto,
  ) {
    const result = await this.productsService.updatePackagingApplication(
      id,
      entryId,
      dto,
    );
    await this.revalidateProduct(id);
    return result;
  }

  @Delete(':id/packaging-applications/:entryId')
  async removePackagingApplication(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
  ) {
    const result = await this.productsService.removePackagingApplication(
      id,
      entryId,
    );
    await this.revalidateProduct(id);
    return result;
  }
}
