import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import type { AiProvider, AiProviderMessage } from './ai-provider.interface';

const DEFAULT_MODEL = 'claude-sonnet-5';

@Injectable()
export class AnthropicProvider implements AiProvider {
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.model = this.config.get<string>('AI_MODEL') || DEFAULT_MODEL;
    // The SDK throws in its constructor if given an empty string, so only construct it once a
    // real key is present — `isConfigured()` reflects this same check.
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async generateReply(params: {
    systemPrompt: string;
    history: AiProviderMessage[];
    userMessage: string;
    maxOutputTokens: number;
  }): Promise<string> {
    if (!this.client) {
      throw new Error('AnthropicProvider called without a configured API key.');
    }
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: params.maxOutputTokens,
      system: params.systemPrompt,
      messages: [
        ...params.history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: params.userMessage },
      ],
    });
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );
    if (!textBlock) {
      this.logger.warn('Anthropic response contained no text block.');
      return '';
    }
    return textBlock.text;
  }
}
