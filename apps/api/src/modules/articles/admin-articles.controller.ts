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
import { ArticlesService } from './articles.service';
import { AdminArticleQueryDto } from './dto/admin-article-query.dto';
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
@UseGuards(JwtAuthGuard, RolesGuard)
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

  // `page` present → the Articles list page (Phase 5C, paginated/searchable/filterable).
  // `page` absent → every other admin surface (Dashboard, article-preview-by-id lookup) that
  // still needs the full unpaginated list — unchanged from before Phase 5C.
  @Get()
  findAll(@Query() query: AdminArticleQueryDto) {
    if (query.page === undefined) {
      return this.articlesService.findAllForAdmin();
    }
    return this.articlesService.findAllForAdminPaginated(query);
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

  // Publish/unpublish/restore are the only Article actions restricted to super_admin —
  // matching the exact scope Homepage/About Company/Products already use (Phase 5F-P0.2 /
  // P0.2b-C). Ordinary content CRUD above (create/update/delete/gallery/categories) and version
  // history below stay open to every authenticated admin, unchanged.
  @Post(':id/publish')
  @Roles('super_admin')
  async publish(
    @Param('id') id: string,
    @CurrentAdmin() admin: CurrentAdminPayload,
  ) {
    const snapshot = await this.articlesService.publish(id, admin);
    const slug = await this.articlesService.getSlug(id);
    await this.revalidation.revalidate([
      '/articles',
      ...(slug ? [`/articles/${slug}`] : []),
      '/',
    ]);
    return snapshot;
  }

  @Post(':id/unpublish')
  @Roles('super_admin')
  async unpublish(@Param('id') id: string) {
    const article = await this.articlesService.unpublish(id);
    await this.revalidation.revalidate([
      '/articles',
      `/articles/${article.slug}`,
      '/',
    ]);
    return article;
  }

  @Get(':id/snapshots')
  listSnapshots(@Param('id') id: string) {
    return this.articlesService.listSnapshots(id);
  }

  @Post(':id/snapshots/:snapshotId/restore')
  @Roles('super_admin')
  async restoreSnapshot(
    @Param('id') id: string,
    @Param('snapshotId') snapshotId: string,
    @CurrentAdmin() admin: CurrentAdminPayload,
  ) {
    const snapshot = await this.articlesService.restoreSnapshot(
      id,
      snapshotId,
      admin,
    );
    const slug = await this.articlesService.getSlug(id);
    await this.revalidation.revalidate([
      '/articles',
      ...(slug ? [`/articles/${slug}`] : []),
      '/',
    ]);
    return snapshot;
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
