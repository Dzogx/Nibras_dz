import { ENV } from "./env";
import {
  GEMINI_MODEL_PREFIX,
  isGeminiModel,
  OPENAI_MODEL_PREFIX,
  isOpenaiDirectModel,
  LLM_MODEL_OPTIONS,
} from "../../shared/llm-models";
import type { LlmModelOption } from "../../shared/llm-models";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  model?: string;
  thinking?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

// Resolve the LLM endpoint + auth key. An optional external OpenAI-compatible
// provider (e.g. OpenRouter/AgentRouter) takes precedence when both LLM_API_URL
// and LLM_API_KEY are configured; otherwise the Manus gateway is used.
const resolveLlmTarget = (target: "external" | "manus") => {
  if (target === "external") {
    const base = (ENV.llmApiUrl ?? "").replace(/\/$/, "");
    if (!base) {
      throw new Error("External LLM provider URL (LLM_API_URL) is not configured");
    }
    // The external URL may already end with /v1 (e.g. https://openrouter.ai/api/v1);
    // avoid producing /v1/v1/... paths.
    const endsWithV1 = base.endsWith("/v1");
    return {
      url: endsWithV1
        ? `${base}/chat/completions`
        : `${base}/v1/chat/completions`,
      apiKey: ENV.llmApiKey ?? "",
      provider: "external" as const,
    };
  }
  return {
    url:
      ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
        ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
        : "https://forge.manus.im/v1/chat/completions",
    apiKey: ENV.forgeApiKey ?? "",
    provider: "manus" as const,
  };
};

// Default model used when the external provider receives no explicit model.
// OpenRouter REQUIRES a model field (unlike the Manus gateway, which accepts a
// sensible default) so a request without `model` would otherwise fail with
// "400 No models provided".
export const EXTERNAL_LLM_DEFAULT_MODEL = "openai/gpt-4.1-mini";

// Extract a short human-readable error message from a raw gateway JSON
// response body (e.g. OpenRouter `{"error":{"message":"..."}}`).
const extractShortErrorMessage = (raw: string): string => {
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string; code?: string | number };
      message?: string;
    };
    const message = parsed.error?.message || parsed.message;
    if (typeof message === "string" && message.trim().length > 0) {
      // Gateway messages often include a long remedy hint/URL — trim it.
      const sentence = message.replace(/[\s\S]*To increase.*/, "").trim();
      return sentence.length > 0 ? sentence : "";
    }
    if (parsed.error?.code !== undefined) {
      return String(parsed.error.code);
    }
  } catch {
    // Non-JSON body: fall through to empty.
  }
  return "";
};

export {
  LLM_MODEL_OPTIONS,
  GEMINI_MODEL_PREFIX,
  isGeminiModel,
} from "../../shared/llm-models";
export type { LlmModelOption } from "../../shared/llm-models";

const assertApiKey = (apiKey: string, provider: string) => {
  if (!apiKey) {
    throw new Error(
      provider === "external"
        ? "External LLM provider is configured but LLM_API_KEY is empty"
        : "OPENAI_API_KEY is not configured"
    );
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

// ---------------------------------------------------------------------------
// Google Gemini REST API (free tier via Google AI Studio).
// Converts the shared OpenAI-shaped InvokeParams into Gemini's
// generateContent payload, then maps the response back into InvokeResult so
// the rest of the codebase stays provider-agnostic.
// ---------------------------------------------------------------------------

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// ---------------------------------------------------------------------------
// Gemini Context Caching (free tier — saves up to ~90% of cached tokens).
// One in-memory cache per (model, systemInstruction) pair, recreated lazily
// when the curriculum prompt changes or the cache expires (404 from Gemini).
// ---------------------------------------------------------------------------
type GeminiCacheEntry = {
  name: string;
  systemHash: string;
  createdAt: number;
};

const GEMINI_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const GEMINI_CACHABLE_SYSTEM_MIN_CHARS = 500;

let GEMINI_CACHE = new Map<string, GeminiCacheEntry>();

// Deterministic hash of the system instruction so a changed curriculum prompt
// creates a fresh cache instead of silently reusing stale content.
const hashString = (value: string): string => {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return `${value.length}-${h}`;
};

async function createGeminiCache(
  modelId: string,
  systemInstruction: string
): Promise<GeminiCacheEntry> {
  const createUrl = `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${ENV.geminiApiKey}`;
  const createResponse = await fetch(createUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: `models/${modelId}`,
      contents: [
        {
          role: "user",
          parts: [{ text: systemInstruction }],
        },
      ],
      ttl: "86400s",
    }),
  });

  if (!createResponse.ok) {
    const body = await createResponse.text();
    console.warn(
      `Gemini cachedContent creation failed (${createResponse.status}); skipping caching: ${body.slice(0, 200)}`
    );
    throw new Error("GEMINI_CACHE_MISS");
  }

  const created = (await createResponse.json()) as {
    name?: string;
    usageMetadata?: { totalTokenCount?: number };
  };

  if (!created.name) {
    throw new Error("GEMINI_CACHE_MISS");
  }

  if (typeof created.usageMetadata?.totalTokenCount === "number") {
    console.info(
      `Gemini context cache created (${modelId}): ${created.usageMetadata.totalTokenCount} cached tokens`
    );
  }

  return {
    name: created.name,
    systemHash: hashString(systemInstruction),
    createdAt: Date.now(),
  };
}

