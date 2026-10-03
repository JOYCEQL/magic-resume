/**
 * The credential seam. Every OrcaRouter entry point consumes an
 * `AIConnection`; the two user-facing choices (a pasted API key and the
 * OrcaRouter sign-in) are adapters that both produce exactly that.
 *
 * Nothing downstream — request building, model discovery, the AI entry
 * points — may branch on which adapter produced the credential.
 */

export interface CredentialResult {
  apiKey: string;
  /** Granted scope reported by the exchange, when the flow reports one. */
  scope?: string;
}

export interface CredentialAdapter {
  readonly method: "api-key" | "oauth";
  /** True when the adapter needs a user round-trip before it can resolve. */
  readonly interactive: boolean;
}

export class OrcaCredentialError extends Error {
  readonly code: OrcaCredentialErrorCode;
  readonly status?: number;

  constructor(code: OrcaCredentialErrorCode, status?: number) {
    super(`OrcaRouter credential error (${code})`);
    // Never let a stack or an upstream body carry a credential or verifier.
    this.name = "OrcaCredentialError";
    this.code = code;
    this.status = status;
  }
}

export type OrcaCredentialErrorCode =
  | "missingKey"
  | "invalidKey"
  | "authorizationDenied"
  | "stateMismatch"
  | "codeRejected"
  | "scopeDowngraded"
  | "rateLimited"
  | "timeout"
  | "cancelled"
  | "networkError"
  | "invalidOrigin"
  | "invalidResponse";

export type OrcaErrorToken =
  | "missingKey"
  | "invalidKey"
  | "signInDenied"
  | "signInStateMismatch"
  | "signInExpired"
  | "signInScope"
  | "signInRateLimited"
  | "signInTimeout"
  | "signInCancelled"
  | "signInNetwork"
  | "signInUnavailable";

/** Short, user-facing tokens; never contain any part of a credential. */
export function orcaErrorToken(error: unknown): OrcaErrorToken | null {
  if (!(error instanceof OrcaCredentialError)) return null;
  switch (error.code) {
    case "missingKey":
    case "invalidKey":
      return error.code;
    case "authorizationDenied":
      return "signInDenied";
    case "stateMismatch":
      return "signInStateMismatch";
    case "codeRejected":
      return "signInExpired";
    case "scopeDowngraded":
      return "signInScope";
    case "rateLimited":
      return "signInRateLimited";
    case "timeout":
      return "signInTimeout";
    case "cancelled":
      return "signInCancelled";
    case "networkError":
      return "signInNetwork";
    default:
      return "signInUnavailable";
  }
}

/**
 * Shape check only. An `sk-orca-` prefix is not proof that a credential is
 * valid, so this never claims more than "not obviously wrong"; the first real
 * request establishes validity.
 */
export function normalizeApiKey(value: string): string {
  const key = value.trim();
  if (!key) throw new OrcaCredentialError("missingKey");
  if (key.length > 4096 || /[\r\n]/.test(key))
    throw new OrcaCredentialError("invalidKey");
  return key;
}

/** API-key adapter: the user pastes their own `sk-orca-…` key. */
export const apiKeyCredentialAdapter: CredentialAdapter = {
  method: "api-key",
  interactive: false,
};

export function credentialFromApiKey(value: string): CredentialResult {
  return { apiKey: normalizeApiKey(value) };
}

/** Masks a credential for display without revealing any of its body. */
export function maskCredential(value: string, visible = 4): string {
  const key = value.trim();
  if (!key) return "";
  if (key.length <= visible * 2) return "•".repeat(key.length);
  return `${key.slice(0, visible)}${"•".repeat(12)}${key.slice(-visible)}`;
}
