import { MAX_PDF_REQUEST_BYTES, PDF_IMPORT_TIMEOUT_MS, type PdfImportConnection } from "@/config/pdf-import";
import { combineAbortSignals } from "@/lib/abort-signal";
import { ResumeImportError } from "@/lib/resume-import-schema";
import type { Translator } from "@/i18n/compat/utils";

export async function requestPdfImport(connection: PdfImportConnection, images: string[], test = false, signal?: AbortSignal) {
  const body = JSON.stringify({ ...connection, images, test });
  if (new Blob([body]).size > MAX_PDF_REQUEST_BYTES) throw new ResumeImportError("requestTooLarge");
  try {
    const response = await fetch("/api/resume-import", {
      method: "POST", headers: { "Content-Type": "application/json" }, body,
      signal: combineAbortSignals([
        AbortSignal.timeout(PDF_IMPORT_TIMEOUT_MS + 10_000),
        ...(signal ? [signal] : []),
      ]),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ResumeImportError(data?.code || (response.status === 413 ? "requestTooLarge" : "upstreamError"));
    if (!data) throw new ResumeImportError("invalidOutput");
    return data;
  } catch (error) {
    if (error instanceof ResumeImportError) throw error;
    throw new ResumeImportError(error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name) ? "timeout" : "networkError");
  }
}

export function pdfImportErrorMessage(error: unknown, t: Translator) {
  const code = error instanceof ResumeImportError ? error.code : "invalidPdf";
  const key = `dashboard.resumes.importDialog.errors.${code}`;
  const message = t(key);
  return message === key ? t("dashboard.resumes.importDialog.pdfError") : message;
}