// Resolve the cachedContent name for a Gemini request. Returns undefined when
// caching should be skipped (short system prompt, missing key, cache failure).
const resolveGeminiCachedContent = async (
  modelId: string,
  systemInstruction: string
): Promise<string | undefined> => {
  if (systemInstruction.length < GEMINI_CACHABLE_SYSTEM_MIN_CHARS) {
    return undefined;
  }

  const key = `${modelId}:${hashString(systemInstruction)}`;
  const existing = GEMINI_CACHE.get(key);
  if (existing && Date.now() - existing.createdAt < GEMINI_CACHE_TTL_MS) {
    return existing.name;
  }

  try {
    const created = await createGeminiCache(modelId, systemInstruction);
    GEMINI_CACHE.set(key, created);
    return created.name;
  } catch {
    // Cache creation failure must never block generation — the request
    // proceeds without caching (tokens counted normally against the quota).
    return undefined;
  }
};

// Allow tests to reset the in-memory cache.
export const __resetGeminiCache = () => {
  GEMINI_CACHE = new Map();
};

const geminiRole = (role: Role): "user" | "model" =>
  role === "assistant" ? "model" : "user";

const geminiTextOf = (part: MessageContent): string => {
  if (typeof part === "string") return part;
  if (part.type === "text") return part.text;
  // Gemini generates text only; skip non-text parts.
  return "";
};

const geminiPartsOf = (
  content: MessageContent | MessageContent[]
): Array<{ text: string }> =>
  ensureArray(content)
    .map(geminiTextOf)
    .filter(text => text.length > 0)
    .map(text => ({ text }));

