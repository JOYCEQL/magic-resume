import { AI_MODEL_CONFIGS, type AIModelType } from "../../config/ai";
import { AI_PROVIDER_DEFINITIONS } from "../../config/ai-models";
import { combineAbortSignals } from "../abort-signal";
import { ResumeImportError, parseJsonPayload } from "../resume-import-schema";
import { asRecord, createTextStream, fetchAI, readAIOutput, validateAIConnection } from "./ai-provider";
import { GRAMMAR_PROMPT, POLISH_PROMPT } from "./ai-prompts";
import { readLimitedJson } from "./ai-request";

function connectionFromRequest(body: Record<string, unknown>) {
  if (body.connection) return validateAIConnection(body.connection);
  // Keep already-open clients working while the saved configuration migrates.
  const provider = body.modelType;
  if (typeof provider !== "string" || !Object.hasOwn(AI_MODEL_CONFIGS, provider)) throw new ResumeImportError("invalidProvider");
  const legacy = AI_MODEL_CONFIGS[provider as AIModelType];
  const preset = AI_PROVIDER_DEFINITIONS[provider as AIModelType];
  return validateAIConnection({
    provider, protocol: preset.protocol, apiKey: body.apiKey,
    model: legacy.requiresModelId ? body.model || preset.defaultModel : legacy.defaultModel,
    baseUrl: provider === "openai" ? body.apiEndpoint : preset.baseUrl,
  });
}

export async function handleTextRequest(request: Request, task: "polish" | "grammar" | "test", fetcher: typeof fetch = fetch) {
  try {
    const body = asRecord(await readLimitedJson(request));
    const connection = connectionFromRequest(body);
    if (task !== "test" && (typeof body.content !== "string" || !body.content.trim())) throw new ResumeImportError("invalidRequest");
    const custom = typeof body.customInstructions === "string" ? body.customInstructions.trim() : "";
    const system = task === "grammar" ? GRAMMAR_PROMPT
      : task === "test" ? "Reply with exactly OK."
        : POLISH_PROMPT + (custom ? `\n\n用户额外要求：\n${custom}` : "");
    const text = task === "test" ? "Test this connection." : String(body.content);
    const abort = new AbortController();
    const signal = combineAbortSignals([
      request.signal,
      abort.signal,
      AbortSignal.timeout(120_000),
    ]);
    const response = await fetchAI(connection, { system, text, json: task === "grammar", stream: task === "polish" }, signal, fetcher);
    if (task === "polish") {
      if (!response.body) throw new ResumeImportError("emptyOutput", 502);
      return new Response(createTextStream(response.body, connection.protocol, abort), {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
      });
    }
    let output: string;
    try { output = readAIOutput(connection.protocol, await response.json()); }
    catch (error) { if (error instanceof ResumeImportError) throw error; throw new ResumeImportError("invalidOutput", 502); }
    if (task === "test") {
      if (!/^OK[.!]?$/i.test(output.trim())) throw new ResumeImportError("invalidOutput", 502);
      return Response.json({ ok: true });
    }
    const parsed = asRecord(parseJsonPayload(output));
    if (!Array.isArray(parsed.errors)) throw new ResumeImportError("invalidOutput", 502);
    return Response.json({ choices: [{ message: { content: JSON.stringify(parsed) } }] });
  } catch (error) {
    const known = error instanceof ResumeImportError;
    const timeout = error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
    const code = known ? error.code : timeout ? "timeout" : "networkError";
    return Response.json({ code, error: { code, message: `AI request failed (${code})` } }, { status: known ? error.status : timeout ? 504 : 502 });
  }
}
