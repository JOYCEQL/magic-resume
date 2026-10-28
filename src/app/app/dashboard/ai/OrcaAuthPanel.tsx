import { Check, ExternalLink, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/compat/client";
import { ORCA_KEY_DASHBOARD_URL } from "@/config/orcarouter";
import type { AIModelProfile } from "@/config/ai-models";
import type { useOrcaConnectSession } from "@/hooks/useOrcaConnect";
import { ProviderKeyInput } from "./ProviderKeyInput";

type ConnectSession = ReturnType<typeof useOrcaConnectSession>;

export function OrcaConnectButton({ profile, connect }: {
  profile: AIModelProfile;
  connect: ConnectSession;
}) {
  const t = useTranslations("dashboard.settings.ai.workspace.orca");
  const authorized = !!profile.apiKey.trim() && profile.authMethod === "oauth";

  return (
    <Button
      type="button"
      data-testid="orca-connect"
      disabled={connect.snapshot.busy}
      aria-busy={connect.snapshot.busy}
      onClick={() => void connect.begin()}
      className="h-9 shrink-0 gap-1.5 rounded-lg px-3 text-xs font-medium shadow-sm"
    >
      {connect.snapshot.busy
        ? <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
        : <LogIn aria-hidden="true" className="h-3.5 w-3.5" />}
      {t(connect.snapshot.busy ? "redirecting" : authorized || profile.needsReauth ? "reauthorize" : "authorize")}
    </Button>
  );
}

export function OrcaAuthPanel({ profile, connect, onKeyChange, onClearKey }: {
  profile: AIModelProfile;
  connect: ConnectSession;
  onKeyChange: (apiKey: string) => void;
  onClearKey: () => void;
}) {
  const t = useTranslations("dashboard.settings.ai.workspace.orca");
  const signedIn = !!profile.apiKey.trim() && profile.authMethod === "oauth" && !profile.needsReauth;

  return (
    <div className="space-y-3" data-testid="orca-auth-panel">
      <ProviderKeyInput
        id="orca-key"
        testId="orca-api-key-input"
        describedBy="orca-key-hint"
        value={profile.apiKey}
        onChange={(value) => { connect.reset(); onKeyChange(value); }}
        onClear={() => { connect.reset(); onClearKey(); }}
      />
      <div id="orca-key-hint" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs leading-5 text-muted-foreground">
        {signedIn ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <Check aria-hidden="true" className="h-3.5 w-3.5" />
              {t("authorized")}
            </span>
            <a href={ORCA_KEY_DASHBOARD_URL} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline">
              {t("manageKeys")}
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
            </a>
          </>
        ) : t("authorizationHint")}
      </div>
      {connect.snapshot.errorToken && (
        <p role="alert" className="text-xs text-destructive">
          {t(`errors.${connect.snapshot.errorToken}`)}
        </p>
      )}
      {profile.needsReauth && (
        <p role="alert" data-testid="orca-needs-reauth"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {t("needsReauth")}
        </p>
      )}
    </div>
  );
}
