import { Controller, Get, Query } from '@nestjs/common';
import { resolveLocale } from '../../common/utils/i18n.util';
import { ContactPageService } from './contact-page.service';

@Controller('api/v1/contact-page')
export class ContactPageController {
  constructor(private readonly contactPageService: ContactPageService) {}

  @Get()
  getPublished(@Query('locale') locale?: string) {
    return this.contactPageService.getPublished(resolveLocale(locale));
  }
}
