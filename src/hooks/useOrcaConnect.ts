import { useCallback, useEffect, useRef, useState } from "react";
import { prepareOrcaRedirect } from "@/lib/orcarouter/redirect";
import { orcaErrorToken, type OrcaErrorToken } from "@/lib/orcarouter/credential";
import { orcaEnvironmentFromBuild, orcaPartnerAppIdFromBuild, resolveOrcaOrigins } from "@/config/orcarouter";

export function useOrcaConnectSession() {
  const [snapshot, setSnapshot] = useState<{ busy: boolean; errorToken: OrcaErrorToken | null }>({
    busy: false, errorToken: null,
  });
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  const reset = useCallback(() => {
    controller.current?.abort();
    setSnapshot({ busy: false, errorToken: null });
  }, []);

  const begin = useCallback(async (loginHint?: string) => {
    controller.current?.abort();
    const attempt = new AbortController();
    controller.current = attempt;
    setSnapshot({ busy: true, errorToken: null });
    try {
      const { authBase } = resolveOrcaOrigins(orcaEnvironmentFromBuild());
      const url = await prepareOrcaRedirect({
        origin: window.location.origin,
        authBase,
        appId: orcaPartnerAppIdFromBuild(),
        storage: window.sessionStorage,
        loginHint,
        signal: attempt.signal,
      });
      if (!attempt.signal.aborted) window.location.assign(url);
    } catch (error) {
      if (!attempt.signal.aborted) {
        setSnapshot({ busy: false, errorToken: orcaErrorToken(error) ?? "signInUnavailable" });
      }
    }
  }, []);
  return { snapshot, begin, reset };
}
