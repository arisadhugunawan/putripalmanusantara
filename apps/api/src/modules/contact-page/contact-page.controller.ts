import { Controller, Get } from '@nestjs/common';
import { ContactPageService } from './contact-page.service';

@Controller('api/v1/contact-page')
export class ContactPageController {
  constructor(private readonly contactPageService: ContactPageService) {}

  @Get()
  getPublished() {
    return this.contactPageService.getPublished();
  }
}
