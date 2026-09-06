import { MAX_PDF_REQUEST_BYTES } from "../../config/pdf-import";
import { ResumeImportError } from "../resume-import-schema";

export async function readLimitedJson(request: Request) {
  if (!request.body) throw new ResumeImportError("invalidRequest");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PDF_REQUEST_BYTES) {
        await reader.cancel();
        throw new ResumeImportError("requestTooLarge", 413);
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    try { return JSON.parse(body); } catch { throw new ResumeImportError("invalidRequest"); }
  } finally { reader.releaseLock(); }
}

