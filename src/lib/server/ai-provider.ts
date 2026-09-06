import {
  AI_PROVIDERS,
  AI_PROVIDER_DEFINITIONS,
  isValidBaseUrl,
  type AIConnection,
  type AIProtocol,
} from "../../config/ai-models";
import { ResumeImportError } from "../resume-import-schema";
import { ensureGeminiProxyDispatcher } from "./gemini";

export const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const textValue = (value: unknown) => (typeof value === "string" ? value : "");
const RETRYABLE_UPSTREAM_STATUSES = new Set([500, 502, 503, 504]);
const UPSTREAM_RETRY_DELAYS_MS = [250, 750] as const;

function waitForRetry(delay: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const timeout = setTimeout(done, delay);
    function done() {
      signal.removeEventListener("abort", abort);
      resolve();
    }
    function abort() {
      clearTimeout(timeout);
      reject(signal.reason);
    }
    signal.addEventListener("abort", abort, { once: true });
  });
}

export function validateAIConnection(value: unknown): AIConnection {
  const body = asRecord(value);
  const provider = AI_PROVIDERS.find((provider) => provider === body.provider);
  if (!provider) throw new ResumeImportError("invalidProvider");
  const preset = AI_PROVIDER_DEFINITIONS[provider];
  const protocol = preset.protocols.find(
    (protocol) => protocol === (body.protocol ?? preset.protocol),
  );
  if (!protocol) throw new ResumeImportError("invalidProvider");
  const apiKey = textValue(body.apiKey).trim();
  const model = textValue(body.model).trim();
  const baseUrl = textValue(body.baseUrl ?? preset.baseUrl)
    .trim()
    .replace(/\/+$/, "");
  if (
    !apiKey ||
    !model ||
    apiKey.length > 4096 ||
    model.length > 256 ||
    /[\r\n]/.test(apiKey)
  )
    throw new ResumeImportError("configRequired");
  if (!isValidBaseUrl(baseUrl)) throw new ResumeImportError("invalidEndpoint");
  return { provider, protocol, apiKey, model, baseUrl };
}

export interface AIGenerationInput {
  system: string;
  text: string;
  images?: string[];
  json?: boolean;
  stream?: boolean;
}

export function buildAIRequest(
  connection: AIConnection,
  input: AIGenerationInput,
) {
  const { protocol, model, apiKey } = connection;
  const { system, text, images = [], stream = false, json = false } = input;
  const base = connection.baseUrl
    .replace(/\/+$/, "")
    .replace(/\/(chat\/completions|responses|messages)$/, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const imageData = (image: string) => {
    const [header, data] = image.split(",");
    return { mimeType: header.slice(5, -7), data };
  };
  if (protocol === "gemini") {
    headers["x-goog-api-key"] = apiKey;
    const method = stream ? "streamGenerateContent?alt=sse" : "generateContent";
    return {
      url: `${base.replace(/\/v1(beta)?$/, "")}/v1beta/models/${encodeURIComponent(model.replace(/^models\//, ""))}:${method}`,
      headers,
      body: {
        systemInstruction: { parts: [{ text: system }] },
        contents: [
          {
            role: "user",
            parts: [
              { text },
              ...images.map((image) => ({ inlineData: imageData(image) })),
            ],
          },
        ],
        ...(json
          ? { generationConfig: { responseMimeType: "application/json" } }
          : {}),
      },
    };
  }
  if (protocol === "anthropic") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
    return {
      url: `${base}/messages`,
      headers,
      body: {
        model,
        max_tokens: 8192,
        system,
        stream,
        messages: [
          {
            role: "user",
            content: [
              ...images.map((image) => {
                const { mimeType, data } = imageData(image);
                return {
                  type: "image",
                  source: { type: "base64", media_type: mimeType, data },
                };
              }),
              { type: "text", text },
            ],
          },
        ],
      },
    };
  }
  headers.Authorization = `Bearer ${apiKey}`;
  if (protocol === "responses") {
    return {
      url: `${base}/responses`,
      headers,
      body: {
        model,
        instructions: system,
        store: false,
        stream,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text },
              ...images.map((image) => ({
                type: "input_image",
                image_url: image,
              })),
            ],
          },
        ],
      },
    };
  }
  return {
    url: `${base}/chat/completions`,
    headers,
    body: {
      model,
      stream,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: images.length
            ? [
                { type: "text", text },
                ...images.map((image) => ({
                  type: "image_url",
                  image_url: { url: image },
                })),
              ]
            : text,
        },
      ],
    },
  };
}

function checkFinishReason(reason: unknown) {
  if (["MAX_TOKENS", "max_tokens", "length"].includes(textValue(reason)))
    throw new ResumeImportError("truncatedOutput", 502);
  if (
    [
      "SAFETY",
      "RECITATION",
      "BLOCKLIST",
      "PROHIBITED_CONTENT",
      "refusal",
      "content_filter",
    ].includes(textValue(reason))
  )
    throw new ResumeImportError("refused", 422);
}

