import { Module } from '@nestjs/common';
import { AiProviderModule } from './provider/ai-provider.module';
import { AiTranslationService } from './ai-translation.service';

/** Standalone so any content module (Products, and later Articles/Homepage/etc.) can import
 * just this, without pulling in `AiModule` itself — see `AiProviderModule`'s doc comment for
 * why that matters (`AiModule` already imports `ProductsModule`). */
@Module({
  imports: [AiProviderModule],
  providers: [AiTranslationService],
  exports: [AiTranslationService],
})
export class AiTranslationModule {}
