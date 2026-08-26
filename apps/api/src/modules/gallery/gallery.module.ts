import { Module } from '@nestjs/common';
import { AiTranslationModule } from '../ai/ai-translation.module';
import { AdminGalleryController } from './admin-gallery.controller';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

@Module({
  imports: [AiTranslationModule],
  controllers: [GalleryController, AdminGalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
