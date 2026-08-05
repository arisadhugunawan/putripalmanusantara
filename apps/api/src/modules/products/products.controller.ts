import { Controller, Get, Param, Query } from '@nestjs/common';
import { resolveLocale } from '../../common/utils/i18n.util';
import { ProductsService } from './products.service';

@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query('locale') locale?: string) {
    return this.productsService.findPublished(resolveLocale(locale));
  }

  @Get('featured')
  findFeatured(@Query('locale') locale?: string) {
    return this.productsService.findFeatured(resolveLocale(locale));
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @Query('locale') locale?: string) {
    return this.productsService.findPublishedBySlug(
      slug,
      resolveLocale(locale),
    );
  }
}
