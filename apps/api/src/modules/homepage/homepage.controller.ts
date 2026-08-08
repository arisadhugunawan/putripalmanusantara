import { Controller, Get, Query } from '@nestjs/common';
import { resolveLocale } from '../../common/utils/i18n.util';
import { HomepageService } from './homepage.service';

@Controller('api/v1/homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get('statistics')
  findStatistics(@Query('locale') locale?: string) {
    return this.homepageService.findStatistics(resolveLocale(locale));
  }

  @Get('hero-slides')
  findHeroSlides(@Query('locale') locale?: string) {
    return this.homepageService.findHeroSlides(resolveLocale(locale), true);
  }

  @Get('partner-logos')
  findPartnerLogos(@Query('locale') locale?: string) {
    return this.homepageService.findPartnerLogos(resolveLocale(locale), true);
  }

  @Get('decorative-graphics')
  findDecorativeGraphics(@Query('page') page?: string) {
    return this.homepageService.findDecorativeGraphics(page, true);
  }

  @Get('about-preview')
  findAboutPreview(@Query('locale') locale?: string) {
    return this.homepageService.findAboutPreview(resolveLocale(locale));
  }

  @Get('highlights')
  findHighlights(@Query('locale') locale?: string) {
    return this.homepageService.findHighlights(resolveLocale(locale), true);
  }

  @Get('partners-section')
  findPartnersSection(@Query('locale') locale?: string) {
    return this.homepageService.findPartnersSection(resolveLocale(locale));
  }
}
