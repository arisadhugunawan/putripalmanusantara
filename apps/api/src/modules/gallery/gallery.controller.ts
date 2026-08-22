import { Controller, Get, Query } from '@nestjs/common';
import { resolveLocale } from '../../common/utils/i18n.util';
import { GalleryService } from './gallery.service';

@Controller('api/v1/gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get('categories')
  findCategories(@Query('locale') locale?: string) {
    return this.galleryService.findAllCategories(resolveLocale(locale), true);
  }

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('locale') locale?: string,
  ) {
    return this.galleryService.findPublic(category, resolveLocale(locale));
  }
}
