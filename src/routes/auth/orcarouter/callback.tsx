import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/i18n/compat/client";
import { completeOrcaRedirect, ORCA_CALLBACK_PATH } from "@/lib/orcarouter/redirect";
import { orcaErrorToken, type CredentialResult, type OrcaErrorToken } from "@/lib/orcarouter/credential";
import { useAIConfigStore } from "@/store/useAIConfigStore";

export const Route = createFileRoute("/auth/orcarouter/callback")({
  ssr: false,
  head: () => ({ meta: [
    { name: "robots", content: "noindex,nofollow" },
    { name: "referrer", content: "no-referrer" },
  ] }),
  component: OrcaCallback,
});

function OrcaCallback() {
  const t = useTranslations("dashboard.settings.ai.workspace.orca");
  const navigate = useNavigate();
  const saveCredential = useAIConfigStore((state) => state.saveOrcaCredential);
  const [error, setError] = useState<OrcaErrorToken | null>(null);
  const job = useRef<{ controller: AbortController; promise: Promise<CredentialResult> } | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    if (!job.current) {
      const callbackUrl = window.location.href;
      // Remove the one-time code from history before starting the exchange.
      window.history.replaceState(window.history.state, "", ORCA_CALLBACK_PATH);
      const controller = new AbortController();
      job.current = {
        controller,
        promise: Promise.resolve().then(() => completeOrcaRedirect({
          callbackUrl,
          storage: window.sessionStorage,
          signal: controller.signal,
        })),
      };
    }
    const current = job.current;
    current.promise.then((credential) => {
      if (!active || current.controller.signal.aborted) return;
      saveCredential(credential.apiKey, "oauth");
      toast.success(t("connected"));
      void navigate({ to: "/app/dashboard/ai", search: { provider: "orcarouter" }, replace: true });
    }).catch((failure: unknown) => {
      if (active) setError(orcaErrorToken(failure) ?? "signInUnavailable");
    });
    return () => {
      active = false;
      mounted.current = false;
      // React Strict Mode immediately re-runs the effect; reuse its one exchange.
      queueMicrotask(() => { if (!mounted.current) current.controller.abort(); });
    };
  }, [navigate, saveCredential, t]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm space-y-4 text-center">
        {!error && <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />}
        <h1 className="text-xl font-semibold">{t(error ? "callbackFailed" : "callbackTitle")}</h1>
        <p role={error ? "alert" : "status"} className="text-sm text-muted-foreground">
          {t(error ? `errors.${error}` : "callbackProgress")}
        </p>
        {error && (
          <Link to="/app/dashboard/ai" search={{ provider: "orcarouter" }} replace
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            {t("returnToSettings")}
          </Link>
        )}
      </div>
    </main>
  );
}
