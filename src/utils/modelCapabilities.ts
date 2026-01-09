/**
 * Model Capabilities Utility
 *
 * Provides model detection and capability information for OpenAI models.
 * Handles differences between GPT-4.x and GPT-5.x API requirements.
 */

export type ReasoningEffort = 'low' | 'medium' | 'high';

export interface ModelCapabilities {
  /** Whether the model supports structured outputs (json_schema) */
  supportsStructuredOutputs: boolean;
  /** Whether the model supports reasoning_effort parameter */
  supportsReasoningEffort: boolean;
  /** Whether to use max_completion_tokens instead of max_tokens */
  supportsMaxCompletionTokens: boolean;
  /** Whether to use developer role instead of system role */
  supportsDeveloperRole: boolean;
  /** Context window size in tokens */
  contextWindow: number;
  /** Maximum output tokens */
  maxOutputTokens: number;
  /** Model generation (4 or 5) */
  generation: 4 | 5;
}

/**
 * Check if model is a GPT-5.x model
 */
export const isGPT5Model = (modelId: string): boolean => {
  const id = modelId.toLowerCase();
  return (
    id.startsWith('gpt-5') ||
    id.includes('gpt-5.') ||
    id.includes('gpt-5-')
  );
};

/**
 * Check if model is a reasoning model (o-series or GPT-5)
 */
export const isReasoningModel = (modelId: string): boolean => {
  const id = modelId.toLowerCase();
  return (
    id.startsWith('o1') ||
    id.startsWith('o3') ||
    id.startsWith('o4') ||
    isGPT5Model(id)
  );
};

/**
 * Get capabilities for a specific model
 */
export const getModelCapabilities = (modelId: string): ModelCapabilities => {
  const id = modelId.toLowerCase();

  // GPT-5.2 (latest)
  if (id.includes('gpt-5.2')) {
    return {
      supportsStructuredOutputs: true,
      supportsReasoningEffort: true,
      supportsMaxCompletionTokens: true,
      supportsDeveloperRole: true,
      contextWindow: 1_000_000,
      maxOutputTokens: 65_536,
      generation: 5,
    };
  }

  // GPT-5 generic (fallback)
  if (id.startsWith('gpt-5-') || id === 'gpt-5') {
    return {
      supportsStructuredOutputs: true,
      supportsReasoningEffort: true,
      supportsMaxCompletionTokens: true,
      supportsDeveloperRole: true,
      contextWindow: id.includes('nano') ? 128_000 : 1_000_000,
      maxOutputTokens: id.includes('nano') ? 16_384 : 32_768,
      generation: 5,
    };
  }

  // GPT-5-mini / GPT-5-nano
  if (id.includes('gpt-5') && (id.includes('mini') || id.includes('nano'))) {
    return {
      supportsStructuredOutputs: true,
      supportsReasoningEffort: true,
      supportsMaxCompletionTokens: true,
      supportsDeveloperRole: true,
      contextWindow: id.includes('nano') ? 128_000 : 256_000,
      maxOutputTokens: id.includes('nano') ? 16_384 : 32_768,
      generation: 5,
    };
  }

  // GPT-4.1 Serie
  if (id.includes('gpt-4.1')) {
    return {
      supportsStructuredOutputs: true,
      supportsReasoningEffort: false,
      supportsMaxCompletionTokens: true,
      supportsDeveloperRole: false,
      contextWindow: id.includes('mini') ? 256_000 : 1_047_576,
      maxOutputTokens: id.includes('mini') ? 16_384 : 32_768,
      generation: 4,
    };
  }

  // GPT-4o Serie
  if (id.includes('gpt-4o')) {
    return {
      supportsStructuredOutputs: true,
      supportsReasoningEffort: false,
      supportsMaxCompletionTokens: true,
      supportsDeveloperRole: false,
      contextWindow: 128_000,
      maxOutputTokens: 16_384,
      generation: 4,
    };
  }

  // o-series reasoning models
  if (id.startsWith('o1') || id.startsWith('o3') || id.startsWith('o4')) {
    return {
      supportsStructuredOutputs: true,
      supportsReasoningEffort: true,
      supportsMaxCompletionTokens: true,
      supportsDeveloperRole: true,
      contextWindow: 200_000,
      maxOutputTokens: 32_768,
      generation: 4,
    };
  }

  // Legacy GPT-4 / GPT-3.5
  return {
    supportsStructuredOutputs: false,
    supportsReasoningEffort: false,
    supportsMaxCompletionTokens: false,
    supportsDeveloperRole: false,
    contextWindow: 128_000,
    maxOutputTokens: 4_096,
    generation: 4,
  };
};

/**
 * Get the context budget for translation based on model
 * Returns a conservative estimate for chunking decisions
 */
export const getContextBudgetTokens = (modelId: string): number => {
  const capabilities = getModelCapabilities(modelId);

  // GPT-5.x models can handle much larger contexts
  if (capabilities.generation === 5) {
    return 50_000;
  }

  // GPT-4.1 models have large context windows
  if (modelId.toLowerCase().includes('gpt-4.1')) {
    return 30_000;
  }

  // GPT-4o and o-series
  if (
    modelId.toLowerCase().includes('gpt-4o') ||
    modelId.toLowerCase().startsWith('o1') ||
    modelId.toLowerCase().startsWith('o3') ||
    modelId.toLowerCase().startsWith('o4')
  ) {
    return 12_000;
  }

  // Legacy models - conservative
  return 8_000;
};

/**
 * Build token limit parameters based on model capabilities
 */
export const buildTokenParams = (
  modelId: string,
  maxTokens: number
): { max_tokens?: number; max_completion_tokens?: number } => {
  const capabilities = getModelCapabilities(modelId);

  if (capabilities.supportsMaxCompletionTokens) {
    return { max_completion_tokens: maxTokens };
  }

  return { max_tokens: maxTokens };
};

/**
 * Build response format based on model capabilities
 */
export const buildResponseFormat = (
  modelId: string,
  schema?: object
): { response_format: { type: 'json_object' } | { type: 'json_schema'; json_schema: object } } => {
  const capabilities = getModelCapabilities(modelId);

  if (capabilities.supportsStructuredOutputs && schema) {
    return {
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'translation_result',
          strict: true,
          schema: {
            type: 'object',
            ...schema,
            additionalProperties: false,
          },
        },
      },
    };
  }

  // Fallback for older models
  return {
    response_format: { type: 'json_object' },
  };
};

/**
 * Get the appropriate message role based on model capabilities
 */
export const getSystemRole = (modelId: string): 'system' | 'developer' => {
  const capabilities = getModelCapabilities(modelId);
  return capabilities.supportsDeveloperRole ? 'developer' : 'system';
};

/**
 * Build reasoning effort parameter if supported
 */
export const buildReasoningParams = (
  modelId: string,
  reasoningEffort: ReasoningEffort | undefined
): { reasoning_effort?: ReasoningEffort } => {
  if (!reasoningEffort) return {};

  const capabilities = getModelCapabilities(modelId);

  if (capabilities.supportsReasoningEffort) {
    return { reasoning_effort: reasoningEffort };
  }

  return {};
};
