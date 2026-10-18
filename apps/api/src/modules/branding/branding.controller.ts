import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { BrandingService } from './branding.service';

@SkipThrottle()
@Controller('api/v1/branding')
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Get()
  findPublic() {
    return this.brandingService.findPublic();
  }
}
