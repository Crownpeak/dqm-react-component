import type { JsonChatClient, JsonChatResult } from './aiJsonClient';
import {
  getModelCapabilities,
  buildTokenParams,
  getSystemRole,
  buildReasoningParams,
  type ReasoningEffort,
} from './modelCapabilities';

export type OpenAIClientConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  reasoningEffort?: ReasoningEffort;
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
  const reasoningEffort = config.reasoningEffort;

  return {
    chatJson: async ({ system, user, maxTokens, schema, signal }: {
      system: string;
      user: string;
      maxTokens: number;
      schema?: string;
      signal?: AbortSignal;
    }): Promise<JsonChatResult> => {
      const capabilities = getModelCapabilities(model);

      // Build role based on model capabilities (developer for GPT-5, system for GPT-4)
      const systemRole = getSystemRole(model);

      // Build token parameters (max_completion_tokens for GPT-5, max_tokens for GPT-4)
      const tokenParams = buildTokenParams(model, maxTokens);

      // Build reasoning effort parameter (only for GPT-5 models)
      const reasoningParams = buildReasoningParams(model, reasoningEffort);

      // For structured outputs, we use json_schema on supported models
      // For legacy models, we fall back to json_object with schema hint in prompt
      const schemaHint = !capabilities.supportsStructuredOutputs && schema
        ? `\n\nSchema (JSON): ${schema}`
        : '';

      // Build response format based on model capabilities
      const responseFormat = capabilities.supportsStructuredOutputs && schema
        ? {
            response_format: {
              type: 'json_schema' as const,
              json_schema: {
                name: 'translation_result',
                strict: true,
                schema: JSON.parse(schema),
              },
            },
          }
        : { response_format: { type: 'json_object' as const } };

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          ...tokenParams,
          ...responseFormat,
          ...reasoningParams,
          messages: [
            { role: systemRole, content: `${system}${schemaHint}` },
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

