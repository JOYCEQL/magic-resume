import {
  buildAuthorizeUrl,
  createCodeChallenge,
  createCodeVerifier,
  createState,
  exchangeCredentialRequest,
  validateCallbackUrl,
} from "./pkce";
import { OrcaCredentialError, type CredentialResult } from "./credential";

export const ORCA_LOCAL_EXCHANGE_PATH = "/api/orcarouter/exchange";
export const ORCA_CALLBACK_PATH = "/auth/orcarouter/callback";
export const ORCA_PENDING_KEY = "orcarouter-pkce-attempt";
export const ORCA_AUTH_TIMEOUT_MS = 10 * 60 * 1000;

type AttemptStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
interface PendingAttempt {
  state: string;
  verifier: string;
  callbackUrl: string;
  createdAt: number;
}

/** Only this tab holds the verifier across the external navigation. */
export async function prepareOrcaRedirect(input: {
  origin: string;
  authBase: string;
  storage: AttemptStorage;
  loginHint?: string;
  appId?: string;
  signal?: AbortSignal;
  now?: number;
}): Promise<string> {
  input.storage.removeItem(ORCA_PENDING_KEY);
  const callbackUrl = new URL(ORCA_CALLBACK_PATH, input.origin).href;
  validateCallbackUrl(callbackUrl);
  const verifier = createCodeVerifier();
  const state = createState();
  const codeChallenge = await createCodeChallenge(verifier);
  if (input.signal?.aborted) throw new OrcaCredentialError("cancelled");
  const authorizeUrl = buildAuthorizeUrl(input.authBase, {
    callbackUrl, state, codeChallenge, loginHint: input.loginHint, appId: input.appId,
  });
  const attempt: PendingAttempt = {
    state, verifier, callbackUrl, createdAt: input.now ?? Date.now(),
  };
  input.storage.setItem(ORCA_PENDING_KEY, JSON.stringify(attempt));
  return authorizeUrl;
}

/** Consume once, validate state and redirect target, then exchange the code. */
export async function completeOrcaRedirect(input: {
  callbackUrl: string;
  storage: AttemptStorage;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  now?: number;
}): Promise<CredentialResult> {
  const raw = input.storage.getItem(ORCA_PENDING_KEY);
  input.storage.removeItem(ORCA_PENDING_KEY);
  if (!raw) throw new OrcaCredentialError("codeRejected");
  let pending: PendingAttempt;
  try {
    pending = JSON.parse(raw);
  } catch {
    throw new OrcaCredentialError("codeRejected");
  }
  if (!pending || typeof pending.state !== "string" ||
      !/^[A-Za-z0-9_-]{22}$/.test(pending.state) ||
      typeof pending.verifier !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(pending.verifier) ||
      typeof pending.createdAt !== "number" || !Number.isFinite(pending.createdAt) ||
      typeof pending.callbackUrl !== "string") {
    throw new OrcaCredentialError("codeRejected");
  }
  const url = validateCallbackUrl(input.callbackUrl);
  if (pending.callbackUrl !== new URL(ORCA_CALLBACK_PATH, url.origin).href ||
      url.pathname !== ORCA_CALLBACK_PATH) {
    throw new OrcaCredentialError("invalidOrigin");
  }
  const states = url.searchParams.getAll("state");
  if (states.length !== 1 || states[0] !== pending.state) {
    throw new OrcaCredentialError("stateMismatch");
  }
  const elapsed = (input.now ?? Date.now()) - pending.createdAt;
  if (elapsed < 0 || elapsed >= ORCA_AUTH_TIMEOUT_MS) {
    throw new OrcaCredentialError("timeout");
  }
  if (url.searchParams.has("error")) {
    throw new OrcaCredentialError(url.searchParams.get("error") === "access_denied"
      ? "authorizationDenied" : "codeRejected");
  }
  const codes = url.searchParams.getAll("code");
  if (codes.length !== 1 || !codes[0].trim() || codes[0].length > 4096) {
    throw new OrcaCredentialError("codeRejected");
  }
  if (input.signal?.aborted) throw new OrcaCredentialError("cancelled");
  const credential = await exchangeCredentialRequest(
    { url: new URL(ORCA_LOCAL_EXCHANGE_PATH, url.origin).href,
      body: { code: codes[0], code_verifier: pending.verifier, code_challenge_method: "S256" } },
    {
      fetchImpl: input.fetchImpl,
      signal: AbortSignal.any([
        AbortSignal.timeout(30_000),
        ...(input.signal ? [input.signal] : []),
      ]),
    },
  );
  if (input.signal?.aborted) throw new OrcaCredentialError("cancelled");
  return credential;
}
