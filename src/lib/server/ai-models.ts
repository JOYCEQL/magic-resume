import {
  AI_PROVIDER_DEFINITIONS,
  AI_PROVIDERS,
  isValidBaseUrl,
} from "../../config/ai-models";
import { ResumeImportError } from "../resume-import-schema";
import { combineAbortSignals } from "../abort-signal";
import { readLimitedJson } from "./ai-request";
import { ensureGeminiProxyDispatcher } from "./gemini";
import { asRecord, upstreamErrorCode } from "./ai-provider";

export interface FetchedModel {
  id: string;
  description?: string;
}

const MAX_PAGES = 10;
const MAX_MODELS = 500;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_MODEL_ID_LENGTH = 256;
const MAX_DESCRIPTION_LENGTH = 512;
const textValue = (value: unknown) => (typeof value === "string" ? value : "");
const modelText = (value: unknown, maxLength: number) => {
  const text = textValue(value).trim();
  return text.length <= maxLength ? text : "";
};

function invalidUpstreamResponse() {
  return new ResumeImportError("upstreamError", 502);
}

async function readResponseJson(response: Response): Promise<unknown> {
  if (!response.body) throw invalidUpstreamResponse();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => {});
        throw invalidUpstreamResponse();
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    try {
      return JSON.parse(body);
    } catch {
      throw invalidUpstreamResponse();
    }
  } finally {
    reader.releaseLock();
  }
}

function uniqueModels(models: FetchedModel[], sort = false) {
  const unique = [...new Map(models.map((model) => [model.id, model])).values()];
  if (sort) unique.sort((a, b) => a.id.localeCompare(b.id));
  return unique.slice(0, MAX_MODELS);
}

export function modelsBaseUrl(raw: string) {
  return raw
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(chat\/completions|responses|messages)$/, "");
}

async function fetchUpstream(
  url: string,
  headers: Record<string, string>,
  signal: AbortSignal,
  fetcher: typeof fetch,
) {
  const response = await fetcher(url, {
    method: "GET",
    headers,
    signal,
    redirect: "error",
  });
  if (!response.ok) {
    console.error("[ai-models] Upstream request failed", {
      url: new URL(url).origin,
      upstreamStatus: response.status,
    });
    if (response.body) await response.body.cancel().catch(() => {});
    throw new ResumeImportError(
      upstreamErrorCode(response.status),
      response.status >= 500 ? 502 : response.status,
    );
  }
  return response;
}

async function fetchOpenAICompatibleModels(
  baseUrl: string,
  apiKey: string,
  signal: AbortSignal,
  fetcher: typeof fetch,
): Promise<FetchedModel[]> {
  const response = await fetchUpstream(
    `${baseUrl}/models`,
    { Authorization: `Bearer ${apiKey}` },
    signal,
    fetcher,
  );
  const data = asRecord(await readResponseJson(response));
  if (!Array.isArray(data.data)) throw invalidUpstreamResponse();
  return uniqueModels(
    data.data
      .map(asRecord)
      .map((item) => {
        const id = modelText(item.id, MAX_MODEL_ID_LENGTH);
        const owner = modelText(item.owned_by, MAX_DESCRIPTION_LENGTH);
        return {
          id,
          description: owner || undefined,
        };
      })
      .filter((item) => item.id),
    true,
  );
}

