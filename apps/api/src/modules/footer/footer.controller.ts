import { Controller, Get, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { resolveLocale } from '../../common/utils/i18n.util';
import { FooterService } from './footer.service';

@SkipThrottle()
@Controller('api/v1/footer')
export class FooterController {
  constructor(private readonly footerService: FooterService) {}

  @Get()
  find(@Query('locale') locale?: string) {
    return this.footerService.find(resolveLocale(locale));
  }
}
