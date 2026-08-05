import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RevalidationService } from '../../revalidation/revalidation.service';
import {
  AddProductGalleryItemDto,
  UpdateProductGalleryItemDto,
  UpsertProductDownloadDto,
  UpsertProductPackagingApplicationDto,
  UpsertProductSpecificationDto,
} from './dto/product-subresources.dto';
import {
  CreateProductDto,
  SetFeaturedDto,
  UpdateProductDto,
} from './dto/product.dto';
import { ProductsService } from './products.service';

@Controller('api/v1/admin/products')
@UseGuards(JwtAuthGuard)
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly revalidation: RevalidationService,
  ) {}

  @Get()
  findAll() {
    return this.productsService.findAllForAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findByIdForAdmin(id);
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
