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
        "flex shrink-0 items-center justify-center rounded-lg",
        compact
          ? "h-9 w-9"
          : "h-11 w-11 border border-border/60 bg-background/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:shadow-none",
      )}
    >
      <img
        src={theme.icon}
        alt=""
        className={cn(
          "object-contain",
          compact ? "h-4 w-4" : "h-5 w-5",
          theme.monochrome && "dark:invert",
        )}
      />
    </span>
  );
}
