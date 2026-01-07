export type JsonChatResult = {
  content: string;
  finishReason?: string | null;
};

export interface JsonChatClient {
  /**
   * Run a non-streaming chat completion that is expected to return JSON.
   * Implementations may enforce JSON mode (e.g. response_format).
   */
  chatJson: (opts: {
    system: string;
    user: string;
    maxTokens: number;
    schema?: string;
    resetChat?: boolean;
    signal?: AbortSignal;
  }) => Promise<JsonChatResult>;

  /** Optional: reset internal state (KV cache, etc.). */
  reset?: (keepStats?: boolean) => Promise<void>;

  /** Optional: interrupt an ongoing generation. */
  interrupt?: () => void;
}

