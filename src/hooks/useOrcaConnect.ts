import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createOrcaConnectSession,
  type OrcaConnectSnapshot,
} from "@/lib/orcarouter/connect";
import {
  OrcaConnectController,
  type ConnectResult,
} from "@/lib/orcarouter/pkce";
import {
  orcaEnvironmentFromBuild,
  resolveOrcaOrigins,
} from "@/config/orcarouter";
import { useAIConfigStore } from "@/store/useAIConfigStore";

const IDLE: OrcaConnectSnapshot = {
  generation: 0,
  status: "idle",
  busy: false,
  hint: null,
  errorToken: null,
};

/**
 * Wires the login state machine to the browser lifecycle: `pagehide` must
 * clear busy/hint and a second login must be possible without remounting.
 */
export function useOrcaConnectSession() {
  const [snapshot, setSnapshot] = useState<OrcaConnectSnapshot>(IDLE);
  const saveModel = useAIConfigStore((state) => state.saveModel);
  const models = useAIConfigStore((state) => state.models);
  const modelsRef = useRef(models);
  modelsRef.current = models;

  const origins = useMemo(() => resolveOrcaOrigins(orcaEnvironmentFromBuild()), []);

  const controller = useMemo(
    () =>
      new OrcaConnectController({
        environment: orcaEnvironmentFromBuild(),
        // Flow B starts with a real browser navigation; the returned URL is
        // still shown in the panel for blocked popups and headless use.
        open: (url) => {
          if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
        },
      }),
    [],
  );

  const session = useMemo(
    () =>
      createOrcaConnectSession({
        controller,
        onChange: setSnapshot,
        onCredential: ({ credential, generation }: ConnectResult) => {
          // One credential for the whole provider, whichever adapter produced
          // it: every stored OrcaRouter profile inherits it. A successful
          // login is the only thing that clears the reauthentication state.
          const profiles = modelsRef.current.filter(
            (profile) => profile.provider === "orcarouter",
          );
          for (const profile of profiles) {
            saveModel({
              ...profile,
              apiKey: credential.apiKey,
              generation,
              needsReauth: false,
            });
          }
        },
      }),
    [controller, saveModel],
  );

  useEffect(() => {
    const onPageHide = () => session.handlePageHide();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      session.dispose();
    };
  }, [session]);

  return {
    snapshot,
    authBase: origins.authBase,
    apiBase: origins.apiBase,
    begin: useCallback(
      (loginHint?: string) => session.begin({ loginHint }),
      [session],
    ),
    submitCode: useCallback(
      (code: string, state?: string) => session.submitCode(code, state),
      [session],
    ),
    cancel: useCallback(() => session.cancel(), [session]),
    reset: useCallback(() => session.reset(), [session]),
  };
}
