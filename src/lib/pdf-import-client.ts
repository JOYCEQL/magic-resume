import { MAX_PDF_REQUEST_BYTES, PDF_IMPORT_TIMEOUT_MS, type PdfImportConnection } from "@/config/pdf-import";
import { ResumeImportError } from "@/lib/resume-import-schema";
import { postImportRequest, importErrorMessage } from "@/lib/import-request";
import type { Translator } from "@/i18n/compat/utils";

export async function requestPdfImport(connection: PdfImportConnection, images: string[], test = false, signal?: AbortSignal) {
  const body = JSON.stringify({ ...connection, images, test });
  if (new Blob([body]).size > MAX_PDF_REQUEST_BYTES) throw new ResumeImportError("requestTooLarge");
  return postImportRequest("/api/resume-import", body, PDF_IMPORT_TIMEOUT_MS, "requestTooLarge", signal);
}

export function pdfImportErrorMessage(error: unknown, t: Translator) {
  return importErrorMessage(error, t, "invalidPdf", "dashboard.resumes.importDialog.pdfError");
}
