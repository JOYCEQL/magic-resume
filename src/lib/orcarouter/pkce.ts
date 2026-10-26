import {
  ORCA_AUTHORIZE_PATH,
  ORCA_EXCHANGE_PATH,
  ORCA_REFERRAL_CODE,
} from "@/config/orcarouter";
import {
  OrcaCredentialError,
  type CredentialAdapter,
  type CredentialResult,
} from "./credential";

/** Authorization Code + S256 PKCE, using a real same-origin callback. */
export const PKCE_CODE_CHALLENGE_METHOD = "S256";
export const ORCA_APP_NAME = "Magic Resume";

export interface AuthorizeRequestInput {
  state: string;
  callbackUrl: string;
  codeChallenge: string;
  appName?: string;
  appId?: string;
  scope?: string;
  loginHint?: string;
}

export interface ExchangeRequest {
  url: string;
  body: { code: string; code_verifier: string; code_challenge_method: string };
}

const base64Url = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const randomBytes = (length: number) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

/** Fresh per attempt, from a cryptographic RNG. */
export function createCodeVerifier() {
  return base64Url(randomBytes(32));
}

export function createState() {
  return base64Url(randomBytes(16));
}

/** `base64url(sha256(verifier))`, no padding. */
export async function createCodeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return base64Url(new Uint8Array(digest));
}

/** HTTPS for hosted deployments; HTTP only for local loopback development. */
export function validateCallbackUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new OrcaCredentialError("invalidOrigin");
  }
  const octets = url.hostname.split(".");
  const loopback = ["localhost", "[::1]"].includes(url.hostname) ||
    (octets.length === 4 && octets[0] === "127" &&
      octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255));
  if (url.username || url.password || value.includes("#") ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))) {
    throw new OrcaCredentialError("invalidOrigin");
  }
  return url;
}

export function buildAuthorizeUrl(
  authBase: string,
  input: AuthorizeRequestInput,
) {
  const url = new URL(ORCA_AUTHORIZE_PATH, authBase);
  validateCallbackUrl(input.callbackUrl);
  url.searchParams.set("callback_url", input.callbackUrl);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", PKCE_CODE_CHALLENGE_METHOD);
  url.searchParams.set("state", input.state);
  url.searchParams.set("app_name", input.appName ?? ORCA_APP_NAME);
  url.searchParams.set("ref", ORCA_REFERRAL_CODE);
  if (input.appId?.trim()) url.searchParams.set("app_id", input.appId.trim());
  url.searchParams.set("scope", input.scope ?? "api");
  if (input.loginHint?.trim())
    url.searchParams.set("login_hint", input.loginHint.trim());
  return url.toString();
}

export function buildExchangeRequest(
  authBase: string,
  exchange: { code: string; verifier: string },
): ExchangeRequest {
  return {
    url: new URL(ORCA_EXCHANGE_PATH, authBase).toString(),
    body: {
      code: exchange.code,
      code_verifier: exchange.verifier,
      code_challenge_method: PKCE_CODE_CHALLENGE_METHOD,
    },
  };
}

/** Error bodies of this API are `{"error","error_description"}`. */
function exchangeError(status: number, payload: unknown) {
  const body =
    payload !== null && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const error = typeof body.error === "string" ? body.error : "";
  if (error === "timeout") return new OrcaCredentialError("timeout", status);
  if (error === "scopeDowngraded") return new OrcaCredentialError("scopeDowngraded", status);
  if (error === "invalidResponse") return new OrcaCredentialError("invalidResponse", status);
  if (error === "access_denied" || error === "authorizationDenied")
    return new OrcaCredentialError("authorizationDenied", status);
  if (status === 429) return new OrcaCredentialError("rateLimited", status);
  if (status === 401) return new OrcaCredentialError("codeRejected", status);
  if (status === 403) return new OrcaCredentialError("codeRejected", status);
  if (status === 400) return new OrcaCredentialError("codeRejected", status);
  return new OrcaCredentialError("networkError", status);
}

export interface ExchangeOptions {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

/**
 * Terminal 401/403 means "start a new authorization"; there is no refresh
 * grant to call and no key to rotate.
 */
export async function exchangeCodeForCredential(
  authBase: string,
  exchange: { code: string; verifier: string },
  options: ExchangeOptions = {},
): Promise<CredentialResult> {
  return exchangeCredentialRequest(buildExchangeRequest(authBase, exchange), options);
}

/** Shared response validation for the same-origin client and server exchange. */
export async function exchangeCredentialRequest(
  request: ExchangeRequest,
  options: ExchangeOptions = {},
): Promise<CredentialResult> {
  let response: Response;
  try {
    response = await (options.fetchImpl ?? fetch)(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.body),
      signal: options.signal,
      redirect: "error",
    });
  } catch (error) {
    if (options.signal?.aborted) {
      const reason = options.signal.reason;
      throw reason instanceof OrcaCredentialError
        ? reason
        : new OrcaCredentialError(reason instanceof Error && reason.name === "TimeoutError" ? "timeout" : "cancelled");
    }
    if (error instanceof OrcaCredentialError) throw error;
    if (error instanceof Error && error.name === "TimeoutError")
      throw new OrcaCredentialError("timeout");
    throw new OrcaCredentialError("networkError");
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) throw exchangeError(response.status, payload);

  const body =
    payload !== null && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const key = typeof body.key === "string" ? body.key.trim() : "";
  if (!key || /[\r\n]/.test(key) || key.length > 4096)
    throw new OrcaCredentialError("invalidResponse", response.status);
  // Read the granted scope back; it is what was granted, not what we asked
  // for. Only "api" satisfies this client's use, and an unreported scope is
  // not evidence of one.
  const scope = typeof body.scope === "string" ? body.scope : undefined;
  if (scope !== "api")
    throw new OrcaCredentialError("scopeDowngraded", response.status);
  return { apiKey: key, scope };
}

/** The PKCE adapter over the same credential seam as the API-key adapter. */
export const pkceCredentialAdapter: CredentialAdapter = {
  method: "oauth",
  interactive: true,
};