export function readAIOutput(protocol: AIProtocol, value: unknown): string {
  const data = asRecord(value);
  let text = "";
  if (protocol === "gemini") {
    const candidate = asRecord(list(data.candidates)[0]);
    checkFinishReason(candidate.finishReason);
    if (asRecord(data.promptFeedback).blockReason)
      throw new ResumeImportError("refused", 422);
    text = list(asRecord(candidate.content).parts)
      .map(asRecord)
      .filter((part) => !part.thought)
      .map((part) => textValue(part.text))
      .join("");
  } else if (protocol === "anthropic") {
    checkFinishReason(data.stop_reason);
    text = list(data.content)
      .map(asRecord)
      .filter((part) => part.type === "text")
      .map((part) => textValue(part.text))
      .join("");
  } else if (protocol === "responses") {
    if (data.status === "incomplete")
      throw new ResumeImportError("truncatedOutput", 502);
    if (data.status === "failed" || data.error)
      throw new ResumeImportError("upstreamError", 502);
    const parts = list(data.output)
      .map(asRecord)
      .filter((item) => item.type === "message")
      .flatMap((item) => list(item.content))
      .map(asRecord);
    if (parts.some((part) => part.type === "refusal"))
      throw new ResumeImportError("refused", 422);
    text = parts
      .filter((part) => part.type === "output_text")
      .map((part) => textValue(part.text))
      .join("");
  } else {
    const choice = asRecord(list(data.choices)[0]);
    checkFinishReason(choice.finish_reason);
    const message = asRecord(choice.message);
    if (message.refusal) throw new ResumeImportError("refused", 422);
    text = textValue(message.content);
  }
  if (!text.trim()) throw new ResumeImportError("emptyOutput", 502);
  return text;
}

export async function fetchAI(
  connection: AIConnection,
  input: AIGenerationInput,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
) {
  const request = buildAIRequest(connection, input);
  ensureGeminiProxyDispatcher();
  const body = JSON.stringify(request.body);
  let response: Response | undefined;
  for (let attempt = 0; attempt <= UPSTREAM_RETRY_DELAYS_MS.length; attempt++) {
    response = await fetcher(request.url, {
      method: "POST",
      headers: request.headers,
      body,
      signal,
      redirect: "error",
    });
    if (
      response.ok ||
      !RETRYABLE_UPSTREAM_STATUSES.has(response.status) ||
      attempt === UPSTREAM_RETRY_DELAYS_MS.length
    )
      break;

    console.warn("[ai-provider] Retrying a transient upstream failure", {
      provider: connection.provider,
      model: connection.model,
      upstreamStatus: response.status,
      attempt: attempt + 1,
    });
    await response.body?.cancel();
    await waitForRetry(UPSTREAM_RETRY_DELAYS_MS[attempt], signal);
  }
  if (!response) throw new ResumeImportError("networkError", 502);
  if (!response.ok) {
    const code =
      response.status === 401
        ? "authenticationFailed"
        : response.status === 403
          ? "modelAccessDenied"
          : response.status === 429
            ? "rateLimited"
            : response.status === 413
              ? "requestTooLarge"
              : [400, 404, 422].includes(response.status)
                ? "modelOrEndpointError"
                : "upstreamError";
    console.error("[ai-provider] Upstream request failed", {
      provider: connection.provider,
      model: connection.model,
      upstreamStatus: response.status,
      requestId:
        response.headers.get("x-request-id") ??
        response.headers.get("x-goog-request-id") ??
        undefined,
    });
    await response.body?.cancel();
    throw new ResumeImportError(
      code,
      response.status >= 500 ? 502 : response.status,
    );
  }
  return response;
}

export function readStreamDelta(protocol: AIProtocol, value: unknown): string {
  const data = asRecord(value);
  if (data.error || data.type === "error")
    throw new ResumeImportError("upstreamError", 502);
  if (protocol === "chat-completions") {
    const choice = asRecord(list(data.choices)[0]);
    checkFinishReason(choice.finish_reason);
    return textValue(asRecord(choice.delta).content);
  }
  if (protocol === "anthropic") {
    const delta = asRecord(data.delta);
    checkFinishReason(delta.stop_reason);
    return delta.type === "text_delta" ? textValue(delta.text) : "";
  }
  if (protocol === "responses") {
    if (data.type === "response.failed")
      throw new ResumeImportError("upstreamError", 502);
    if (data.type === "response.incomplete")
      throw new ResumeImportError("truncatedOutput", 502);
    return data.type === "response.output_text.delta"
      ? textValue(data.delta)
      : "";
  }
  const candidate = asRecord(list(data.candidates)[0]);
  checkFinishReason(candidate.finishReason);
  if (asRecord(data.promptFeedback).blockReason)
    throw new ResumeImportError("refused", 422);
  return list(asRecord(candidate.content).parts)
    .map(asRecord)
    .filter((part) => !part.thought)
    .map((part) => textValue(part.text))
    .join("");
}

/** Decode SSE events across arbitrary byte boundaries, including CRLF and a final event without a newline. */
export async function* textDeltas(
  body: ReadableStream<Uint8Array>,
  protocol: AIProtocol,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let dataLines: string[] = [];
  const flush = () => {
    const data = dataLines.join("\n");
    dataLines = [];
    if (!data || data === "[DONE]") return "";
    return readStreamDelta(protocol, JSON.parse(data));
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      pending += done
        ? decoder.decode()
        : decoder.decode(value, { stream: true });
      if (done && pending && !pending.endsWith("\n")) pending += "\n";
      let end: number;
      while ((end = pending.indexOf("\n")) >= 0) {
        const line = pending.slice(0, end).replace(/\r$/, "");
        pending = pending.slice(end + 1);
        if (!line) {
          const delta = flush();
          if (delta) yield delta;
        } else if (line.startsWith("data:"))
          dataLines.push(line.slice(5).replace(/^ /, ""));
      }
      if (done) break;
    }
    const delta = flush();
    if (delta) yield delta;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function createTextStream(
  body: ReadableStream<Uint8Array>,
  protocol: AIProtocol,
  abort: AbortController,
) {
  const iterator = textDeltas(body, protocol);
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const next = await iterator.next();
        if (next.done) controller.close();
        else controller.enqueue(encoder.encode(next.value));
      } catch (error) {
        controller.error(error);
        abort.abort();
      }
    },
    async cancel() {
      abort.abort();
      await iterator.return(undefined);
    },
  });
}
