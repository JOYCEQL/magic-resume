import { MAX_MARKDOWN_CHARACTERS, MAX_MARKDOWN_FILE_BYTES } from "@/config/markdown-import";
import { ResumeImportError } from "./resume-import-schema";

export function validateMarkdownInput(value: unknown): string {
  if (typeof value !== "string") throw new ResumeImportError("invalidMarkdown");
  if (value.length > MAX_MARKDOWN_CHARACTERS || new TextEncoder().encode(value).byteLength > MAX_MARKDOWN_FILE_BYTES) {
    throw new ResumeImportError("markdownTooLarge", 413);
  }
  if (!value.trim()) throw new ResumeImportError("emptyMarkdown");
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/.test(value)) throw new ResumeImportError("invalidMarkdown");
  // Preserve the entire document. Section discovery and field extraction belong
  // exclusively to the model, including Markdown syntax and heading semantics.
  return value;
}

export async function readMarkdownFile(file: File) {
  if (!/\.(md|markdown)$/i.test(file.name)) throw new ResumeImportError("invalidMarkdown");
  if (file.size > MAX_MARKDOWN_FILE_BYTES) throw new ResumeImportError("markdownTooLarge", 413);
  try {
    return validateMarkdownInput(new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer()));
  } catch (error) {
    if (error instanceof ResumeImportError) throw error;
    throw new ResumeImportError("invalidMarkdown");
  }
}

