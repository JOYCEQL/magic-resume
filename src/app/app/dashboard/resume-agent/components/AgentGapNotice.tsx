import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Translator } from "@/i18n/compat/utils";

interface AgentGapNoticeProps {
  t: Translator;
  /** 待补充题数；为 0 时不渲染 */
  count: number;
  /** 滚动到对话流里的澄清问题卡片 */
  onOpenQuestions: () => void;
  onDismiss: () => void;
}

/**
 * 悬浮输入框上方的轻量提醒条。
 * 澄清问题卡片就在对话流底部，点这里滚动到它。
 */
export const AgentGapNotice = ({ t, count, onOpenQuestions, onDismiss }: AgentGapNoticeProps) => {
  if (count <= 0) return null;

  return (
    <div className="mb-2 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2">
      <AlertTriangle aria-hidden className="h-3.5 w-3.5 shrink-0 text-amber-600" />
      <button
        type="button"
        onClick={onOpenQuestions}
        className="min-w-0 flex-1 truncate text-left text-xs text-amber-800 underline-offset-4 hover:underline dark:text-amber-500"
      >
        {t("gapNotice.summary", { count })}
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0 text-muted-foreground"
        onClick={onDismiss}
        aria-label={t("gapNotice.dismiss")}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};
