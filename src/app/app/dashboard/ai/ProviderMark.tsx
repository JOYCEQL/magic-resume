import anthropicIcon from "@lobehub/icons-static-svg/icons/anthropic.svg?url";
import deepseekIcon from "@lobehub/icons-static-svg/icons/deepseek-color.svg?url";
import doubaoIcon from "@lobehub/icons-static-svg/icons/doubao-color.svg?url";
import geminiIcon from "@lobehub/icons-static-svg/icons/gemini-color.svg?url";
import openaiIcon from "@lobehub/icons-static-svg/icons/openai.svg?url";
import qwenIcon from "@lobehub/icons-static-svg/icons/qwen-color.svg?url";
import { cn } from "@/lib/utils";
import type { AIProvider } from "@/config/ai-models";

interface Props {
  provider: AIProvider;
  compact?: boolean;
}

const PROVIDER_THEMES: Record<
  AIProvider,
  {
    icon: string;
    monochrome?: boolean;
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
};

export function ProviderMark({ provider, compact = false }: Props) {
  const theme = PROVIDER_THEMES[provider];

  return (
    <span
      aria-hidden
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/95 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02] dark:ring-white/[0.04] transition-all duration-200",
        compact ? "h-9 w-9" : "h-11 w-11",
      )}
    >
      <img
        src={theme.icon}
        alt=""
        className={cn(
          "object-contain transition-transform duration-200",
          compact ? "h-4 w-4" : "h-5 w-5",
          theme.monochrome && "dark:invert",
        )}
      />
    </span>
  );
}
