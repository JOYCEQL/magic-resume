import {
  OrcaCredentialError,
  orcaErrorToken,
  type OrcaErrorToken,
} from "./credential";
import { OrcaConnectController, type ConnectResult } from "./pkce";

export type OrcaConnectStatus =
  | "idle"
  | "starting"
  | "awaiting-code"
  | "exchanging"
  | "error";

export interface OrcaConnectSnapshot {
  /** Monotonic attempt id; a response from another generation is ignored. */
  generation: number;
  status: OrcaConnectStatus;
  busy: boolean;
  /** The authorization URL to show when the browser did not open it. */
  hint: string | null;
  errorToken: OrcaErrorToken | null;
}

export interface OrcaConnectSessionOptions {
  controller: OrcaConnectController;
  /** Called for every state transition, including the synchronous pagehide one. */
  onChange: (snapshot: OrcaConnectSnapshot) => void;
  /** Applied once the exchange produced a credential. */
  onCredential?: (result: ConnectResult) => void;
  /** Cancels server-side work on pagehide where the runtime supports it. */
  cancelRemote?: (generation: number) => void;
}

const IDLE: Omit<OrcaConnectSnapshot, "generation"> = {
  status: "idle",
  busy: false,
  hint: null,
  errorToken: null,
};

/**
 * Login state machine. It owns the busy flag and the authorization hint, so
 * every terminal path — success, denial, exchange error, timeout, cancel,
 * provider switch, unmount and `pagehide` — clears both.
 */
export function createOrcaConnectSession(options: OrcaConnectSessionOptions) {
  let snapshot: OrcaConnectSnapshot = { ...IDLE, generation: 0 };
  let disposed = false;

  const publish = (next: Partial<OrcaConnectSnapshot>) => {
    snapshot = { ...snapshot, ...next };
    options.onChange(snapshot);
  };

  return {
    get snapshot() {
      return snapshot;
    },

    async begin(input: { loginHint?: string } = {}) {
      if (disposed) return;
      publish({
        status: "starting",
        busy: true,
        hint: null,
        errorToken: null,
        generation: snapshot.generation + 1,
      });
      const generation = snapshot.generation;
      try {
        const { authorizeUrl } = await options.controller.begin(input);
        if (disposed || generation !== snapshot.generation) return;
        publish({ status: "awaiting-code", busy: false, hint: authorizeUrl });
      } catch (error) {
        if (disposed || generation !== snapshot.generation) return;
        publish({
          status: "error",
          busy: false,
          hint: null,
          errorToken: orcaErrorToken(error) ?? "signInUnavailable",
        });
      }
    },

    /** Reads a pasted code back into the same credential seam. */
    async submitCode(code: string, state?: string) {
      if (disposed || snapshot.status !== "awaiting-code") return;
      const generation = snapshot.generation;
      publish({ status: "exchanging", busy: true, errorToken: null });
      try {
        const result = await options.controller.complete({ code, state });
        if (disposed || generation !== snapshot.generation) return;
        options.onCredential?.(result);
        publish({ status: "idle", busy: false, hint: null, errorToken: null });
        return result;
      } catch (error) {
        if (disposed || generation !== snapshot.generation) return;
        publish({
          status: "error",
          busy: false,
          hint: null,
          errorToken: orcaErrorToken(error) ?? "signInUnavailable",
        });
        return undefined;
      }
    },

    cancel() {
      if (disposed) return;
      options.controller.cancel();
      // A cancelled sign-in is not an error state, it is simply over.
      publish({ ...IDLE, generation: snapshot.generation + 1 });
    },

    /** Provider switch, modal close and method switch. */
    reset() {
      if (disposed) return;
      options.controller.cancel();
      publish({ ...IDLE, generation: snapshot.generation + 1 });
    },

    /**
     * Back-forward-cache path. Browsers may keep the mounted page alive, so
     * the guarded `finally` blocks cannot be relied on to clear the UI:
     * invalidate the generation, synchronously clear busy+hint, then ask for
     * remote cancellation.
     */
    handlePageHide() {
      if (disposed) return;
      const generation = snapshot.generation + 1;
      options.controller.cancel();
      publish({ ...IDLE, generation });
      options.cancelRemote?.(generation);
    },

    /** Component unmount: cancel work without touching rendered state. */
    dispose() {
      disposed = true;
      options.controller.cancel();
    },
  };
}

export { OrcaCredentialError };
export type { OrcaConnectController };
