import { Controller, Get } from '@nestjs/common';
import { FaqsService } from './faqs.service';

@Controller('api/v1/faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Get()
  findAll() {
    return this.faqsService.findPublished();
  }
}
