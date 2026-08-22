import { Module } from '@nestjs/common';
import { AdminBrandingController } from './admin-branding.controller';
import { BrandingController } from './branding.controller';
import { BrandingService } from './branding.service';

@Module({
  controllers: [BrandingController, AdminBrandingController],
  providers: [BrandingService],
})
export class BrandingModule {}
