import { Controller, Get, Param, Query } from '@nestjs/common';
import { resolveLocale } from '../../common/utils/i18n.util';
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
  findLatest(@Query('locale') locale?: string) {
    return this.articlesService.findLatest(resolveLocale(locale));
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.articlesService.findPublishedBySlug(
      slug,
      resolveLocale(locale),
    );
  }
}
