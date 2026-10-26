import type { UpstreamErrorDetails } from "../upstream-error";
import { upstreamErrorMessage } from "../upstream-error";
import { ResumeImportError } from "../resume-import-schema";

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};

function redact(value: unknown, secrets: string[], limit: number): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  let text = value;
  for (const secret of secrets) {
    if (secret) text = text.replaceAll(secret, "[REDACTED]");
  }
  return text
    .replace(/Bearer\s+[^\s"'<>]+/gi, "Bearer [REDACTED]")
    .replace(/\b(?:sk-|AIza)[A-Za-z0-9_-]+/g, "[REDACTED]")
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[URL]")
    .replace(/(?:[A-Za-z]:\\|\/(?:Users|home|var|tmp|etc|app)\/)[^\s"'<>]+/g, "[PATH]")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim().slice(0, limit);
}

/** Read a bounded JSON error envelope, never proxy arbitrary bodies or headers. */
export async function readUpstreamError(response: Response, secrets: string[]): Promise<UpstreamErrorDetails> {
  const details: UpstreamErrorDetails = { status: response.status };
  const requestId = response.headers.get("x-request-id") ?? response.headers.get("x-goog-request-id");
  details.requestId = redact(requestId, secrets, 128);
  if (!response.body) return details;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let payload: unknown;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32_768) return details;
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    try { payload = JSON.parse(new TextDecoder().decode(bytes)); }
    catch { return details; }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const body = record(payload);
  const error = record(body.error);
  const message = typeof body.error === "string" ? body.error : error.message ?? body.message;
  details.message = redact(message, secrets, 1200);
  details.code = redact(typeof error.code === "number" ? String(error.code) : error.code, secrets, 128);
  details.type = redact(error.type, secrets, 128);
  return details;
}

export function upstreamErrorResponse(error: ResumeImportError): Response {
  if (!error.upstream) throw new Error("Missing upstream error details");
  return Response.json({ code: error.code, error: {
    code: error.upstream?.code,
    message: upstreamErrorMessage(error.upstream),
    type: error.upstream?.type,
  }, upstream: error.upstream }, {
    status: error.status, headers: { "Cache-Control": "no-store" },
  });
}
