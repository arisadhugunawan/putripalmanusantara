import { Controller, Get, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { resolveLocale } from '../../common/utils/i18n.util';
import { AboutCompanyService } from './about-company.service';

@SkipThrottle()
@Controller('api/v1/about-company')
export class AboutCompanyController {
  constructor(private readonly aboutCompanyService: AboutCompanyService) {}

  @Get('published-snapshot')
  getPublishedSnapshot(@Query('locale') locale?: string) {
    return this.aboutCompanyService.getPublishedAboutCompany(
      resolveLocale(locale),
    );
  }
}
