import { combineAbortSignals } from "@/lib/abort-signal";
import { ResumeImportError } from "@/lib/resume-import-schema";

/**
 * Shared client helper for AI-backed resume import endpoints
 * (/api/resume-import, /api/markdown-import): POST a JSON body,
 * unwrap { code } error envelopes, and normalize network/timeout failures.
 */
export async function postImportRequest(
  endpoint: string,
  body: string,
  timeoutMs: number,
  statusFallbackCode: string,
  signal?: AbortSignal,
) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: combineAbortSignals([
        AbortSignal.timeout(timeoutMs + 10_000),
        ...(signal ? [signal] : []),
      ]),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ResumeImportError(data?.code || (response.status === 413 ? statusFallbackCode : "upstreamError"));
    if (!data) throw new ResumeImportError("invalidOutput");
    return data;
  } catch (error) {
    if (error instanceof ResumeImportError) throw error;
    throw new ResumeImportError(error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name) ? "timeout" : "networkError");
  }
}

/** Map a ResumeImportError code to a user-facing message via the shared
 *  importDialog.errors.* i18n keys, falling back to `fallbackKey`. */
export function importErrorMessage(error: unknown, t: (key: string) => string, defaultCode: string, fallbackKey: string) {
  const code = error instanceof ResumeImportError ? error.code : defaultCode;
  const key = `dashboard.resumes.importDialog.errors.${code}`;
  const message = t(key);
  return message === key ? t(fallbackKey) : message;
}
