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
import { ArticlesService } from './articles.service';
import {
  AddArticleGalleryItemDto,
  CreateArticleCategoryDto,
  CreateArticleDto,
  InstagramFetchDto,
  UpdateArticleCategoryDto,
  UpdateArticleDto,
  UpdateArticleGalleryItemDto,
} from './dto/article.dto';

@Controller('api/v1/admin/articles')
@UseGuards(JwtAuthGuard)
export class AdminArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly revalidation: RevalidationService,
  ) {}

  // Literal routes ("categories") must be declared before the ":id" param route below —
  // Nest/Express matches path segments in registration order, so "GET /categories" would
  // otherwise be swallowed by "GET /:id" with id="categories".
  @Get('categories')
  findCategories() {
    return this.articlesService.findCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateArticleCategoryDto) {
    return this.articlesService.createCategory(dto);
  }

  @Put('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateArticleCategoryDto,
  ) {
    return this.articlesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.articlesService.removeCategory(id);
  }

  // Also a literal route — must stay before "GET/POST/PUT/DELETE :id" below, same reason
  // as "categories" above.
  @Post('instagram/fetch')
  fetchInstagram(@Body() dto: InstagramFetchDto) {
    return this.articlesService.fetchInstagramMetadata(dto.url);
  }

  @Get()
  findAll() {
    return this.articlesService.findAllForAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findByIdForAdmin(id);
  }

  @Post()
  async create(@Body() dto: CreateArticleDto) {
    const article = await this.articlesService.create(dto);
    await this.revalidation.revalidate([
      '/articles',
      `/articles/${article.slug}`,
      '/',
    ]);
    return article;
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string) {
    return this.articlesService.duplicate(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    const article = await this.articlesService.update(id, dto);
    await this.revalidation.revalidate([
      '/articles',
      `/articles/${article.slug}`,
      '/',
    ]);
    return article;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.articlesService.remove(id);
    await this.revalidation.revalidate(['/articles', '/']);
    return result;
  }

  @Post(':id/gallery')
  addGalleryItem(
    @Param('id') id: string,
    @Body() dto: AddArticleGalleryItemDto,
  ) {
    return this.articlesService.addGalleryItem(id, dto);
  }

  @Put(':id/gallery/:galleryId')
  updateGalleryItem(
    @Param('id') id: string,
    @Param('galleryId') galleryId: string,
    @Body() dto: UpdateArticleGalleryItemDto,
  ) {
    return this.articlesService.updateGalleryItem(id, galleryId, dto);
  }

  @Delete(':id/gallery/:galleryId')
  removeGalleryItem(
    @Param('id') id: string,
    @Param('galleryId') galleryId: string,
  ) {
    return this.articlesService.removeGalleryItem(id, galleryId);
  }
}
