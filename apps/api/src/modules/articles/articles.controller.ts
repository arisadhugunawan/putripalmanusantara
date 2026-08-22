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

  @Get('categories')
  findCategories() {
    return this.articlesService.findPublicCategories();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.articlesService.findPublishedBySlug(
      slug,
      resolveLocale(locale),
    );
  }

  @Get(':slug/related')
  async findRelated(
    @Param('slug') slug: string,
    @Query('locale') locale?: string,
  ) {
    const resolvedLocale = resolveLocale(locale);
    const article = await this.articlesService.findPublishedBySlug(
      slug,
      resolvedLocale,
    );
    return this.articlesService.findRelated(article.id, resolvedLocale);
  }
}
