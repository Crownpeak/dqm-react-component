import type { JsonChatClient, JsonChatResult } from './aiJsonClient';

export type OpenAIClientConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

type OpenAIChatResponse = {
  choices?: Array<{
    finish_reason?: string | null;
    message?: { content?: string | null };
  }>;
};

export const createOpenAIJsonClient = (config: OpenAIClientConfig): JsonChatClient => {
  const baseUrl = (config.baseUrl ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = config.model;
  const apiKey = config.apiKey;

  return {
    chatJson: async ({ system, user, maxTokens, schema, signal }: {
      system: string;
      user: string;
      maxTokens: number;
      schema?: string;
      signal?: AbortSignal;
    }): Promise<JsonChatResult> => {
      // Use JSON mode for broad compatibility; schema is reinforced via instruction.
      const schemaHint = schema ? `\n\nSchema (JSON): ${schema}` : '';
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: `${system}${schemaHint}` },
            { role: 'user', content: user },
          ],
        }),
        signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}${text ? `\n${text}` : ''}`);
      }

      const data = (await response.json()) as OpenAIChatResponse;
      return {
        content: data.choices?.[0]?.message?.content ?? '',
        finishReason: data.choices?.[0]?.finish_reason ?? null,
      };
    },
  };
};

