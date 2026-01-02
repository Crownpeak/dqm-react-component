import type { AnalysisData, Checkpoint } from '../types';
import type { JsonChatClient } from './aiJsonClient';
import type { TranslationCache } from './translationCache';
import {
  fnv1aHash,
  computeCheckpointSourceHash,
  makeCheckpointKey,
  makeLabelKey,
} from './translationCache';

export type WebLLMInitProgress = {
  progress: number;
  text: string;
  timeElapsed: number;
};

export type SummaryStats = {
  chunked: boolean;
  chunkCount: number;
  totalFailed: number;
  attempts: number;
  emptyResponses: number;
  fallbackUsed: 'none' | 'chunk' | 'single' | 'tiny' | 'fail';
  modelId?: string;
  targetLang?: string;
  durationMs: number;
};

export type WebLLMEngine = {
  unload: () => Promise<void>;
  interruptGenerate: () => void;
  terminate?: () => void;
  resetChat?: (keepStats?: boolean) => Promise<void> | void;
  chat: {
    completions: {
      create: (request: {
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
        temperature?: number | null;
        top_p?: number | null;
        max_tokens?: number | null;
        response_format?: { type?: 'text' | 'json_object' | 'grammar'; schema?: string } | null;
        enable_thinking?: boolean | null;
      }) => Promise<{
        choices?: Array<{ message?: { content?: string | null } }>;
      }>;
    };
  };
};

type WebLLMModule = {
  CreateMLCEngine: (
    modelId: string | string[],
    engineConfig?: { initProgressCallback?: (report: WebLLMInitProgress) => void; logLevel?: string; appConfig?: any },
  ) => Promise<WebLLMEngine>;
  CreateWebWorkerMLCEngine?: (
    worker: any,
    modelId: string | string[],
    engineConfig?: { appConfig?: any; initProgressCallback?: (report: WebLLMInitProgress) => void; logLevel?: string },
  ) => Promise<WebLLMEngine>;
  prebuiltAppConfig: {
    model_list: Array<{
      model_id: string;
      vram_required_MB?: number;
      model_type?: number;
      low_resource_required?: boolean;
    }>;
  };
  ModelType: { LLM: number; embedding: number; VLM: number };
  hasModelInCache?: (modelId: string) => Promise<boolean> | boolean;
  deleteChatConfigInCache?: (modelId: string) => Promise<void> | void;
  deleteModelAllInfoInCache?: (modelId: string) => Promise<void> | void;
  deleteModelWasmInCache?: (modelId: string) => Promise<void> | void;
  deleteModelInCache?: (modelId: string) => Promise<void> | void;
};

export const isWebGPUSupported = (): boolean =>
  typeof navigator !== 'undefined' && 'gpu' in navigator;