async function invokeGemini(params: InvokeParams): Promise<InvokeResult> {
  const messages = params.messages;
  const requestedModelId = params.model?.replace(
    GEMINI_MODEL_PREFIX,
    ""
  ) || "gemini-3.5-flash";
  const url = `${GEMINI_BASE_URL}/${encodeURIComponent(requestedModelId)}:generateContent?key=${ENV.geminiApiKey}`;

  // Gemini REST roles: "user" and "model" only — system messages merge into
  // systemInstruction; consecutive same-role messages merge into one turn.
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  let systemInstruction = "";
  for (const message of messages) {
    const parts = geminiPartsOf(message.content);
    if (parts.length === 0) continue;
    if (message.role === "system") {
      systemInstruction += parts.map(p => p.text).join("\n");
      continue;
    }
    const role = geminiRole(message.role);
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts.push(...parts);
    } else {
      contents.push({ role, parts });
    }
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat: params.responseFormat,
    response_format: params.response_format,
    outputSchema: params.outputSchema,
    output_schema: params.output_schema,
  });

  const generationConfig: Record<string, unknown> = {};
  const resolvedMaxTokens = params.max_tokens ?? params.maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    generationConfig.maxOutputTokens = resolvedMaxTokens;
  }
  if (normalizedResponseFormat) {
    if (normalizedResponseFormat.type === "json_schema") {
      generationConfig.responseMimeType = "application/json";
      generationConfig.responseSchema = normalizedResponseFormat.json_schema.schema;
    } else if (normalizedResponseFormat.type === "json_object") {
      generationConfig.responseMimeType = "application/json";
    }
    // text is the default — nothing to configure.
  }

  const body: Record<string, unknown> = {
    contents,
    generationConfig,
  };
  if (systemInstruction.length > 0) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  // Attach a Gemini context cache so the long curriculum/system prompt is
  // charged once instead of on every generation (free tier supports this).
  const cachedContentName = await resolveGeminiCachedContent(
    requestedModelId,
    systemInstruction
  );
  if (cachedContentName) {
    body.cachedContent = cachedContentName;
  }

  let response = await fetchWithBackoff(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();

    // A stale cachedContent name returns 404 — drop the cache and retry the
    // same request without it instead of failing outright.
    if (response.status === 404 && cachedContentName) {
      console.warn(
        `Gemini cachedContent not found (${cachedContentName}); retrying without cache`
      );
      GEMINI_CACHE.delete(`${requestedModelId}:${hashString(systemInstruction)}`);
      delete body.cachedContent;
      response = await fetchWithBackoff(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    // Gemini free-tier quotas and server problems: fall back to the Manus
    // gateway so generation never stays blocked for the teacher.
    const isProviderUnavailable =
      response.status === 401 ||
      response.status === 402 ||
      response.status === 403 ||
      response.status === 429 ||
      response.status >= 500;
    if (isProviderUnavailable) {
      console.warn(
        `Gemini provider failed (${response.status}); falling back to Manus gateway`
      );
      const fallback = resolveLlmTarget("manus");
      assertApiKey(fallback.apiKey, fallback.provider);
      response = await fetchWithBackoff(fallback.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${fallback.apiKey}`,
        },
        body: JSON.stringify({
          messages: messages.map(normalizeMessage),
          model: EXTERNAL_LLM_DEFAULT_MODEL,
          ...(normalizedResponseFormat
            ? { response_format: normalizedResponseFormat }
            : {}),
        }),
      });
      if (!response.ok) {
        const fallbackError = await response.text();
        throw new Error(
          `LLM invoke failed on both Gemini (${response.status} ${response.statusText}) and the Manus gateway (${fallbackError})`
        );
      }
      return (await response.json()) as InvokeResult;
    }
    const shortMessage = extractShortErrorMessage(errorText);
    throw new Error(
      `Gemini invoke failed: ${response.status} ${response.statusText}${shortMessage ? ` – ${shortMessage}` : ""}`
    );
  }

  const geminiResult = (await response.json()) as {
    candidates?: Array<{
      content?: {
        role?: string;
        parts?: Array<{ text?: string; inlineData?: unknown }>;
      };
      finishReason?: string;
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
    modelVersion?: string;
  };

  const candidate = geminiResult.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const text = parts.map(p => p.text ?? "").join("");

  if (!text && !candidate?.content?.parts?.some(p => p.inlineData)) {
    throw new Error(
      `Gemini returned an empty response${candidate?.finishReason ? ` (finishReason: ${candidate.finishReason})` : ""}`
    );
  }

  return {
    id: `gemini-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model: geminiResult.modelVersion ?? requestedModelId,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: [{ type: "text", text }],
        },
        finish_reason: candidate?.finishReason ?? null,
      },
    ],
    ...(geminiResult.usageMetadata
      ? {
          usage: {
            prompt_tokens: geminiResult.usageMetadata.promptTokenCount ?? 0,
            completion_tokens:
              geminiResult.usageMetadata.candidatesTokenCount ?? 0,
            total_tokens: geminiResult.usageMetadata.totalTokenCount ?? 0,
          },
        }
      : {}),
  };
}

const RETRY_MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 30_000;

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

const parseRetryAfter = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - Date.now());
};

// Equal-jitter exponential backoff. The cap/2 floor guarantees a minimum
// delay so a misbehaving caller loop slows down instead of hammering the
// upstream while it keeps returning errors.
const computeBackoffDelay = (
  attempt: number,
  retryAfterMs?: number
): number => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};

