import { useState } from "react";
import { ExternalLink, Eye, EyeOff, KeyRound, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/i18n/compat/client";
import { cn } from "@/lib/utils";
import {
  ORCA_KEY_DASHBOARD_URL,
  ORCA_SEED_MODELS,
} from "@/config/orcarouter";
import { maskCredential } from "@/lib/orcarouter/credential";
import type { AIModelProfile, AIAuthMethod } from "@/config/ai-models";
import { useOrcaConnectSession } from "@/hooks/useOrcaConnect";

interface Props {
  profile: AIModelProfile;
  onKeyChange: (apiKey: string) => void;
  onSelectMethod: (method: AIAuthMethod, apiKey?: string) => void;
  onClearKey: () => void;
}

/**
 * The two OrcaRouter entry points side by side: paste an existing API key, or
 * sign in. Both end in the same credential; the labels stay distinct
 * everywhere they appear.
 */
export function OrcaAuthPanel({
  profile,
  onKeyChange,
  onSelectMethod,
  onClearKey,
}: Props) {
  const t = useTranslations("dashboard.settings.ai.workspace.orca");
  const [showKey, setShowKey] = useState(false);
  const [code, setCode] = useState("");
  const [loginHint, setLoginHint] = useState("");
  const connect = useOrcaConnectSession();
  const hasKey = !!profile.apiKey.trim();
  const method: AIAuthMethod = profile.authMethod ?? "api-key";

  const startSignIn = async () => {
    await connect.begin(loginHint.trim() || undefined);
    onSelectMethod("oauth");
  };

  const submit = async () => {
    const result = await connect.submitCode(code);
    if (!result) return;
    setCode("");
    toast.success(t("connected"));
  };

  const switchToSignIn = () => {
    connect.reset();
    onSelectMethod("oauth");
  };

  return (
    <div className="mt-4 space-y-4" data-testid="orca-auth-panel">
      <div className="grid gap-3 sm:grid-cols-2">
        <section
          data-testid="orca-api-key-method"
          className={cn(
            "rounded-xl border p-4 transition-colors",
            method === "api-key" ? "border-foreground/25 bg-white/70 dark:bg-white/[0.05]" : "border-border/60 bg-background/40",
          )}
          onClick={() => method !== "api-key" && onSelectMethod("api-key")}
        >
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <h4 className="font-sans text-sm font-semibold">{t("apiKeyTitle")}</h4>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("apiKeyHint")}</p>
          <Label htmlFor="orca-key" className="mt-3 block text-xs font-medium">
            {t("apiKeyLabel")}
          </Label>
          <div className="relative mt-1.5 flex items-center">
            <Input
              id="orca-key"
              data-testid="orca-api-key-input"
              type={showKey ? "text" : "password"}
              autoComplete="off"
              value={profile.apiKey}
              onChange={(event) => {
                onSelectMethod("api-key");
                onKeyChange(event.target.value);
              }}
              placeholder="sk-orca-…"
              className="h-10 rounded-lg border-border/80 bg-background/70 pr-11 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/70 hover:text-foreground"
              aria-label={t(showKey ? "hideKey" : "showKey")}
            >
              {showKey ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          {hasKey && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span
                data-testid="orca-secret-masked"
                className="truncate font-mono text-[11px] text-muted-foreground"
              >
                {maskCredential(profile.apiKey)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={onClearKey}
              >
                {t("clearKey")}
              </Button>
            </div>
          )}
        </section>

        <section
          data-testid="orca-signin-method"
          className={cn(
            "rounded-xl border p-4 transition-colors",
            method === "oauth" ? "border-foreground/25 bg-white/70 dark:bg-white/[0.05]" : "border-border/60 bg-background/40",
          )}
          onClick={() => method !== "oauth" && switchToSignIn()}
        >
          <div className="flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            <h4 className="font-sans text-sm font-semibold">{t("signInTitle")}</h4>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("signInHint")}</p>
          <Label htmlFor="orca-email" className="mt-3 block text-xs font-medium">
            {t("emailLabel")}
          </Label>
          <Input
            id="orca-email"
            type="email"
            autoComplete="email"
            value={loginHint}
            onChange={(event) => setLoginHint(event.target.value)}
            placeholder={t("emailPlaceholder")}
            className="mt-1.5 h-10 rounded-lg border-border/80 bg-background/70 text-xs"
          />
          <Button
            type="button"
            data-testid="orca-connect"
            size="sm"
            className="mt-3 h-9 w-full gap-1.5 text-xs font-medium"
            disabled={connect.snapshot.busy}
            onClick={startSignIn}
          >
            {connect.snapshot.busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogIn className="h-3.5 w-3.5" />
            )}
            {t("connectAction")}
          </Button>

          {connect.snapshot.hint && (
            <div className="mt-3 space-y-2 rounded-lg border border-border/60 bg-background/60 p-3">
              <p className="text-[11px] text-muted-foreground">{t("codeHint")}</p>
              <a
                data-testid="orca-authorize-link"
                href={connect.snapshot.hint}
                target="_blank"
                rel="noreferrer"
                className="block truncate font-mono text-[11px] text-primary underline underline-offset-2"
              >
                {connect.snapshot.hint}
              </a>
              <div className="flex gap-2">
                <Input
                  data-testid="orca-code-input"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder={t("codePlaceholder")}
                  className="h-9 rounded-lg border-border/80 bg-background/70 font-mono text-xs"
                />
                <Button
                  type="button"
                  data-testid="orca-code-submit"
                  size="sm"
                  className="h-9 shrink-0 text-xs"
                  disabled={!code.trim() || connect.snapshot.busy}
                  onClick={submit}
                >
                  {t("codeSubmit")}
                </Button>
              </div>
            </div>
          )}

          {connect.snapshot.errorToken && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {t(`errors.${connect.snapshot.errorToken}`)}
            </p>
          )}
          {connect.snapshot.status === "awaiting-code" && (
            <button
              type="button"
              className="mt-2 text-[11px] text-muted-foreground underline underline-offset-2"
              onClick={() => connect.cancel()}
            >
              {t("cancelSignIn")}
            </button>
          )}
        </section>
      </div>

      {profile.needsReauth && (
        <div
          role="alert"
          data-testid="orca-needs-reauth"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5"
        >
          <span className="text-xs text-destructive">{t("needsReauth")}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={startSignIn}
          >
            {t("reauth")}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <a
          href={ORCA_KEY_DASHBOARD_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-2"
        >
          {t("manageKeys")}
          <ExternalLink className="h-3 w-3" />
        </a>
        <span>{t("saveHint", { count: ORCA_SEED_MODELS.length })}</span>
      </div>
    </div>
  );
}
