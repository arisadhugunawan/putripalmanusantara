import { Controller, Get, Param, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { resolveLocale } from '../../common/utils/i18n.util';
import { PageHeaderService } from './page-header.service';

@SkipThrottle()
@Controller('api/v1/page-headers')
export class PageHeaderController {
  constructor(private readonly pageHeaderService: PageHeaderService) {}

  @Get(':pageKey')
  resolve(@Param('pageKey') pageKey: string, @Query('locale') locale?: string) {
    return this.pageHeaderService.resolve(pageKey, resolveLocale(locale));
  }
}
