import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AI_PROVIDER } from './ai-provider.interface';
import { AnthropicProvider } from './anthropic.provider';

/** Split out of `AiModule` so any other module can get an `AiProvider` (e.g. for AI-assisted
 * translation) without importing `AiModule` itself — `AiModule` already imports `ProductsModule`
 * (for the content extractor), so `ProductsModule` importing `AiModule` back would be circular.
 * This module has no dependency on any content module, so anything can safely import it. */
@Module({
  imports: [ConfigModule],
  providers: [
    AnthropicProvider,
    {
      // Provider abstraction (brief §AR) — only this one factory line knows the current
      // provider is Anthropic; everything else depends on the `AiProvider` interface.
      provide: AI_PROVIDER,
      inject: [ConfigService, AnthropicProvider],
      useFactory: (config: ConfigService, anthropic: AnthropicProvider) => {
        const selected = config.get<string>('AI_PROVIDER', 'anthropic');
        if (selected !== 'anthropic') {
          throw new Error(
            `Unknown AI_PROVIDER "${selected}" — only "anthropic" is implemented.`,
          );
        }
        return anthropic;
      },
    },
  ],
  exports: [AI_PROVIDER],
})
export class AiProviderModule {}
