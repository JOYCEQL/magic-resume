import { readLimitedJson } from "./ai-request";
import { combineAbortSignals } from "../abort-signal";
import {
  MAX_PDF_IMPORT_PAGES, MAX_PDF_REQUEST_BYTES, PDF_IMPORT_PRESETS,
  PDF_IMPORT_PROVIDERS, PDF_IMPORT_TIMEOUT_MS, type PdfImportConnection,
} from "../../config/pdf-import";
import { parseJsonPayload, ResumeImportError, RESUME_IMPORT_PROMPT, validateResume, VISION_TEST_PROMPT } from "../resume-import-schema";
import { asRecord, buildAIRequest, fetchAI, readAIOutput, validateAIConnection } from "./ai-provider";
export { readAIOutput as readVisionOutput } from "./ai-provider";

type ImportInput = PdfImportConnection & { images: string[]; test: boolean };

export function validateImportInput(value: unknown): ImportInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ResumeImportError("invalidRequest");
  const body = value as Record<string, unknown>;
  // Preserve the legacy Gemini request format for already-open clients.
  const provider = body.provider ?? "gemini";
  if (!PDF_IMPORT_PROVIDERS.includes(provider as PdfImportConnection["provider"])) throw new ResumeImportError("invalidProvider");
  const preset = PDF_IMPORT_PRESETS[provider as PdfImportConnection["provider"]];
  const connection = validateAIConnection({ ...body, provider, model: body.model ?? preset.model });
  if (!Array.isArray(body.images) || !body.images.length) throw new ResumeImportError("invalidImages");
  if (body.images.length > MAX_PDF_IMPORT_PAGES) throw new ResumeImportError("tooManyPages");
  let size = 0;
  for (const image of body.images) {
    if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) throw new ResumeImportError("invalidImages");
    size += image.length;
  }
  if (size > MAX_PDF_REQUEST_BYTES) throw new ResumeImportError("requestTooLarge", 413);
  return { ...connection, images: body.images, test: body.test === true };
}

export function buildVisionRequest(input: ImportInput) {
  return buildAIRequest(input, {
    system: input.test ? VISION_TEST_PROMPT : RESUME_IMPORT_PROMPT,
    text: input.test ? "Read the image." : "Extract this resume. Images are supplied in page order.",
    images: input.images, json: true,
  });
}

export async function handleResumeImport(request: Request, fetcher: typeof fetch = fetch) {
  try {
    const input = validateImportInput(await readLimitedJson(request));
    const response = await fetchAI(input, {
      system: input.test ? VISION_TEST_PROMPT : RESUME_IMPORT_PROMPT,
      text: input.test ? "Read the image." : "Extract this resume. Images are supplied in page order.",
      images: input.images, json: true,
    }, combineAbortSignals([
      request.signal,
      AbortSignal.timeout(PDF_IMPORT_TIMEOUT_MS),
    ]), fetcher);
    let parsed: unknown;
    try {
      parsed = parseJsonPayload(readAIOutput(input.protocol, await response.json()));
    } catch (error) {
      if (error instanceof ResumeImportError) throw error;
      if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) throw error;
      throw new ResumeImportError("invalidOutput", 502);
    }
    if (input.test) {
      const code = asRecord(parsed).code;
      if (typeof code !== "string") throw new ResumeImportError("visionTestFailed", 502);
      return Response.json({ code: code.trim() });
    }
    return Response.json(validateResume(parsed));
  } catch (error) {
    const known = error instanceof ResumeImportError;
    const timedOut = error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
    return Response.json({ code: known ? error.code : timedOut ? "timeout" : "networkError" }, {
      status: known ? error.status : timedOut ? 504 : 502,
    });
  }
}
