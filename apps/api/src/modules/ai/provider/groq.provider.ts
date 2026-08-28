import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiProvider, AiProviderMessage } from './ai-provider.interface';

// Groq's hosted model lineup changes over time — this was verified live against
// GET https://api.groq.com/openai/v1/models. `openai/gpt-oss-20b` is the smaller sibling of
// `openai/gpt-oss-120b` — picked over the 120b for the DEFAULT because Groq's free tier grants
// meaningfully more tokens-per-minute headroom to smaller models, and a translation task like
// this doesn't need the 120b's extra capacity. `qwen/qwen3.8-27b` is a solid alternative if
// translation quality into Chinese/Thai/Vietnamese specifically needs tuning (Qwen is trained
// with heavier emphasis on those languages). Override via AI_MODEL if Groq retires this one too.
const DEFAULT_MODEL = 'openai/gpt-oss-20b';
const GROQ_CHAT_COMPLETIONS_URL =
  'https://api.groq.com/openai/v1/chat/completions';
const MAX_RATE_LIMIT_RETRIES = 3;

/** Groq's API is OpenAI-compatible (chat completions shape), so no vendor SDK is needed — a
 * plain `fetch` against their endpoint is the whole client. Free-tier API key from
 * console.groq.com, no billing required for this project's usage. */
@Injectable()
export class GroqProvider implements AiProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private readonly apiKey: string | null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GROQ_API_KEY') || null;
    this.model = this.config.get<string>('AI_MODEL') || DEFAULT_MODEL;
  }

  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  async generateReply(params: {
    systemPrompt: string;
    history: AiProviderMessage[];
    userMessage: string;
    maxOutputTokens: number;
  }): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GroqProvider called without a configured API key.');
    }
    const body = JSON.stringify({
      model: this.model,
      max_tokens: params.maxOutputTokens,
      // The gpt-oss family (this provider's default model) is a reasoning model — without
      // capping its "thinking" effort, it can burn the entire `max_tokens` budget on hidden
      // chain-of-thought and return an empty `content` for anything but the shortest prompts
      // (verified live: reasoning_effort omitted → empty content on a 6-field/5-locale
      // translation request; "low" → correct JSON every time). Non-reasoning models on Groq
      // ignore unrecognized fields, so this is safe to send unconditionally.
      reasoning_effort: 'low',
      messages: [
        { role: 'system', content: params.systemPrompt },
        ...params.history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: params.userMessage },
      ],
    });

    // Retries only on 429 (Groq's free-tier tokens-per-minute limit) — every other failure
    // (bad request, auth, 5xx) surfaces immediately rather than burning retries on something a
    // retry can't fix. A burst of `generateAndMerge()` calls (e.g. bulk-generating translations
    // across many rows) can easily outrun the free tier's per-minute budget even with pacing on
    // the caller's side, so this is the layer that actually has to cope with it.
    for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
      const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body,
      });
      if (response.ok) {
        const json = (await response.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = json.choices?.[0]?.message?.content;
        if (!content) {
          this.logger.warn('Groq response contained no message content.');
          return '';
        }
        return content;
      }
      const responseBody = await response.text().catch(() => '');
      if (response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        const waitMs = retryAfterMs(responseBody) ?? (attempt + 1) * 4000;
        this.logger.warn(
          `Groq rate limit hit, retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES})`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      throw new Error(
        `Groq API request failed (${response.status}): ${responseBody.slice(0, 500)}`,
      );
    }
    // Unreachable — the loop always returns or throws — but keeps TypeScript's control-flow
    // analysis happy about every path returning a string.
    return '';
  }
}

/** Groq's 429 body embeds the real wait time in prose (e.g. "Please try again in 4.2s" or
 * "...in 850ms") — parsed out so the retry waits exactly as long as needed instead of a blind
 * fixed backoff. Returns `null` (falls back to the fixed backoff) if the message doesn't match,
 * since Groq's exact wording isn't a documented contract. */
function retryAfterMs(responseBody: string): number | null {
  const match = /try again in ([\d.]+)(ms|s)/i.exec(responseBody);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (Number.isNaN(value)) return null;
  const ms = match[2].toLowerCase() === 's' ? value * 1000 : value;
  // Small buffer on top of Groq's own estimate — being right at the edge of the window still
  // risks a second 429 if this request's own latency pushes it a few ms past the reset.
  return Math.ceil(ms) + 250;
}
