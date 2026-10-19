import { PDF_IMPORT_TIMEOUT_MS, type PdfImportConnection } from "@/config/pdf-import";
import { MAX_MARKDOWN_IMPORT_BYTES, ResumeImportError } from "@/lib/resume-import-schema";
import { postImportRequest, importErrorMessage } from "@/lib/import-request";
import type { Translator } from "@/i18n/compat/utils";

export async function requestMarkdownImport(connection: PdfImportConnection, text: string) {
  const markdown = text.trim();
  if (!markdown) throw new ResumeImportError("invalidRequest");
  if (markdown.length > MAX_MARKDOWN_IMPORT_BYTES) throw new ResumeImportError("markdownFileTooLarge");
  const body = JSON.stringify({ ...connection, text: markdown });
  return postImportRequest("/api/markdown-import", body, PDF_IMPORT_TIMEOUT_MS, "markdownFileTooLarge");
}

export function markdownImportErrorMessage(error: unknown, t: Translator) {
  return importErrorMessage(error, t, "invalidRequest", "dashboard.resumes.importDialog.markdownError");
}
