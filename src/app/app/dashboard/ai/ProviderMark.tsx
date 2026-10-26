import anthropicIcon from "@lobehub/icons-static-svg/icons/anthropic.svg?url";
import deepseekIcon from "@lobehub/icons-static-svg/icons/deepseek-color.svg?url";
import doubaoIcon from "@lobehub/icons-static-svg/icons/doubao-color.svg?url";
import geminiIcon from "@lobehub/icons-static-svg/icons/gemini-color.svg?url";
import openaiIcon from "@lobehub/icons-static-svg/icons/openai.svg?url";
import qwenIcon from "@lobehub/icons-static-svg/icons/qwen-color.svg?url";
import { cn } from "@/lib/utils";
import type { AIProvider } from "@/config/ai-models";
import OrcaRouterLogo from "@/components/ai/icon/IconOrcaRouter";

interface Props {
  provider: AIProvider;
  compact?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const PROVIDER_THEMES: Record<
  AIProvider,
  {
    icon?: string;
    monochrome?: boolean;
    vector?: boolean;
  }
> = {
  openai: {
    icon: openaiIcon,
    monochrome: true,
  },
  deepseek: {
    icon: deepseekIcon,
  },
  doubao: {
    icon: doubaoIcon,
  },
  gemini: {
    icon: geminiIcon,
  },
  qwen: {
    icon: qwenIcon,
  },
  anthropic: {
    icon: anthropicIcon,
    monochrome: true,
  },
  orcarouter: {
    vector: true,
    monochrome: true,
  },
};

export function ProviderMark({
  provider,
  compact = false,
  size,
  className,
}: Props) {
  const theme = PROVIDER_THEMES[provider];
  const resolvedSize = size ?? (compact ? "md" : "lg");

  const containerSizeClass = {
    xs: "h-5 w-5 rounded-md border border-border/60 bg-white shadow-2xs dark:bg-secondary/80",
    sm: "h-6 w-6 rounded-md border border-border/60 bg-white shadow-2xs dark:bg-secondary/80",
    md: "h-9 w-9 rounded-lg",
    lg: "h-11 w-11 rounded-lg border border-border/60 bg-background/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:shadow-none",
  }[resolvedSize];

  const iconSizeClass = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[resolvedSize];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center",
        containerSizeClass,
        className,
      )}
    >
      {theme.vector ? (
        <OrcaRouterLogo
          size={{ xs: 12, sm: 14, md: 16, lg: 20 }[resolvedSize]}
          className={cn(
            "object-contain",
            theme.monochrome && "text-foreground",
          )}
        />
      ) : (
        <img
          src={theme.icon}
          alt=""
          className={cn(
            "object-contain",
            iconSizeClass,
            theme.monochrome && "dark:invert",
          )}
        />
      )}
    </span>
  );
}
