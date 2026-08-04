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

  // ── Gallery ─────────────────────────────────────────────────────────
  @Post(':id/gallery')
  addGalleryItem(
    @Param('id') id: string,
    @Body() dto: AddProductGalleryItemDto,
  ) {
    return this.productsService.addGalleryItem(id, dto);
  }

  @Put(':id/gallery/:galleryId')
  updateGalleryItem(
    @Param('id') id: string,
    @Param('galleryId') galleryId: string,
    @Body() dto: UpdateProductGalleryItemDto,
  ) {
    return this.productsService.updateGalleryItem(id, galleryId, dto);
  }

  @Delete(':id/gallery/:galleryId')
  removeGalleryItem(
    @Param('id') id: string,
    @Param('galleryId') galleryId: string,
  ) {
    return this.productsService.removeGalleryItem(id, galleryId);
  }

  // ── Specifications ──────────────────────────────────────────────────
  @Post(':id/specifications')
  addSpecification(
    @Param('id') id: string,
    @Body() dto: UpsertProductSpecificationDto,
  ) {
    return this.productsService.addSpecification(id, dto);
  }

  @Put(':id/specifications/:specId')
  updateSpecification(
    @Param('id') id: string,
    @Param('specId') specId: string,
    @Body() dto: UpsertProductSpecificationDto,
  ) {
    return this.productsService.updateSpecification(id, specId, dto);
  }

  @Delete(':id/specifications/:specId')
  removeSpecification(
    @Param('id') id: string,
    @Param('specId') specId: string,
  ) {
    return this.productsService.removeSpecification(id, specId);
  }

  // ── Downloads ───────────────────────────────────────────────────────
  @Post(':id/downloads')
  addDownload(@Param('id') id: string, @Body() dto: UpsertProductDownloadDto) {
    return this.productsService.addDownload(id, dto);
  }

  @Put(':id/downloads/:downloadId')
  updateDownload(
    @Param('id') id: string,
    @Param('downloadId') downloadId: string,
    @Body() dto: UpsertProductDownloadDto,
  ) {
    return this.productsService.updateDownload(id, downloadId, dto);
  }

  @Delete(':id/downloads/:downloadId')
  removeDownload(
    @Param('id') id: string,
    @Param('downloadId') downloadId: string,
  ) {
    return this.productsService.removeDownload(id, downloadId);
  }

  // ── Packaging / Application (FR-CMS-03, docs/04-database.md §6) ─────
  @Post(':id/packaging-applications')
  addPackagingApplication(
    @Param('id') id: string,
    @Body() dto: UpsertProductPackagingApplicationDto,
  ) {
    return this.productsService.addPackagingApplication(id, dto);
  }

  @Put(':id/packaging-applications/:entryId')
  updatePackagingApplication(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpsertProductPackagingApplicationDto,
  ) {
    return this.productsService.updatePackagingApplication(id, entryId, dto);
  }

  @Delete(':id/packaging-applications/:entryId')
  removePackagingApplication(
    @Param('id') id: string,
    @Param('entryId') entryId: string,
  ) {
    return this.productsService.removePackagingApplication(id, entryId);
  }
}
