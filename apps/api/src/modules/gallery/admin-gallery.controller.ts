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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RevalidationService } from '../../revalidation/revalidation.service';
import {
  CreateGalleryCategoryDto,
  UpdateGalleryCategoryDto,
} from './dto/gallery-category.dto';
import {
  CreateGalleryItemDto,
  UpdateGalleryItemDto,
} from './dto/gallery-item.dto';
import { GalleryQueryDto } from './dto/gallery-query.dto';
import { GalleryService } from './gallery.service';

@Controller('api/v1/admin/gallery')
@UseGuards(JwtAuthGuard)
export class AdminGalleryController {
  constructor(
    private readonly galleryService: GalleryService,
    private readonly revalidation: RevalidationService,
  ) {}

  // NOTE: the literal "categories" routes must be declared before the `:id` item routes below —
  // Nest/Express match routes in declaration order, and `:id` would otherwise greedily swallow
  // a request for `/admin/gallery/categories` as if "categories" were an item id.
  @Get('categories')
  findCategories() {
    return this.galleryService.findAllCategories();
  }

  @Post('categories')
  async createCategory(@Body() dto: CreateGalleryCategoryDto) {
    const category = await this.galleryService.createCategory(dto);
    await this.revalidation.revalidate(['/gallery']);
    return category;
  }

  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateGalleryCategoryDto,
  ) {
    const category = await this.galleryService.updateCategory(id, dto);
    await this.revalidation.revalidate(['/gallery']);
    return category;
  }

  @Delete('categories/:id')
  async removeCategory(@Param('id') id: string) {
    const result = await this.galleryService.removeCategory(id);
    await this.revalidation.revalidate(['/gallery']);
    return result;
  }

  // `page` present → the Gallery list page (Phase 5C, paginated/searchable/filterable).
  // `page` absent → every other admin surface (Dashboard, Gallery overview stat tiles) that
  // still needs the full unpaginated list — unchanged from before Phase 5C.
  @Get()
  findAll(@Query() query: GalleryQueryDto) {
    if (query.page === undefined) {
      return this.galleryService.findAll();
    }
    return this.galleryService.findAllPaginated(query);
  }

  @Post()
  async create(@Body() dto: CreateGalleryItemDto) {
    const item = await this.galleryService.create(dto);
    await this.revalidation.revalidate(['/gallery', '/']);
    return item;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateGalleryItemDto) {
    const item = await this.galleryService.update(id, dto);
    await this.revalidation.revalidate(['/gallery']);
    return item;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.galleryService.remove(id);
    await this.revalidation.revalidate(['/gallery']);
    return result;
  }
}
