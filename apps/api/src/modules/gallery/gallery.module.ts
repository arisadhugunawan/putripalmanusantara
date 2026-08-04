import { Module } from '@nestjs/common';
import { AdminGalleryController } from './admin-gallery.controller';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

@Module({
  controllers: [GalleryController, AdminGalleryController],
  providers: [GalleryService],
})
export class GalleryModule {}
