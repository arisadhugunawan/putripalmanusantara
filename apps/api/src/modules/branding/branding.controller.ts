import { Controller, Get } from '@nestjs/common';
import { BrandingService } from './branding.service';

@Controller('api/v1/branding')
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Get()
  findPublic() {
    return this.brandingService.findPublic();
  }
}
