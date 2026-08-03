import { ArrowRight, Network, Stethoscope, Target } from "lucide-react";
import type { Translator } from "@/i18n/compat/utils";

const CARD_KEYS = ["restructure", "matchSkills", "diagnose"] as const;

const CARD_ICONS = {
  restructure: Network,
  matchSkills: Target,
  diagnose: Stethoscope,
} satisfies Record<(typeof CARD_KEYS)[number], typeof Network>;

interface AgentWelcomeProps {
  t: Translator;
  /** 把卡片对应的提示词填进输入框，不自动发送 —— 用户仍可编辑 */
  onPickPrompt: (prompt: string) => void;
}

/**
 * 空状态：主题是「纸」。签名元素是一张淡化的 A4 纸片（竖排印刷线占位），
 * 与右侧预览 Tab 的「待排版空白纸」呼应——产出物就是一张打印级简历。
 * 文案只讲两件事：只依据真实经历、不确定的先问。
 */
export const AgentWelcome = ({ t, onPickPrompt }: AgentWelcomeProps) => (
  <div className="relative flex flex-col items-center px-4 py-12 text-center">
    {/* 签名元素：一页淡淡的 A4，象征产出物就是纸面简历 */}
    <div
      aria-hidden
      className="pointer-events-none absolute top-4 aspect-[210/297] w-28 -rotate-6 rounded-sm border border-border/70 bg-card shadow-[0_14px_36px_-16px_rgba(89,49,24,0.32)]"
    >
      <div className="mx-auto mt-6 h-2.5 w-16 rounded-sm bg-primary/15" />
      <div className="mx-auto mt-4 space-y-2">
        <div className="mx-auto h-1.5 w-20 rounded-full bg-muted/60" />
        <div className="mx-auto h-1.5 w-24 rounded-full bg-muted/50" />
        <div className="mx-auto h-1.5 w-20 rounded-full bg-muted/60" />
        <div className="mx-auto h-1.5 w-14 rounded-full bg-muted/50" />
      </div>
    </div>

    <p className="relative text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/70">
      {t("welcome.eyebrow")}
    </p>
    <h2 className="relative mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
      {t("welcome.title")}
    </h2>
    <p className="relative mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
      {t("welcome.subtitle")}
    </p>

    <div className="relative mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
      {CARD_KEYS.map((key) => {
        const Icon = CARD_ICONS[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onPickPrompt(t(`welcome.card.${key}.prompt`))}
            className="group flex flex-col rounded-2xl border bg-card p-4 text-left transition motion-safe:hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_10px_28px_-14px_rgba(89,49,24,0.28)]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
              <Icon aria-hidden className="h-5 w-5 text-primary" />
            </span>
            <strong className="mt-3 text-sm">{t(`welcome.card.${key}.title`)}</strong>
            <span className="mt-1 text-xs leading-5 text-muted-foreground">
              {t(`welcome.card.${key}.description`)}
            </span>
            <ArrowRight
              aria-hidden
              className="mt-3 h-4 w-4 text-primary transition-transform group-hover:translate-x-1"
            />
          </button>
        );
      })}
    </div>
  </div>
);
