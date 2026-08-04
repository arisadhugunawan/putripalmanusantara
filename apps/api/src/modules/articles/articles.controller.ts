import { Controller, Get, Param, Query } from '@nestjs/common';
import { ArticleQueryDto } from './dto/article.dto';
import { ArticlesService } from './articles.service';

@Controller('api/v1/articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  findAll(@Query() query: ArticleQueryDto) {
    return this.articlesService.findPublished(query);
  }

  @Get('latest')
  findLatest() {
    return this.articlesService.findLatest();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.articlesService.findPublishedBySlug(slug);
  }
}
