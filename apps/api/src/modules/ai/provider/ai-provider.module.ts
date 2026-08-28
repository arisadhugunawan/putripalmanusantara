import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AI_PROVIDER } from './ai-provider.interface';
import { AnthropicProvider } from './anthropic.provider';
import { GroqProvider } from './groq.provider';

/** Split out of `AiModule` so any other module can get an `AiProvider` (e.g. for AI-assisted
 * translation) without importing `AiModule` itself — `AiModule` already imports `ProductsModule`
 * (for the content extractor), so `ProductsModule` importing `AiModule` back would be circular.
 * This module has no dependency on any content module, so anything can safely import it. */
@Module({
  imports: [ConfigModule],
  providers: [
    AnthropicProvider,
    GroqProvider,
    {
      // Provider abstraction (brief §AR) — only this one factory line knows which concrete
      // provider is selected; everything else depends on the `AiProvider` interface. Defaults
      // to "groq" (free tier, no billing) — set AI_PROVIDER=anthropic to switch back.
      provide: AI_PROVIDER,
      inject: [ConfigService, AnthropicProvider, GroqProvider],
      useFactory: (
        config: ConfigService,
        anthropic: AnthropicProvider,
        groq: GroqProvider,
      ) => {
        const selected = config.get<string>('AI_PROVIDER', 'groq');
        if (selected === 'groq') return groq;
        if (selected === 'anthropic') return anthropic;
        throw new Error(
          `Unknown AI_PROVIDER "${selected}" — only "groq" and "anthropic" are implemented.`,
        );
      },
    },
  ],
  exports: [AI_PROVIDER],
})
export class AiProviderModule {}
