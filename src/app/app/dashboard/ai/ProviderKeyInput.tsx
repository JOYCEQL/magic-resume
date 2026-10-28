import { useEffect, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/i18n/compat/client";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  testId?: string;
  describedBy?: string;
}

/** All providers use the same credential field, including authorized keys. */
export function ProviderKeyInput({ id, value, onChange, onClear, testId, describedBy }: Props) {
  const t = useTranslations("dashboard.settings.ai.workspace");
  const [showKey, setShowKey] = useState(false);
  useEffect(() => setShowKey(false), [id]);

  return (
    <div className="space-y-3">
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        {t("apiKey")}
      </Label>
      <div className="relative flex items-center">
        <Input
          id={id}
          data-testid={testId}
          aria-describedby={describedBy}
          type={showKey ? "text" : "password"}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("providerKeyPlaceholder")}
          className={cn(
            "h-11 rounded-lg border-border/80 bg-background/70 text-sm shadow-[inset_0_1px_2px_rgba(28,28,24,0.03)] transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-muted-foreground/80 hover:border-foreground/25 focus-visible:border-foreground/30 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-foreground/10 focus-visible:ring-offset-0 motion-reduce:transition-none",
            onClear && value ? "pr-20" : "pr-11",
          )}
        />
        <div className="absolute right-1.5 flex items-center">
          {onClear && value && (
            <button
              type="button"
              onClick={() => { setShowKey(false); onClear(); }}
              aria-label={t("orca.clearKey")}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            aria-label={t(showKey ? "hideKey" : "showKey")}
            aria-pressed={showKey}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showKey ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
