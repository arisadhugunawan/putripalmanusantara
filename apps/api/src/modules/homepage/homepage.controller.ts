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
}
