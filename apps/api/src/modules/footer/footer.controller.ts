import { Controller, Get } from '@nestjs/common';
import { FooterService } from './footer.service';

@Controller('api/v1/footer')
export class FooterController {
  constructor(private readonly footerService: FooterService) {}

  @Get()
  find() {
    return this.footerService.find();
  }
}