export const createWebLLMJsonClient = (engine: WebLLMEngine): JsonChatClient => ({
  chatJson: async ({ system, user, maxTokens, schema, resetChat, signal }) => {
    const abortHandler = () => engine.interruptGenerate();
    signal?.addEventListener('abort', abortHandler, { once: true });
    try {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      if (resetChat && engine.resetChat) {
        try {
          await engine.resetChat(true);
        } catch {
          // ignore
        }
      }
      const send = async (forceTextSchema: boolean) => {
        return await engine.chat.completions.create({
          messages: [
            forceTextSchema
              ? { role: 'system', content: schema ? `${system}\n\nSchema (JSON): ${schema}` : system }
              : { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: 0,
          top_p: 1,
          max_tokens: maxTokens,
          enable_thinking: false,
          response_format: forceTextSchema
            ? undefined
            : (schema ? { type: 'json_object', schema } : undefined),
        });
      };

      let response;
      try {
        response = await send(false);
      } catch (err) {
        // Fallback to text schema if GrammarMatcher/formatting fails.
        response = await send(true);
      }
      return {
        content: response.choices?.[0]?.message?.content ?? '',
        finishReason: (response as any)?.choices?.[0]?.finish_reason ?? null,
      };
    } finally {
      signal?.removeEventListener('abort', abortHandler);
    }
  },
  reset: async (keepStats?: boolean) => {
    if (!engine.resetChat) return;
    await engine.resetChat(keepStats);
  },
  interrupt: () => engine.interruptGenerate(),
});

export const pickDefaultTranslationModelId = (webllm: WebLLMModule): string => {
  const { prebuiltAppConfig, ModelType } = webllm;
  const candidates = prebuiltAppConfig.model_list
    .filter((model) => (model.model_type ?? ModelType.LLM) === ModelType.LLM)
    .filter((model) => /instruct/i.test(model.model_id))
    .sort((a, b) => (a.vram_required_MB ?? Number.POSITIVE_INFINITY) - (b.vram_required_MB ?? Number.POSITIVE_INFINITY));

  const preferredOrder = [
    'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    'Phi-3.5-mini-instruct-q4f16_1-MLC-1k',
  ];
  for (const preferred of preferredOrder) {
    const found = candidates.find((m) => m.model_id === preferred);
    if (found) return found.model_id;
  }

  const chosen = candidates[0]?.model_id ?? prebuiltAppConfig.model_list[0]?.model_id;
  if (!chosen) throw new Error('No WebLLM models available in prebuiltAppConfig');
  return chosen;
};

const loadWebLLMModule = async (cdnUrl?: string): Promise<WebLLMModule> => {
  // Try multiple JS endpoints to avoid bad MIME types from some CDNs/proxies.
  const candidates = [
    cdnUrl?.trim(),
    'https://esm.sh/@mlc-ai/web-llm@latest?module',
    'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm/dist/index.js',
  ].filter(Boolean) as string[];

  for (const url of candidates) {
    try {
      return (await import(/* @vite-ignore */ url)) as unknown as WebLLMModule;
    } catch {
      // try next
    }
  }
  // Fallback to bundled dependency if available.
  return (await import('@mlc-ai/web-llm')) as unknown as WebLLMModule;
};

export const createWebLLMEngine = async (opts: {
  modelId?: string;
  onInitProgress?: (report: WebLLMInitProgress) => void;
  useIndexedDBCache?: boolean;
  webllmCdnUrl?: string;
  useWebWorker?: boolean;
}): Promise<{ engine: WebLLMEngine; modelId: string }> => {
  const webllm = await loadWebLLMModule(opts.webllmCdnUrl);
  const modelId = opts.modelId ?? pickDefaultTranslationModelId(webllm);
  const baseAppConfig = {
    ...webllm.prebuiltAppConfig,
    useIndexedDBCache: opts.useIndexedDBCache ?? true,
  };

  const create = async () => {
    if (opts.useWebWorker && webllm.CreateWebWorkerMLCEngine) {
      const worker = new Worker(new URL('../workers/webllm.worker.ts', import.meta.url), { type: 'module' });
      return await webllm.CreateWebWorkerMLCEngine(worker, modelId, {
        appConfig: baseAppConfig,
        initProgressCallback: opts.onInitProgress,
        logLevel: 'WARN',
      });
    }
    return await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: opts.onInitProgress,
      logLevel: 'WARN',
      appConfig: baseAppConfig,
    });
  };

  try {
    const engine = await create();
    return { engine, modelId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Workaround for WebLLM IndexedDB "ConstraintError: Key already exists" on some browsers when switching models.
    if (/ConstraintError/i.test(message) && /Key already exists/i.test(message)) {
      try {
        // Treat as partially-cached/corrupt and clear model artifacts before retry.
        await webllm.deleteChatConfigInCache?.(modelId);
        await webllm.deleteModelWasmInCache?.(modelId);
        await webllm.deleteModelInCache?.(modelId);
        await webllm.deleteModelAllInfoInCache?.(modelId);
      } catch {
        // Ignore cache deletion failures; retry anyway.
      }
      try {
        const engine = await create();
        return { engine, modelId };
      } catch (err2) {
        const message2 = err2 instanceof Error ? err2.message : String(err2);
        if (/ConstraintError/i.test(message2) && /Key already exists/i.test(message2)) {
          // Last resort: fall back to Cache API for WebLLM model artifacts (translation cache still uses IndexedDB).
          const fallbackAppConfig = { ...baseAppConfig, useIndexedDBCache: false };
          const createFallback = async () => {
            return await webllm.CreateMLCEngine(modelId, {
              initProgressCallback: opts.onInitProgress,
              logLevel: 'WARN',
              appConfig: fallbackAppConfig,
            });
          };
          const engine = await createFallback();
          return { engine, modelId };
        }
        throw err2;
      }
    }
    throw err;
  }
};

const stripNextStepPrefix = (text: string): string => {
  if (!text) return text;
  // Common LLM artifact: prepend "Next step:" / "Nächster Schritt:" to each bullet.
  const withoutLiPrefix = text.replace(
    /(<li>\s*)(?:Nächste(?:r|n)? Schritt:|Next step:)\s*/gi,
    '$1',
  );
  return withoutLiPrefix.replace(
    /(^\s*(?:[-*]\s*|\d+\.\s*)?)(?:Nächste(?:r|n)? Schritt:|Next step:)\s*/gim,
    '$1',
  );
};

const approximateTokens = (text: string): number => Math.ceil(text.length / 4);

const estimateContextBudgetTokens = (modelId: string): number => {
  const id = modelId.toLowerCase();
  // OpenAI models (used via API backend) generally have large context windows.
  if (id.startsWith('gpt-') || id.includes('gpt-4') || id.includes('gpt-3.5') || id.includes('o1') || id.includes('o3')) return 12000;
  if (id.includes('ctx4k') || id.includes('4k')) return 3500;
  if (id.includes('-1k') || id.includes('ctx1k') || id.includes('1k')) return 900;
  // Conservative default.
  return 2500;
};

const languageNameForPrompt = (lang: string): string => {
  const code = (lang || '').toLowerCase().split('-')[0];
  if (code === 'en') return 'English';
  if (code === 'de') return 'German';
  if (code === 'es') return 'Spanish';
  return code || lang || 'the target language';
};

const languageInstructionForPrompt = (lang: string): string => {
  const code = (lang || '').toLowerCase().split('-')[0];
  if (code === 'en') return 'Write in English.';
  if (code === 'de') return 'Schreibe auf Deutsch.';
  if (code === 'es') return 'Escribe en español.';
  return `Write in ${languageNameForPrompt(lang)} (${lang}).`;
};

const isContextWindowError = (err: unknown): boolean => {
  const message = err instanceof Error ? err.message : String(err);
  return /Prompt tokens exceed context window size/i.test(message) || /context window size/i.test(message);
};

const truncateByChars = (text: string, maxChars: number): string => {
  if (!text) return text;
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1))}…`;
};

const clampCheckpointItemsToBudget = <T extends { name: string; description: string; category: string; topics: string[] }>(
  system: string,
  schema: unknown,
  targetLanguage: string,
  items: T[],
  budgetTokens: number,
  opts?: { maxDescriptionChars?: number; dropTopics?: boolean },
): T[] => {
  const maxDescriptionChars = opts?.maxDescriptionChars ?? (budgetTokens <= 1024 ? 600 : 2400);
  const dropTopics = opts?.dropTopics === true;
  const normalized = items.map((item) => ({
    ...item,
    name: truncateByChars(item.name, 220),
    category: truncateByChars(item.category, 140),
    topics: dropTopics ? [] : (item.topics ?? []).map((t) => truncateByChars(t, 60)).slice(0, 8),
    description: truncateByChars(item.description ?? '', maxDescriptionChars),
  }));

  const buildPayload = (xs: T[]) => JSON.stringify({ targetLanguage, items: xs, schema });
  let current = normalized;
  let estimated = approximateTokens(system) + approximateTokens(buildPayload(current)) + 128;

  // If still too large, shrink description further.
  let descChars = maxDescriptionChars;
  while (estimated > budgetTokens && descChars > 200) {
    descChars = Math.floor(descChars * 0.7);
    current = current.map((item) => ({ ...item, description: truncateByChars(item.description ?? '', descChars) }));
    estimated = approximateTokens(system) + approximateTokens(buildPayload(current)) + 128;
  }

  // If still too large and we have multiple items, keep only the first.
  if (estimated > budgetTokens && current.length > 1) {
    current = [current[0]];
  }

  return current;
};

const extractJsonObjectString = (text: string): string | null => {
  const trimmed = text.trim();
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);

  // Fallback: attempt to find a balanced JSON object from the first "{"
  const start = trimmed.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\\\') {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return trimmed.slice(start, i + 1);
    }
  }
  return null;
};

const parseJsonObject = <T,>(text: string): T => {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const extracted = extractJsonObjectString(trimmed);
    if (extracted) {
      try {
        return JSON.parse(extracted) as T;
      } catch (err2) {
        throw new Error(
          `Failed to parse JSON from model output: ${(err2 as Error).message}\nOutput: ${trimmed.slice(0, 500)}`,
        );
      }
    }
    throw new Error(`Failed to parse JSON from model output.\nOutput: ${trimmed.slice(0, 500)}`);
  }
};

const translateJson = async <T,>(opts: {
  client: JsonChatClient;
  system: string;
  payload: unknown;
  maxTokens: number;
  schema: string;
  fallback?: (rawText: string) => T | null;
  resetChat?: boolean;
  retries?: number;
  cooldownMs?: number;
  signal?: AbortSignal;
}): Promise<T> => {
  const {
    client,
    system,
    payload,
    maxTokens,
    schema,
    fallback,
    resetChat,
    retries = 1,
    cooldownMs = 50,
    signal,
  } = opts;

  const abortHandler = () => client.interrupt?.();
  signal?.addEventListener('abort', abortHandler, { once: true });
  try {
    const sleep = async (ms: number) => {
      if (ms <= 0) return;
      await new Promise((resolve) => setTimeout(resolve, ms));
    };

    let lastError: unknown = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      if ((resetChat || attempt > 0) && client.reset) {
        try {
          await client.reset(true);
        } catch {
          // ignore
        }
      }

      const user = JSON.stringify(payload);
      let response;
      try {
        response = await client.chatJson({ system, user, maxTokens, schema, resetChat, signal });
      } catch (err) {
        const msg = err instanceof Error ? err.message.toLowerCase() : '';
        // Handle device/resource exhaustion explicitly to avoid endless retries/aborts.
        if (msg.includes('device lost') || msg.includes('context lost') || msg.includes('out of memory')) {
          const friendly = new Error('Das lokale KI-Modell wurde gestoppt (GPU überlastet oder nicht mehr verfügbar). Bitte schließe andere GPU-lastige Tabs/Apps oder wechsle auf den OpenAI-Backend.');
          (friendly as any).code = 'WEBGPU_DEVICE_LOST';
          throw friendly;
        }
        throw err;
      }

      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const content = response.content;

      // Accept content even if finish_reason is "abort" (WebLLM quirk).
      if (!content || content.trim().length === 0) {
        lastError = new Error('Model returned empty response');
        (lastError as any).code = 'EMPTY_MODEL_RESPONSE';
        if (attempt < retries) {
          await sleep(cooldownMs);
          continue;
        }
        throw lastError;
      }

      try {
        return parseJsonObject<T>(content);
      } catch (err) {
        const recovered = fallback?.(content);
        if (recovered) return recovered;
        lastError = err;
        if (attempt < retries) {
          await sleep(cooldownMs);
          continue;
        }
        throw err;
      }
    }

    throw (lastError instanceof Error ? lastError : new Error(String(lastError)));
  } finally {
    signal?.removeEventListener('abort', abortHandler);
  }
};

export type TranslationProgress = {
  translatedCheckpoints: number;
  totalCheckpoints: number;
  isPartial: boolean;
};

const extractBulletsFromPartialJson = (raw: string): string[] => {
  const start = raw.indexOf('"bullets"');
  if (start < 0) return [];
  const arrayStart = raw.indexOf('[', start);
  if (arrayStart < 0) return [];

  const bullets: string[] = [];
  let i = arrayStart + 1;
  while (i < raw.length && bullets.length < 12) {
    while (i < raw.length && /\s|,/.test(raw[i])) i += 1;
    if (i >= raw.length) break;
    if (raw[i] === ']') break;
    if (raw[i] !== '"') {
      i += 1;
      continue;
    }
    i += 1;
    let value = '';
    let escape = false;
    while (i < raw.length) {
      const ch = raw[i];
      if (escape) {
        value += ch;
        escape = false;
        i += 1;
        continue;
      }
      if (ch === '\\\\') {
        escape = true;
        i += 1;
        continue;
      }
      if (ch === '"') {
        bullets.push(value.trim());
        i += 1;
        break;
      }
      value += ch;
      i += 1;
    }

    // If we ran out of input mid-string, stop (last bullet incomplete).
    if (i >= raw.length) break;
  }
  return bullets.filter((b) => b.length > 0).slice(0, 8);
};

const extractBulletsFromText = (raw: string): string[] => {
  if (!raw) return [];
  return raw
    .split(/\r?\n+/)
    .map((line) => line.trim().replace(/^[*-]\s*/, '').replace(/^\d+\.\s*/, ''))
    .filter((line) => line.length > 0)
    .slice(0, 8);
};

export const summarizeDqmResults = async (opts: {
  client: JsonChatClient;
  data: AnalysisData;
  targetLanguage: string;
  modelId?: string;
  cache?: TranslationCache;
  signal?: AbortSignal;
}): Promise<{ bullets: string[]; stats: SummaryStats }> => {
  const { client, data, targetLanguage, signal } = opts;
  const modelId = opts.modelId ?? 'unknown';
  const budgetTokens = estimateContextBudgetTokens(modelId);
  const languageName = languageNameForPrompt(targetLanguage);
  const targetBudget = Math.max(800, Math.floor(budgetTokens * 0.5));
  const started = Date.now();
  const stats: SummaryStats = {
    chunked: false,
    chunkCount: 0,
    totalFailed: data.checkpoints.filter((cp) => cp.failed).length,
    attempts: 0,
    emptyResponses: 0,
    fallbackUsed: 'none',
    modelId,
    targetLang: targetLanguage,
    durationMs: 0,
  };

  const buildFailedCheckpoints = (maxItems: number, descChars: number) =>
    data.checkpoints
      .filter((cp) => cp.failed)
      .slice(0, maxItems)
      .map((cp) => ({
        id: cp.id,
        category: cp.category,
        name: cp.name ?? '',
        description: truncateByChars(cp.description ?? '', descChars),
      }));

  const payloadBase = {
    targetLanguage,
    stats: {
      siteName: data.siteName,
      failedCount: data.totalErrors,
    },
  };

  const schema = JSON.stringify({
    type: 'object',
    properties: {
      bullets: { type: 'array', items: { type: 'string' } },
    },
    required: ['bullets'],
    additionalProperties: false,
  });

  const system = [
    'You are an assistant that summarizes a website quality/accessibility report for developers.',
    `Write in ${languageName} (${targetLanguage}).`,
    languageInstructionForPrompt(targetLanguage),
    'Return 5–7 concise bullet points with the most important findings and next actions.',
    'Each bullet must be <= 140 characters.',
    'No prefixes like "Next step:" / "Nächster Schritt:".',
    'Base the summary on the checkpoint texts (name/description).',
    'Prefer actionable wording and group similar issues.',
    'Do not hallucinate; only use the provided data.',
    'Return JSON only.',
  ].join(' ');

  const fallback = (rawText: string) => {
    const bullets = extractBulletsFromPartialJson(rawText);
    return bullets.length > 0 ? ({ bullets } as { bullets: string[] }) : null;
  };

  const summarizeChunk = async (cps: typeof data.checkpoints, maxBullets = 4) => {
    const payload = {
      ...payloadBase,
      failedCheckpoints: cps.map((cp) => ({
        id: cp.id,
        category: cp.category,
        name: cp.name ?? '',
        description: truncateByChars(cp.description ?? '', 260),
      })),
    };
    stats.attempts += 1;
    const result = await translateJson<{ bullets: string[] }>({
      client,
      system,
      payload,
      maxTokens: targetLanguage.toLowerCase().startsWith('en') ? 512 : 640,
      schema,
      fallback,
      resetChat: true,
      retries: 1,
      cooldownMs: 100,
      signal,
    });
    return (result.bullets ?? []).filter((b) => typeof b === 'string' && b.trim().length > 0).slice(0, maxBullets);
  };

  // Ultra-small fallback for EMPTY_MODEL_RESPONSE: one tiny chunk, lower token budget.
  const summarizeTiny = async (cps: typeof data.checkpoints) => {
    const payload = {
      ...payloadBase,
      failedCheckpoints: cps.map((cp) => ({
        id: cp.id,
        category: cp.category,
        name: cp.name ?? '',
        description: truncateByChars(cp.description ?? '', 180),
      })),
    };
    stats.attempts += 1;
    const result = await translateJson<{ bullets: string[] }>({
      client,
      system,
      payload,
      maxTokens: targetLanguage.toLowerCase().startsWith('en') ? 320 : 420,
      schema,
      fallback,
      resetChat: true,
      retries: 0,
      cooldownMs: 80,
      signal,
    });
    return (result.bullets ?? []).filter((b) => typeof b === 'string' && b.trim().length > 0).slice(0, 4);
  };

  const chunkCheckpoints = (cps: typeof data.checkpoints) => {
    const chunks: Array<typeof data.checkpoints> = [];
    let current: typeof data.checkpoints = [];
    const estimate = (list: typeof data.checkpoints) => approximateTokens(JSON.stringify({
      targetLanguage,
      checkpoints: list.map((cp) => ({
        name: cp.name ?? '',
        description: truncateByChars(cp.description ?? '', 220),
        category: cp.category ?? '',
      })),
    }));
    for (const cp of cps) {
      const tentative = [...current, cp];
      const tooBig = tentative.length > 4 || estimate(tentative) > targetBudget;
      if (tooBig && current.length > 0) {
        chunks.push(current);
        current = [cp];
      } else {
        current = tentative;
      }
    }
    if (current.length > 0) chunks.push(current);
    return chunks;
  };

  const failedCheckpoints = data.checkpoints.filter((cp) => cp.failed);

  // Prefer chunked summarization when payload is non-trivial.
  const shouldChunk = failedCheckpoints.length > 3
    || approximateTokens(JSON.stringify(failedCheckpoints)) > Math.floor(targetBudget * 0.5);
  if (shouldChunk) {
    const chunks = chunkCheckpoints(failedCheckpoints);
    stats.chunked = true;
    stats.chunkCount = chunks.length;
    const interimBullets: string[] = [];
    for (const chunk of chunks) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      try {
        const bullets = await summarizeChunk(chunk, 4);
        interimBullets.push(...bullets);
      } catch (err) {
        // best effort: skip failed chunk
        continue;
      }
    }

    const uniqueBullets = Array.from(new Set(interimBullets.map((b) => b.trim()))).filter(Boolean).slice(0, 14);
    if (uniqueBullets.length > 0) {
      const consolidationSystem = [
        'You merge bullet points about website quality/accessibility issues for developers.',
        `Write in ${languageName} (${targetLanguage}).`,
        languageInstructionForPrompt(targetLanguage),
        'Return 5–7 concise bullets (<= 140 chars) combining similar issues; do not invent new facts.',
        'Use only the provided bullets.',
        'Return JSON only.',
      ].join(' ');
      stats.attempts += 1;
      const consolidated = await translateJson<{ bullets: string[] }>({
        client,
        system: consolidationSystem,
        payload: { targetLanguage, bullets: uniqueBullets },
        maxTokens: targetLanguage.toLowerCase().startsWith('en') ? 384 : 512,
        schema: JSON.stringify({
          type: 'object',
          properties: { bullets: { type: 'array', items: { type: 'string' } } },
          required: ['bullets'],
          additionalProperties: false,
        }),
        resetChat: true,
        retries: 1,
        cooldownMs: 120,
        signal,
      });
      const finalBullets = (consolidated.bullets ?? []).filter((b) => typeof b === 'string' && b.trim().length > 0).slice(0, 7);
      if (finalBullets.length > 0) {
        stats.fallbackUsed = 'chunk';
        stats.chunked = true;
        stats.chunkCount = chunks.length;
        stats.durationMs = Date.now() - started;
        return { bullets: finalBullets, stats };
      }
      stats.emptyResponses += 1;
    }
    // fall through to single-shot attempts if consolidation failed
  }

  // Give the model more room for output tokens while keeping payload bounded.
  const attempts: Array<{ maxItems: number; descChars: number; maxTokens: number }> = [
    { maxItems: 8, descChars: 420, maxTokens: budgetTokens <= 1024 ? 512 : 640 },
    { maxItems: 6, descChars: 320, maxTokens: budgetTokens <= 1024 ? 640 : 896 },
    { maxItems: 4, descChars: 220, maxTokens: budgetTokens <= 1024 ? 768 : 1152 },
    { maxItems: 3, descChars: 180, maxTokens: budgetTokens <= 1024 ? 896 : 1280 },
  ];

  let lastError: unknown = null;
  for (const attempt of attempts) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    let descLimit = attempt.descChars;
    let maxItems = attempt.maxItems;
    let payload = {
      ...payloadBase,
      failedCheckpoints: buildFailedCheckpoints(maxItems, descLimit),
    };

    // Shrink input until the estimated token size stays within ~60% of the model budget.
    const targetBudget = Math.max(600, Math.floor(budgetTokens * 0.6));
    let estimated = approximateTokens(JSON.stringify(payload));
    while (estimated > targetBudget && maxItems > 3) {
      maxItems = Math.max(3, Math.floor(maxItems * 0.8));
      descLimit = Math.max(120, Math.floor(descLimit * 0.8));
      payload = {
        ...payloadBase,
        failedCheckpoints: buildFailedCheckpoints(maxItems, descLimit),
      };
      estimated = approximateTokens(JSON.stringify(payload));
    }

    try {
      stats.attempts += 1;
      const result = await translateJson<{ bullets: string[] }>({
        client,
        system,
        payload,
        maxTokens: attempt.maxTokens,
        schema,
        fallback,
        resetChat: true,
        retries: 2,
        cooldownMs: 120,
        signal,
      });
      const bullets = Array.isArray(result.bullets)
        ? result.bullets.filter((b) => typeof b === 'string' && b.trim().length > 0).slice(0, 8)
        : [];
      if (bullets.length > 0) {
        // Some models ignore the requested output language; enforce by translating the bullets list.
        stats.fallbackUsed = stats.fallbackUsed === 'none' ? 'single' : stats.fallbackUsed;
        if ((targetLanguage || '').toLowerCase().startsWith('en')) {
          stats.durationMs = Date.now() - started;
          return { bullets, stats };
        }

        const translationSchema = JSON.stringify({
          type: 'object',
          properties: {
            bullets: { type: 'array', items: { type: 'string' } },
          },
          required: ['bullets'],
          additionalProperties: false,
        });

        const translateSystem = [
          `Translate to ${languageName} (${targetLanguage}).`,
          languageInstructionForPrompt(targetLanguage),
          'Translate each bullet. Keep them concise (<= 140 characters) and preserve technical meaning.',
          'Return JSON only.',
        ].join(' ');

        stats.attempts += 1;
        const translated = await translateJson<{ bullets: string[] }>({
          client,
          system: translateSystem,
          payload: { targetLanguage, bullets },
          maxTokens: 256,
          schema: translationSchema,
          resetChat: true,
          retries: 1,
          cooldownMs: 75,
          signal,
        });

        const translatedBullets = Array.isArray(translated.bullets)
          ? translated.bullets.filter((b) => typeof b === 'string' && b.trim().length > 0).slice(0, 8)
          : [];

        stats.fallbackUsed = 'single';
        stats.durationMs = Date.now() - started;
        return { bullets: translatedBullets.length > 0 ? translatedBullets : bullets, stats };
      }
      lastError = new Error('Model returned empty summary');
    } catch (err) {
      const code = (err as any)?.code;
      lastError = err instanceof Error ? err : new Error(String(err));
      if (code === 'EMPTY_MODEL_RESPONSE') {
        stats.emptyResponses += 1;
        // Last-ditch: try tiny payload to coax a response.
        try {
          const tinyBullets = await summarizeTiny(failedCheckpoints.slice(0, 4));
          if (tinyBullets.length > 0) {
            stats.fallbackUsed = 'tiny';
            stats.durationMs = Date.now() - started;
            return { bullets: tinyBullets, stats };
          }
        } catch {
          // ignore and continue to next attempt
        }
        // Retry with smaller payload.
        continue;
      }
      if (isContextWindowError(err)) {
        continue;
      }
      // Other errors: do not spin forever; try next attempt once.
      continue;
    }
  }

  // Final plain-text fallback to avoid empty summaries when models ignore JSON.
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  try {
      const fallbackSystem = [
        'You summarize website quality/accessibility issues for developers.',
        `Write in ${languageName} (${targetLanguage}).`,
        languageInstructionForPrompt(targetLanguage),
        'Return 5-7 bullet points, each <= 140 characters, no numbering prefixes.',
        'Use only the provided data; do not invent issues.',
      ].join(' ');

      const fallbackPayload = {
        ...payloadBase,
        failedCheckpoints: buildFailedCheckpoints(4, 160),
      };

      stats.attempts += 1;
      const res = await opts.client.chatJson({
        system: fallbackSystem,
        user: JSON.stringify(fallbackPayload),
        maxTokens: 480,
        resetChat: true,
        signal,
      });
      const text = res.content ?? '';
      const bullets = extractBulletsFromText(text).map(stripNextStepPrefix);
      if (bullets.length > 0) {
        stats.fallbackUsed = stats.fallbackUsed === 'none' ? 'single' : stats.fallbackUsed;
        stats.durationMs = Date.now() - started;
        return { bullets, stats };
      }
      stats.emptyResponses += 1;
      lastError = new Error('Model returned empty summary');
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // fall through
    }

  stats.durationMs = Date.now() - started;
  stats.fallbackUsed = stats.fallbackUsed === 'none' ? 'fail' : stats.fallbackUsed;
  const err = lastError instanceof Error ? lastError : new Error(String(lastError));
  (err as any).stats = stats;
  throw err;
};

export const translateDqmResults = async (opts: {
  client: JsonChatClient;
  data: AnalysisData;
  targetLanguage: string;
  modelId: string;
  cache?: TranslationCache;
  computeBudgetMs?: number;
  maxConcurrentBatches?: number;
  maxItemsPerBatch?: number;
  forceSerial?: boolean;
  onProgress?: (progress: TranslationProgress) => void;
  onBatchStatus?: (info: { ids: string[]; status: 'translating' | 'done' }) => void;
  onPartialResult?: (data: AnalysisData) => void;
  signal?: AbortSignal;
}): Promise<{ data: AnalysisData; progress: TranslationProgress }> => {
  const {
    client,
    data,
    targetLanguage,
    modelId,
    cache,
    computeBudgetMs = 15_000,
    maxConcurrentBatches = 1,
    maxItemsPerBatch,
    forceSerial = false,
    onProgress,
    onBatchStatus,
    onPartialResult,
    signal,
  } = opts;

  const start = Date.now();
  const failed = data.checkpoints.filter((cp) => cp.failed);
  const total = failed.length;
  let hadFailures = false;
  const budgetTokens = estimateContextBudgetTokens(modelId);
  const modelIdLower = modelId.toLowerCase();
  const isOpenAIModel = modelIdLower.startsWith('gpt-') || modelIdLower.includes('gpt-4') || modelIdLower.includes('gpt-3.5') || modelIdLower.includes('o1') || modelIdLower.includes('o3');
  // Smaller batches reduce abort/empty-response issues and keep prompts under context window.
  const maxPerBatch = maxItemsPerBatch && maxItemsPerBatch > 0
    ? maxItemsPerBatch
    : (isOpenAIModel ? (budgetTokens <= 1024 ? 1 : 2) : 1);
  const languageName = languageNameForPrompt(targetLanguage);
  const targetBatchBudget = Math.max(600, Math.floor(budgetTokens * 0.6));

  const translatedById = new Map<string, { name?: string; description?: string; topics?: string[]; category?: string }>();
  const categoryMap = new Map<string, string>();
  const topicMap = new Map<string, string>();

  const now = Date.now();

  const system = [
    `You are a professional translator. Translate ALL text to ${languageName} (${targetLanguage}).`,
    languageInstructionForPrompt(targetLanguage),
    'CRITICAL: ALL text fields MUST be translated to the target language. Do not leave any text in the source language.',
    'Preserve meaning and technical terms; if an English technical term is commonly used in the target language, keep the original term instead of inventing a new one.',
    'Keep HTML tags/attributes unchanged; translate only visible text content.',
    'Output JSON only and only keys allowed by schema.',
    'Do not add prefixes like "Next step:" / "Nächster Schritt:".',
  ].join(' ');

  const uniqueCategories = Array.from(
    new Set(
      data.checkpoints
        .map((cp) => cp.category)
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0),
    ),
  );
  const uniqueTopics = Array.from(
    new Set(
      data.checkpoints
        .flatMap((cp) => cp.topics ?? [])
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0),
    ),
  );

  if (uniqueCategories.length > 0) {
    try {
      const sourceToHash = new Map<string, string>();
      const keys: string[] = [];
      for (const source of uniqueCategories) {
        const hash = fnv1aHash(source);
        sourceToHash.set(source, hash);
        keys.push(makeLabelKey(modelId, targetLanguage, 'category', hash));
      }
      const cached = cache ? await cache.getLabelMany(keys) : new Map();
      for (const source of uniqueCategories) {
        const key = makeLabelKey(modelId, targetLanguage, 'category', sourceToHash.get(source)!);
        const value = cached.get(key);
        if (value?.translated) categoryMap.set(source, value.translated);
      }

      const missing = uniqueCategories.filter((c) => !categoryMap.has(c));
      if (missing.length === 0) {
        // nothing to do
      } else {
        const categoryPayload = { targetLanguage, items: missing };
      const categoryResult = await translateJson<{ items: string[] }>({
        client,
        system,
        payload: categoryPayload,
        maxTokens: 512,
        schema: JSON.stringify({
          type: 'object',
          properties: {
            items: { type: 'array', items: { type: 'string' } },
          },
          required: ['items'],
          additionalProperties: false,
        }),
        retries: 1,
        cooldownMs: 50,
        signal,
      });
        const translated = categoryResult.items ?? [];
        const toPut: any[] = [];
        for (let i = 0; i < missing.length; i += 1) {
          const key = missing[i];
          const value = translated[i];
          if (typeof value === 'string' && value.trim().length > 0) {
          categoryMap.set(key, stripNextStepPrefix(value));
          if (cache) {
              const hash = sourceToHash.get(key)!;
              toPut.push({
                key: makeLabelKey(modelId, targetLanguage, 'category', hash),
                modelId,
                lang: targetLanguage,
                type: 'category',
                source: key,
                sourceHash: hash,
                translated: stripNextStepPrefix(value),
                updatedAt: now,
              });
            }
          }
        }
        await cache?.putLabelMany(toPut);
      }
    } catch {
      hadFailures = true;
    }
  }

  if (uniqueTopics.length > 0) {
    try {
      const sourceToHash = new Map<string, string>();
      const keys: string[] = [];
      for (const source of uniqueTopics) {
        const hash = fnv1aHash(source);
        sourceToHash.set(source, hash);
        keys.push(makeLabelKey(modelId, targetLanguage, 'topic', hash));
      }
      const cached = cache ? await cache.getLabelMany(keys) : new Map();
      for (const source of uniqueTopics) {
        const key = makeLabelKey(modelId, targetLanguage, 'topic', sourceToHash.get(source)!);
        const value = cached.get(key);
        if (value?.translated) topicMap.set(source, value.translated);
      }

      const missing = uniqueTopics.filter((c) => !topicMap.has(c));
      if (missing.length === 0) {
        // nothing to do
      } else {
        const topicPayload = { targetLanguage, items: missing };
      const topicResult = await translateJson<{ items: string[] }>({
        client,
        system: `${system} Treat "topics" as tags/labels and translate them.`,
        payload: topicPayload,
        maxTokens: 512,
        schema: JSON.stringify({
          type: 'object',
          properties: {
            items: { type: 'array', items: { type: 'string' } },
          },
          required: ['items'],
          additionalProperties: false,
        }),
        retries: 1,
        cooldownMs: 50,
        signal,
      });
        const translated = topicResult.items ?? [];
        const toPut: any[] = [];
        for (let i = 0; i < missing.length; i += 1) {
          const key = missing[i];
          const value = translated[i];
          if (typeof value === 'string' && value.trim().length > 0) {
            topicMap.set(key, stripNextStepPrefix(value));
            if (cache) {
              const hash = sourceToHash.get(key)!;
              toPut.push({
                key: makeLabelKey(modelId, targetLanguage, 'topic', hash),
                modelId,
                lang: targetLanguage,
                type: 'topic',
                source: key,
                sourceHash: hash,
                translated: stripNextStepPrefix(value),
                updatedAt: now,
              });
            }
          }
        }
        await cache?.putLabelMany(toPut);
      }
    } catch {
      hadFailures = true;
    }
  }

  const schema = {
    targetLanguage,
    items: [] as Array<{
      id: string;
      category: string;
      name: string;
      description: string;
      topics: string[];
    }>,
  };

  const outputSchemaString = JSON.stringify({
    type: 'object',
    properties: {
      targetLanguage: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            category: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            topics: { type: 'array', items: { type: 'string' } },
          },
          required: ['id', 'category', 'name', 'description', 'topics'],
          additionalProperties: false,
        },
      },
    },
    required: ['targetLanguage', 'items'],
    additionalProperties: false,
  });

  let translatedCount = 0;
  // Prime translatedById with cached checkpoint translations, so re-runs only fill missing items.
  if (cache) {
    const checkpointKeys = failed.map((cp) => makeCheckpointKey(modelId, targetLanguage, computeCheckpointSourceHash(cp)));
    const cached = await cache.getCheckpointMany(checkpointKeys);
    const cachedIds: string[] = [];
    for (const cp of failed) {
      const key = makeCheckpointKey(modelId, targetLanguage, computeCheckpointSourceHash(cp));
      const cachedItem = cached.get(key);
      const sourceHash = computeCheckpointSourceHash(cp);
      if (cachedItem && cachedItem.sourceHash === sourceHash) {
        translatedById.set(cp.id, {
          name: cachedItem.translated.name,
          description: cachedItem.translated.description,
          category: cachedItem.translated.category,
          topics: cachedItem.translated.topics,
        });
        if (cp.category && cachedItem.translated.category) {
          categoryMap.set(cp.category, cachedItem.translated.category);
        }
        for (let i = 0; i < (cp.topics ?? []).length; i += 1) {
          const sourceTopic = cp.topics?.[i];
          const translatedTopic = cachedItem.translated.topics?.[i];
          if (sourceTopic && translatedTopic) {
            topicMap.set(sourceTopic, translatedTopic);
          }
        }
        translatedCount += 1;
        cachedIds.push(cp.id);
      }
    }
    onProgress?.({ translatedCheckpoints: translatedCount, totalCheckpoints: total, isPartial: false });
    if (cachedIds.length > 0) {
      onBatchStatus?.({ ids: cachedIds, status: 'done' });
      onPartialResult?.(applyCheckpointTranslations(data, translatedById, categoryMap, topicMap));
    }
  }

  // If there are no failed checkpoints, we still may need translated categories/topics; return early.
  if (failed.length === 0) {
    const progress = { translatedCheckpoints: 0, totalCheckpoints: 0, isPartial: false };
    onProgress?.(progress);
    return { data: applyCheckpointTranslations(data, translatedById, categoryMap, topicMap), progress };
  }

  const remaining = failed.filter((cp) => !translatedById.has(cp.id));
  const batches: Array<{ batch: typeof failed; missing: typeof failed }> = [];
  const makeChunks = (items: typeof failed) => {
    const chunks: typeof batches = [];
    let current: typeof failed = [];
    const estimateTokensFor = (list: typeof failed) => approximateTokens(JSON.stringify({
      targetLanguage,
      items: list.map((cp) => ({
        category: cp.category ?? '',
        name: cp.name ?? '',
        description: cp.description ?? '',
        topics: cp.topics ?? [],
      })),
    }));
    for (const cp of items) {
      const tentative = [...current, cp];
      const exceedsCount = tentative.length > maxPerBatch;
      const exceedsBudget = estimateTokensFor(tentative) > targetBatchBudget;
      if ((exceedsCount || exceedsBudget) && current.length > 0) {
        chunks.push({ batch: current, missing: current });
        current = [cp];
      } else {
        current = tentative;
      }
    }
    if (current.length > 0) {
      chunks.push({ batch: current, missing: current });
    }
    return chunks;
  };
  batches.push(...makeChunks(remaining));

  const maxParallel = forceSerial ? 1 : Math.max(1, Math.min(maxConcurrentBatches, 4));
  let nextIndex = 0;
  let timeExceeded = false;

  const processOne = async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      if (Date.now() - start > computeBudgetMs) {
        timeExceeded = true;
        return;
      }
      const idx = nextIndex;
      if (idx >= batches.length || timeExceeded) return;
      nextIndex += 1;

      const { batch, missing } = batches[idx];
      const rawItems = missing.map((cp) => ({
        id: cp.id,
        category: cp.category ?? '',
        name: cp.name ?? '',
        description: cp.description ?? '',
        topics: cp.topics ?? [],
      }));

      const originalsRawById = new Map(rawItems.map((item) => [item.id, item]));

      const items = clampCheckpointItemsToBudget(
        system,
        schema,
        targetLanguage,
        rawItems,
        budgetTokens,
        { dropTopics: budgetTokens <= 1024 },
      );

      const payload = { ...schema, items };
      onBatchStatus?.({ ids: items.map((x) => x.id), status: 'translating' });
      const originalsById = new Map(items.map((item) => [item.id, item]));

      const translateBatch = async (batchItems: typeof payload.items, maxTokens: number) =>
        translateJson<{
          targetLanguage?: string;
          items: Array<{ id: string; category: string; name: string; description: string; topics: string[] }>;
        }>({
          client,
          system,
          payload: { ...schema, items: batchItems },
          maxTokens,
          schema: outputSchemaString,
          retries: 1,
          cooldownMs: 75,
          signal,
        });

      let result:
        | { targetLanguage?: string; items: Array<{ id: string; category: string; name: string; description: string; topics: string[] }> }
        | null = null;
      try {
        result = await translateBatch(payload.items, 2048);
      } catch (err) {
        // Retry once with larger token budget, then fall back to per-item translation.
        try {
          result = await translateBatch(payload.items, 3072);
        } catch (err2) {
          if (isContextWindowError(err2)) {
            // Aggressive fallback: one item at a time, truncate heavily and drop topics.
            hadFailures = true;
            for (const single of payload.items.slice(0, 1)) {
              if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
              const aggressive = clampCheckpointItemsToBudget(
                system,
                schema,
                targetLanguage,
                [single],
                budgetTokens,
                { maxDescriptionChars: 350, dropTopics: true },
              );
              try {
                const singleResult = await translateBatch(aggressive, 1024);
                const item = singleResult.items?.[0];
                if (item?.id) {
                  translatedById.set(item.id, {
                    category: stripNextStepPrefix(item.category),
                    name: stripNextStepPrefix(item.name),
                    description: stripNextStepPrefix(item.description),
                    topics: (item.topics ?? []).map((t) => stripNextStepPrefix(t)),
                  });
                }
              } catch {
                // Ignore.
              }
            }
              translatedCount = Math.min(total, translatedCount + 1);
              onProgress?.({ translatedCheckpoints: translatedCount, totalCheckpoints: total, isPartial: false });
              onPartialResult?.(applyCheckpointTranslations(data, translatedById, categoryMap, topicMap));
              onBatchStatus?.({ ids: items.map((x) => x.id), status: 'done' });
              continue;
            }
            hadFailures = true;
            for (const single of payload.items) {
              if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
            if (Date.now() - start > computeBudgetMs) {
              timeExceeded = true;
              break;
            }
            try {
              const singleResult = await translateBatch([single], 1024);
              const item = singleResult.items?.[0];
              if (item?.id) {
                translatedById.set(item.id, {
                  category: stripNextStepPrefix(item.category),
                  name: stripNextStepPrefix(item.name),
                  description: stripNextStepPrefix(item.description),
                  topics: (item.topics ?? []).map((t) => stripNextStepPrefix(t)),
                });
              const sourceHash = computeCheckpointSourceHash(originalsRawById.get(item.id) ?? single);
              await cache?.putCheckpointMany([{
                  key: makeCheckpointKey(modelId, targetLanguage, sourceHash),
                  modelId,
                  lang: targetLanguage,
                  checkpointId: item.id,
                  sourceHash,
                  translated: {
                    name: stripNextStepPrefix(item.name),
                    description: stripNextStepPrefix(item.description),
                    category: stripNextStepPrefix(item.category),
                    topics: (item.topics ?? []).map((t) => stripNextStepPrefix(t)),
                  },
                  updatedAt: now,
                }]);
              }
            } catch {
              // Skip untranslatable item; keep original values.
            hadFailures = true;
          }
        }
        translatedCount = Math.min(total, translatedCount + missing.length);
        onProgress?.({ translatedCheckpoints: translatedCount, totalCheckpoints: total, isPartial: false });
        onPartialResult?.(applyCheckpointTranslations(data, translatedById, categoryMap, topicMap));
        onBatchStatus?.({ ids: items.map((x) => x.id), status: 'done' });
        continue;
      }
    }

      const enforceLanguage = async (itemsToFix: typeof payload.items) => {
        if ((targetLanguage || '').toLowerCase().startsWith('en')) return itemsToFix;
        try {
          const ensureSystem = [
            `Ensure the following texts are in ${languageName} (${targetLanguage}).`,
            languageInstructionForPrompt(targetLanguage),
            'Assume the source is English unless it clearly matches the target language; translate any English text.',
            'If text is already in the target language, keep it unchanged; otherwise translate.',
            'Preserve HTML tags and technical meaning.',
            'Return JSON only.',
          ].join(' ');
        const enforced = await translateJson<{
          items: Array<{ id: string; category: string; name: string; description: string; topics: string[] }>;
        }>({
          client,
          system: ensureSystem,
          payload: { targetLanguage, items: itemsToFix },
          maxTokens: 1536,
          schema: outputSchemaString,
          retries: 0,
          cooldownMs: 50,
          signal,
        });
        return enforced.items ?? itemsToFix;
        } catch {
          return itemsToFix;
        }
      };

      const ensuredItems = await enforceLanguage(result.items ?? []);

      const needsFix = ensuredItems.filter((item) => {
        const original = originalsById.get(item.id);
        if (!original) return false;
        const sameName = (item.name ?? '').trim() === (original.name ?? '').trim();
        const sameDesc = (item.description ?? '').trim() === (original.description ?? '').trim();
        const sameCat = (item.category ?? '').trim() === (original.category ?? '').trim();
        return !targetLanguage.toLowerCase().startsWith('en') && (sameName || sameDesc || sameCat);
      });

      // Helper to force-translate a single item using the original source as baseline.
      const forceTranslateSingle = async (original: typeof items[number]) => {
        const singlePayload = clampCheckpointItemsToBudget(
          system,
          schema,
          targetLanguage,
          [original],
          budgetTokens,
          { maxDescriptionChars: 400, dropTopics: true },
        );
        const single = await translateJson<{
          targetLanguage?: string;
          items: Array<{ id: string; category: string; name: string; description: string; topics: string[] }>;
        }>({
          client,
          system,
          payload: { ...schema, items: singlePayload },
          maxTokens: 1024,
          schema: outputSchemaString,
          retries: 0,
          cooldownMs: 50,
          signal,
        });
        return single.items?.[0];
      };

      // If anything came back unchanged (likely English), retranslate per item with tighter payload.
      if (needsFix.length > 0) {
        hadFailures = true;
        for (const item of needsFix) {
          if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
          const original = originalsRawById.get(item.id) ?? originalsById.get(item.id);
          if (!original) continue;
          try {
            const fixed = await forceTranslateSingle(original);
            if (fixed) {
              item.category = stripNextStepPrefix(fixed.category);
              item.name = stripNextStepPrefix(fixed.name);
              item.description = stripNextStepPrefix(fixed.description);
              item.topics = (fixed.topics ?? []).map((t) => stripNextStepPrefix(t));
            }
          } catch {
            // ignore, keep best effort
          }
        }
      }

      for (const item of ensuredItems ?? []) {
        translatedById.set(item.id, {
          category: stripNextStepPrefix(item.category),
          name: stripNextStepPrefix(item.name),
        description: stripNextStepPrefix(item.description),
        topics: (item.topics ?? []).map((t) => stripNextStepPrefix(t)),
      });
    }
    if (cache) {
      const toPut = (ensuredItems ?? []).map((item) => {
        const original = originalsRawById.get(item.id) ?? payload.items.find((x) => x.id === item.id);
        const sourceHash = computeCheckpointSourceHash(original ?? item);
        return {
          key: makeCheckpointKey(modelId, targetLanguage, sourceHash),
          modelId,
          lang: targetLanguage,
          checkpointId: item.id,
          sourceHash,
          translated: {
            name: stripNextStepPrefix(item.name),
            description: stripNextStepPrefix(item.description),
            category: stripNextStepPrefix(item.category),
            topics: (item.topics ?? []).map((t) => stripNextStepPrefix(t)),
          },
          updatedAt: now,
        };
      });
      await cache.putCheckpointMany(toPut);
    }

    translatedCount = Math.min(total, translatedCount + missing.length);
    onProgress?.({ translatedCheckpoints: translatedCount, totalCheckpoints: total, isPartial: false });
    onPartialResult?.(applyCheckpointTranslations(data, translatedById, categoryMap, topicMap));
    onBatchStatus?.({ ids: items.map((x) => x.id), status: 'done' });
  }
  };

  const workers = Array.from({ length: maxParallel }, () => processOne());
  await Promise.all(workers);

  if (timeExceeded) {
    const progress = { translatedCheckpoints: translatedCount, totalCheckpoints: total, isPartial: true };
    onProgress?.(progress);
    return { data: applyCheckpointTranslations(data, translatedById, categoryMap, topicMap), progress };
  }

  const progress = { translatedCheckpoints: translatedCount, totalCheckpoints: total, isPartial: hadFailures };
  onProgress?.(progress);
  return { data: applyCheckpointTranslations(data, translatedById, categoryMap, topicMap), progress };
};

const applyCheckpointTranslations = (
  data: AnalysisData,
  translatedById: Map<string, { name?: string; description?: string; topics?: string[]; category?: string }>,
  categoryMap: Map<string, string>,
  topicMap: Map<string, string>,
): AnalysisData => ({
  ...data,
  checkpoints: data.checkpoints.map((cp) => {
    const translated = translatedById.get(cp.id);
    const category = categoryMap.get(cp.category) ?? translated?.category ?? cp.category;
    if (!translated) {
      return {
        ...cloneCheckpoint(cp),
        category,
        topics: (cp.topics ?? []).map((topic) => topicMap.get(topic) ?? topic),
      };
    }
    return {
      ...cloneCheckpoint(cp),
      category,
      name: translated.name ?? cp.name,
      description: translated.description ?? cp.description,
      topics: (translated.topics ?? cp.topics ?? []).map((topic) => topicMap.get(topic) ?? topic),
    };
  }),
});

const cloneCheckpoint = (cp: Checkpoint): Checkpoint => ({
  ...cp,
  colors: { ...cp.colors },
  topics: Array.isArray(cp.topics) ? [...cp.topics] : [],
  canHighlight: { ...cp.canHighlight },
  checkpointType: cp.checkpointType ? { ...cp.checkpointType } : cp.checkpointType,
});
