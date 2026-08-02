import { AtSign, Brain, Clock3, Loader2, Paperclip, RotateCcw, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AIModelType } from "@/config/ai";
import type { Translator } from "@/i18n/compat/utils";
import { cn } from "@/lib/utils";

interface ProviderOption {
  id: AIModelType;
  label: string;
}

interface AgentComposerProps {
  t: Translator;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onRetry: () => void;
  isRunning: boolean;
  /** 失败/超时/取消且输入框为空时，主按钮变「重试」 */
  canRetry: boolean;
  provider: AIModelType;
  providers: ProviderOption[];
  onProviderChange: (provider: AIModelType) => void;
  providerReady: boolean;
  onOpenProviderSettings: () => void;
  timeoutSeconds: number;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  /** 思考过程开关：与模型选择器并排，发送前即可切换（本轮生效） */
  showReasoning: boolean;
  onToggleReasoning: () => void;
  /** 输入框上方插槽，用于渲染缺口提醒条 */
  children?: React.ReactNode;
}

/**
 * 悬浮式圆角输入 Dock。
 * 附件与 @ 提及按钮为 disabled 占位：项目暂无附件上传与实体引用能力，
 * 保留位置以对齐目标视觉，但点了不做事比静默失败更诚实。
 */
export const AgentComposer = ({
  t,
  value,
  onChange,
  onSubmit,
  onStop,
  onRetry,
  isRunning,
  canRetry,
  provider,
  providers,
  onProviderChange,
  providerReady,
  onOpenProviderSettings,
  timeoutSeconds,
  inputRef,
  showReasoning,
  onToggleReasoning,
  children,
}: AgentComposerProps) => (
  <div className="px-4 pb-4 pt-2">
    <div className="mx-auto w-full max-w-3xl">
      {children}
      <div className="rounded-2xl border bg-card p-3 shadow-sm">
        <Textarea
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            // 中文输入法组字状态下按 Enter 是「确认候选词」，不是发送。
            // 不拦下来会把打到一半的拼音整条发出去。
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            onSubmit();
          }}
          placeholder={t("inputPlaceholder")}
          aria-label={t("composer.inputLabel")}
          className="min-h-[4.5rem] resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
        />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Select value={provider} onValueChange={(next) => onProviderChange(next as AIModelType)}>
            <SelectTrigger
              className="h-8 w-auto min-w-[9rem] max-w-[15rem] rounded-lg text-xs"
              aria-label={t("composer.modelSelect")}
            >
              <SelectValue />
            </SelectTrigger>
            {/* SelectContent 渲染在 body 的 portal 里，脱离 .theme-agent-earth 作用域，
                需要把主题类直接加在内容上，否则下拉菜单用回全局配色 */}
            <SelectContent className="theme-agent-earth">
              {providers.map((item) => (
                <SelectItem key={item.id} value={item.id} className="text-xs">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 思考过程开关：放在发送前就能看到的位置，本轮运行即生效 */}
          <Button
            variant={showReasoning ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "h-8 gap-1.5 rounded-lg px-2 text-xs",
              showReasoning ? "text-primary" : "text-muted-foreground"
            )}
            onClick={onToggleReasoning}
            aria-pressed={showReasoning}
            title={t("trace.reasoningHint")}
          >
            <Brain className="h-3.5 w-3.5" />
            {showReasoning ? t("trace.reasoningOn") : t("trace.reasoningOff")}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground"
            disabled
            title={t("composer.attachUnavailable")}
            aria-label={t("composer.attachUnavailable")}
          >
            <Paperclip className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground"
            disabled
            title={t("composer.mentionUnavailable")}
            aria-label={t("composer.mentionUnavailable")}
          >
            <AtSign className="h-3.5 w-3.5" />
          </Button>

          <div className="ml-auto flex items-center gap-2">
            {isRunning ? (
              <Button variant="destructive" size="sm" className="rounded-xl" onClick={onStop}>
                <Square className="mr-1.5 h-3.5 w-3.5" />
                {t("stop")}
              </Button>
            ) : canRetry ? (
              <Button size="sm" className="rounded-xl" onClick={onRetry}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                {t("retry")}
              </Button>
            ) : (
              <Button
                size="sm"
                className="rounded-xl px-4"
                onClick={onSubmit}
                disabled={!value.trim()}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {t("send")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {isRunning && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <Clock3 className="h-3 w-3" />
          {t("timeoutHint", { seconds: timeoutSeconds })}
        </p>
      )}
      {!providerReady && (
        <button
          type="button"
          onClick={onOpenProviderSettings}
          className="mt-2 text-xs text-destructive underline-offset-4 hover:underline"
        >
          {t("providerNotReady")}
        </button>
      )}
    </div>
  </div>
);
