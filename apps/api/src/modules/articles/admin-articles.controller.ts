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
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

@Controller('api/v1/admin/articles')
@UseGuards(JwtAuthGuard)
export class AdminArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly revalidation: RevalidationService,
  ) {}

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
}
