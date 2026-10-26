import { orcaEnvironmentFromProcess, resolveOrcaOrigins } from "../../config/orcarouter";
import { OrcaCredentialError } from "../orcarouter/credential";
import { exchangeCodeForCredential } from "../orcarouter/pkce";
import { ResumeImportError } from "../resume-import-schema";
import { readLimitedJson } from "./ai-request";

const json = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "no-store", "Pragma": "no-cache" },
});

/** Fixed upstream: never accept an exchange destination from the browser. */
export async function handleOrcaExchange(request: Request, fetchImpl: typeof fetch = fetch) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) ||
      request.headers.get("sec-fetch-site") === "cross-site") {
    return json({ error: "access_denied" }, 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return json({ error: "invalid_request" }, 415);
  }
  try {
    const body = await readLimitedJson(request, 8192);
    if (!body || typeof body.code !== "string" || !body.code.trim() ||
        body.code.length > 4096 || /[\r\n]/.test(body.code) ||
        typeof body.code_verifier !== "string" ||
        !/^[A-Za-z0-9._~-]{43,128}$/.test(body.code_verifier) ||
        body.code_challenge_method !== "S256") {
      return json({ error: "invalid_request" }, 400);
    }
    const credential = await exchangeCodeForCredential(
      resolveOrcaOrigins(orcaEnvironmentFromProcess()).authBase,
      { code: body.code, verifier: body.code_verifier },
      { fetchImpl, signal: AbortSignal.any([request.signal, AbortSignal.timeout(25_000)]) },
    );
    return json({ key: credential.apiKey, scope: credential.scope });
  } catch (error) {
    if (error instanceof ResumeImportError) return json({ error: "invalid_request" }, error.status);
    if (error instanceof OrcaCredentialError) {
      const status = error.code === "timeout" ? 504
        : error.status && error.status >= 400 && error.status < 500 ? error.status : 502;
      return json({ error: error.code }, status);
    }
    return json({ error: "invalidResponse" }, 502);
  }
}