// Retries non-2xx responses and network errors with exponential backoff, then
// returns the final Response so callers keep their existing error handling.
const fetchWithBackoff = async (
  url: string,
  init: FetchInit
): Promise<Response> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }

      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
        // Body already settled; nothing to clean up.
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("LLM request failed after exhausting retries");
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {

  // Google Gemini (free tier via Google AI Studio) uses a dedicated REST
  // endpoint and a different payload shape — route those requests here so
  // all callers keep using a single invokeLLM entry point.
  if (params.model && isGeminiModel(params.model) && ENV.geminiApiKey) {
    return invokeGemini(params);
  }
  // Official OpenAI API (signup credits, no credit card) routes "openai/"
  // prefixed model ids directly to api.openai.com — kept distinct from the
  // OpenRouter gateway so credits are spent on the real GPT models, with the
  // same Manus-gateway fallback when the provider is unavailable.
  if (params.model && isOpenaiDirectModel(params.model) && ENV.openaiApiKey) {
    return invokeOpenaiDirect(params);
  }

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens,
  } = params;

  const payload = buildOpenAiPayload(params);

  const target = resolveLlmTarget("external");
  assertApiKey(target.apiKey, target.provider);

  let response = await fetchWithBackoff(target.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${target.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // If the external provider failed (auth/network/configuration/rate
    // limits), fall back once to the Manus gateway so generation never stays
    // blocked for the teacher. 401/403 cover key problems, 402/429 cover
    // exhausted credits and rate limits (OpenRouter returns 402 when the free
    // balance is spent), and 5xx covers server errors. Other 4xx client
    // errors (e.g. invalid model) are passed through directly.
    const isProviderUnavailable =
      response.status === 401 ||
      response.status === 402 ||
      response.status === 403 ||
      response.status === 429 ||
      response.status >= 500;
    if (isProviderUnavailable) {
      console.warn(
        `External LLM provider failed (${response.status}); falling back to Manus gateway`
      );
      const fallback = resolveLlmTarget("manus");
      assertApiKey(fallback.apiKey, fallback.provider);
      response = await fetchWithBackoff(fallback.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${fallback.apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const fallbackError = await response.text();
        throw new Error(
          `LLM invoke failed on both the external provider (${response.status} ${response.statusText}) and the Manus gateway (${fallbackError})`
        );
      }
      return (await response.json()) as InvokeResult;
    }
    // For non-retried client errors, return a short human-readable message
    // instead of the raw gateway JSON blob.
    const shortMessage = extractShortErrorMessage(errorText);
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText}${shortMessage ? ` – ${shortMessage}` : ""}`
    );
  }

  return (await response.json()) as InvokeResult;
}

export type ModelInfo = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

export type ModelsResponse = {
  object: string;
  data: ModelInfo[];
};

export async function listLLMModels(): Promise<ModelsResponse> {
  const target = resolveLlmTarget("external");
  assertApiKey(target.apiKey, target.provider);

  const url =
    target.provider === "external"
      ? ENV.llmApiUrl.replace(/\/$/, "").endsWith("/v1")
        ? `${ENV.llmApiUrl.replace(/\/$/, "")}/models`
        : `${ENV.llmApiUrl.replace(/\/$/, "")}/v1/models`
      : ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
        ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/models`
        : "https://forge.manus.im/v1/models";

  const response = await fetchWithBackoff(url, {
    headers: { authorization: `Bearer ${target.apiKey}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `List LLM models failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as ModelsResponse;
}

const OPENAI_API_BASE = "https://api.openai.com/v1/chat/completions";

// Shared payload builder for OpenAI-compatible bodies — used by both the
// OpenRouter gateway path and the direct OpenAI API path.
function buildOpenAiPayload(
  params: Omit<InvokeParams, "model"> & { model?: string | undefined }
): Record<string, unknown> {
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens,
  } = params;

  const payload: Record<string, unknown> = {
    messages: messages.map(normalizeMessage),
  };

  if (model) {
    payload.model = model;
  }

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    payload.max_tokens = resolvedMaxTokens;
  }

  if (thinking) {
    payload.thinking = thinking;
  }
  if (reasoning) {
    payload.reasoning = reasoning;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  // OpenAI-compatible external gateways (e.g. OpenRouter) require an explicit
  // `model` field, while the Manus gateway falls back to a default. When no
  // model was requested and an external provider is configured, apply a known
  // default so the request does not fail with "400 No models provided".
  if (!model && process.env.LLM_API_URL) {
    payload.model = EXTERNAL_LLM_DEFAULT_MODEL;
  }

  return payload;
}

// Direct invocation of the official OpenAI API for "openai/" prefixed models
// (GPT-4.1-mini, GPT-4o-mini, GPT-OSS-120B) using signup credits. Mirrors the
// OpenRouter block of invokeLLM so the same Manus-gateway fallback applies.
async function invokeOpenaiDirect(params: InvokeParams): Promise<InvokeResult> {
  const { model, ...rest } = params;
  const openaiModel = (model || "gpt-4.1-mini").replace(OPENAI_MODEL_PREFIX, "");
  const payload = buildOpenAiPayload({ ...rest, model: openaiModel });

  assertApiKey(ENV.openaiApiKey, "openai");
  let response = await fetchWithBackoff(OPENAI_API_BASE, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.openaiApiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    // 401/403 = invalid key, 402/429 = exhausted credits or rate limit, 5xx =
    // server error — all fall back to the Manus gateway so generation never
    // stays blocked for the teacher.
    const isProviderUnavailable =
      response.status === 401 ||
      response.status === 402 ||
      response.status === 403 ||
      response.status === 429 ||
      response.status >= 500;
    if (isProviderUnavailable) {
      console.warn(
        `OpenAI provider failed (${response.status}); falling back to Manus gateway`
      );
      const fallback = resolveLlmTarget("manus");
      assertApiKey(fallback.apiKey, fallback.provider);
      response = await fetchWithBackoff(fallback.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${fallback.apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const fallbackError = await response.text();
        throw new Error(
          `LLM invoke failed on both OpenAI (${response.status} ${response.statusText}) and the Manus gateway (${fallbackError})`
        );
      }
      return (await response.json()) as InvokeResult;
    }
    const shortMessage = extractShortErrorMessage(errorText);
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText}${shortMessage ? ` – ${shortMessage}` : ""}`
    );
  }

  return (await response.json()) as InvokeResult;
}
