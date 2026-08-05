import { Controller, Get, Query } from '@nestjs/common';
import { resolveLocale } from '../../common/utils/i18n.util';
import { GalleryQueryDto } from './dto/gallery.dto';
import { GalleryService } from './gallery.service';

@Controller('api/v1/gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  findAll(@Query() query: GalleryQueryDto, @Query('locale') locale?: string) {
    return this.galleryService.findAll(query.category, resolveLocale(locale));
  }
}
