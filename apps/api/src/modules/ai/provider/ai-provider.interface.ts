export interface AiProviderMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Provider abstraction (brief §AR) — nothing outside this file and its concrete
 * implementations knows which LLM vendor is in use. Swapping providers later means adding one
 * new class + one line in `AiProviderModule`, never touching `AiChatService`, retrieval, or the
 * frontend. `AI_PROVIDER` env var selects the implementation; `AI_MODEL` is provider-specific
 * and passed straight through.
 */
export const AI_PROVIDER = Symbol('AI_PROVIDER');

export interface AiProvider {
  /** Returns `null` when the provider isn't configured (no API key) rather than throwing —
   * callers treat `null` as "assistant temporarily unavailable" (brief §AB), a normal,
   * expected state in any environment that hasn't added a key yet, not an error to log loudly. */
  isConfigured(): boolean;
  generateReply(params: {
    systemPrompt: string;
    history: AiProviderMessage[];
    userMessage: string;
    maxOutputTokens: number;
  }): Promise<string>;
}
