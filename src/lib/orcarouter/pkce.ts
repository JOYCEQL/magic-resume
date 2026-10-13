import {
  ORCA_AUTHORIZE_PATH,
  ORCA_EXCHANGE_PATH,
  resolveOrcaOrigins,
  type OrcaOriginEnvironment,
  type OrcaOriginOverrides,
} from "@/config/orcarouter";
import {
  OrcaCredentialError,
  type CredentialAdapter,
  type CredentialResult,
} from "./credential";

/**
 * Flow B (out-of-band code). The exchange runs in the browser and the auth
 * endpoint answers CORS for it; the code is displayed on the consent screen
 * for the user to paste back, so no callback listener and no pre-registered
 * redirect URI is needed on any deployment address. S256 is mandatory here
 * and is always sent, because a displayed code is handled by a human.
 */
export const PKCE_CODE_CHALLENGE_METHOD = "S256";
export const ORCA_APP_NAME = "Magic Resume";

export interface AuthorizeRequestInput {
  state: string;
  codeChallenge: string;
  appName?: string;
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

export function buildAuthorizeUrl(
  authBase: string,
  input: AuthorizeRequestInput,
) {
  const url = new URL(ORCA_AUTHORIZE_PATH, authBase);
  // Flow B: the literal "oob", so the mode is asked for rather than guessed.
  url.searchParams.set("callback_url", "oob");
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", PKCE_CODE_CHALLENGE_METHOD);
  url.searchParams.set("state", input.state);
  url.searchParams.set("app_name", input.appName ?? ORCA_APP_NAME);
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
  if (error === "access_denied")
    return new OrcaCredentialError("authorizationDenied", status);
  if (status === 429) return new OrcaCredentialError("rateLimited", status);
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
  const request = buildExchangeRequest(authBase, exchange);
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
        : new OrcaCredentialError("cancelled");
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

export interface Attempt {
  generation: number;
  verifier: string;
  state: string;
  authorizeUrl: string;
  status: "pending" | "exchanging" | "completed" | "failed" | "cancelled";
}

export interface ConnectControllerOptions {
  environment?: OrcaOriginEnvironment;
  overrides?: OrcaOriginOverrides;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  open?: (url: string) => void;
  now?: () => number;
}

export interface ConnectResult {
  credential: CredentialResult;
  generation: number;
}

export class OrcaConnectController {
  private readonly origins: { authBase: string; apiBase: string };
  private readonly fetchImpl?: typeof fetch;
  private readonly timeoutMs: number;
  private readonly open?: (url: string) => void;
  private readonly now: () => number;
  private generation = 0;
  private attempt?: Attempt;
  private abort?: AbortController;
  private startedAt = 0;

  constructor(options: ConnectControllerOptions = {}) {
    this.origins = resolveOrcaOrigins(
      options.environment ?? {},
      options.overrides ?? {},
    );
    this.fetchImpl = options.fetchImpl;
    this.timeoutMs = options.timeoutMs ?? 300_000;
    this.open = options.open;
    this.now = options.now ?? (() => Date.now());
  }

  /** Exposed so the UI can show where a sign-in will send the user. */
  get authOrigin() {
    return this.origins.authBase;
  }

  get current() {
    return this.attempt;
  }

  /** Starts a new attempt with a fresh verifier and state. */
  async begin(input: { appName?: string; loginHint?: string } = {}) {
    const generation = this.startNewAttempt();
    const verifier = createCodeVerifier();
    const state = createState();
    const codeChallenge = await createCodeChallenge(verifier);
    // A later begin()/cancel()/pagehide must win over this one.
    if (generation !== this.generation)
      throw new OrcaCredentialError("cancelled");
    const authorizeUrl = buildAuthorizeUrl(this.origins.authBase, {
      state,
      codeChallenge,
      appName: input.appName,
      loginHint: input.loginHint,
    });
    this.attempt = {
      generation,
      verifier,
      state,
      authorizeUrl,
      status: "pending",
    };
    this.startedAt = this.now();
    this.open?.(authorizeUrl);
    return { generation, authorizeUrl, state };
  }

  private startNewAttempt() {
    this.release();
    return this.generation;
  }

  /**
   * Completes the pending attempt. Rejects with a typed error for denial,
   * mismatch, expiry, rate limiting, timeout and cancellation, and never
   * leaves the controller busy afterwards.
   */
  async complete(input: { code: string; state?: string }): Promise<ConnectResult> {
    const attempt = this.attempt;
    if (!attempt) throw new OrcaCredentialError("cancelled");
    const generation = attempt.generation;
    const stale = () => generation !== this.generation;

    // Compare the returned state before using the code at all.
    if (input.state !== undefined && input.state !== attempt.state) {
      attempt.status = "failed";
      throw new OrcaCredentialError("stateMismatch");
    }
    const code = input.code.trim();
    if (!code) {
      attempt.status = "failed";
      throw new OrcaCredentialError("codeRejected");
    }
    const elapsed = this.now() - this.startedAt;
    const remaining = this.timeoutMs - elapsed;
    if (remaining <= 0) {
      attempt.status = "failed";
      throw new OrcaCredentialError("timeout");
    }
    if (stale()) throw new OrcaCredentialError("cancelled");

    attempt.status = "exchanging";
    const controller = new AbortController();
    const abort = controller.signal;
    const timeout = setTimeout(
      () => controller.abort(new OrcaCredentialError("timeout")),
      remaining,
    );
    this.abort = controller;
    try {
      const credential = await exchangeCodeForCredential(
        this.origins.authBase,
        { code, verifier: attempt.verifier },
        { fetchImpl: this.fetchImpl, signal: abort },
      );
      if (stale()) throw new OrcaCredentialError("cancelled");
      attempt.status = "completed";
      return { credential, generation };
    } catch (error) {
      attempt.status =
        error instanceof OrcaCredentialError && error.code === "cancelled"
          ? "cancelled"
          : "failed";
      throw error;
    } finally {
      clearTimeout(timeout);
      if (this.abort === controller) this.abort = undefined;
      // The verifier is single-use; drop it as soon as the attempt ends.
      attempt.verifier = "";
    }
  }

  /** Explicit cancel, provider switch, modal close, unmount and pagehide. */
  cancel() {
    this.release();
  }

  /** Advances the generation, killing every in-flight response. */
  private release() {
    this.generation += 1;
    this.abort?.abort(new OrcaCredentialError("cancelled"));
    this.abort = undefined;
    if (this.attempt && this.attempt.status !== "completed")
      this.attempt.status = "cancelled";
    this.attempt = undefined;
  }
}

/** The PKCE adapter over the same credential seam as the API-key adapter. */
export const pkceCredentialAdapter: CredentialAdapter = {
  method: "oauth",
  interactive: true,
};
