import { Controller, Get, Query } from '@nestjs/common';
import { resolveLocale } from '../../common/utils/i18n.util';
import { FaqsService } from './faqs.service';

@Controller('api/v1/faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Get()
  findAll(@Query('locale') locale?: string) {
    return this.faqsService.findPublished(resolveLocale(locale));
  }
}