async function fetchGeminiModels(
  baseUrl: string,
  apiKey: string,
  signal: AbortSignal,
  fetcher: typeof fetch,
): Promise<FetchedModel[]> {
  const models: FetchedModel[] = [];
  const seenPageTokens = new Set<string>();
  const root = baseUrl.replace(/\/v1(beta)?$/, "");
  let pageToken: string | undefined;
  let pages = 0;

  do {
    if (pageToken) {
      if (seenPageTokens.has(pageToken)) break;
      seenPageTokens.add(pageToken);
    }
    const url = new URL(`${root}/v1beta/models`);
    url.searchParams.set("pageSize", "100");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetchUpstream(
      url.toString(),
      { "x-goog-api-key": apiKey },
      signal,
      fetcher,
    );
    const data = asRecord(await readResponseJson(response));
    if (!Array.isArray(data.models)) throw invalidUpstreamResponse();
    for (const item of data.models) {
      const model = asRecord(item);
      const methods = Array.isArray(model.supportedGenerationMethods)
        ? model.supportedGenerationMethods
        : [];
      if (!methods.includes("generateContent")) continue;

      const id = modelText(
        textValue(model.name).replace(/^models\//, ""),
        MAX_MODEL_ID_LENGTH,
      );
      if (id) {
        models.push({
          id,
          description:
            modelText(model.displayName, MAX_DESCRIPTION_LENGTH) || undefined,
        });
      }
    }
    pageToken = textValue(data.nextPageToken).trim() || undefined;
    pages += 1;
  } while (pageToken && pages < MAX_PAGES && models.length < MAX_MODELS);

  return uniqueModels(models);
}

async function fetchAnthropicModels(
  baseUrl: string,
  apiKey: string,
  signal: AbortSignal,
  fetcher: typeof fetch,
): Promise<FetchedModel[]> {
  const models: FetchedModel[] = [];
  const seenAfterIds = new Set<string>();
  let afterId: string | undefined;
  let pages = 0;

  do {
    if (afterId) {
      if (seenAfterIds.has(afterId)) break;
      seenAfterIds.add(afterId);
    }
    const url = new URL(`${baseUrl}/models`);
    url.searchParams.set("limit", "100");
    if (afterId) url.searchParams.set("after_id", afterId);
    const response = await fetchUpstream(
      url.toString(),
      { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      signal,
      fetcher,
    );
    const data = asRecord(await readResponseJson(response));
    if (!Array.isArray(data.data)) throw invalidUpstreamResponse();
    const page = data.data;
    for (const item of page) {
      const model = asRecord(item);
      const id = modelText(model.id, MAX_MODEL_ID_LENGTH);
      if (id) {
        models.push({
          id,
          description:
            modelText(model.display_name, MAX_DESCRIPTION_LENGTH) || undefined,
        });
      }
    }

    const lastModel = asRecord(page.at(-1));
    afterId = data.has_more === true
      ? modelText(data.last_id, MAX_MODEL_ID_LENGTH) ||
        modelText(lastModel.id, MAX_MODEL_ID_LENGTH) ||
        undefined
      : undefined;
    pages += 1;
  } while (afterId && pages < MAX_PAGES && models.length < MAX_MODELS);

  return uniqueModels(models);
}

export async function handleModelsRequest(request: Request, fetcher: typeof fetch = fetch) {
  try {
    const body = asRecord(await readLimitedJson(request));
    const provider = AI_PROVIDERS.find((item) => item === body.provider);
    if (!provider) throw new ResumeImportError("invalidProvider");
    const preset = AI_PROVIDER_DEFINITIONS[provider];
    const apiKey = textValue(body.apiKey).trim();
    const baseUrl = modelsBaseUrl(
      textValue(body.baseUrl) || preset.baseUrl,
    );
    if (!apiKey || apiKey.length > 4096 || /[\r\n]/.test(apiKey))
      throw new ResumeImportError("configRequired");
    if (!isValidBaseUrl(baseUrl)) throw new ResumeImportError("invalidEndpoint");

    const signal = combineAbortSignals([
      request.signal,
      AbortSignal.timeout(30_000),
    ]);
    ensureGeminiProxyDispatcher();
    const models =
      provider === "gemini"
        ? await fetchGeminiModels(baseUrl, apiKey, signal, fetcher)
        : provider === "anthropic"
          ? await fetchAnthropicModels(baseUrl, apiKey, signal, fetcher)
          : await fetchOpenAICompatibleModels(baseUrl, apiKey, signal, fetcher);
    return Response.json({ models });
  } catch (error) {
    const known = error instanceof ResumeImportError;
    const timeout =
      error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
    const code = known ? error.code : timeout ? "timeout" : "networkError";
    return Response.json(
      { code, error: { code, message: `AI request failed (${code})` } },
      { status: known ? error.status : timeout ? 504 : 502 },
    );
  }
}
