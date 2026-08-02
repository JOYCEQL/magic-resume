import { ClipboardCopy, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Translator } from "@/i18n/compat/utils";
import type { ResumeDraft } from "@/types/resume-agent";

const PROMPT_KEYS = ["addMetrics", "tightenSummary", "alignKeywords", "askMissing"] as const;

interface AgentQuickToolsPanelProps {
  t: Translator;
  draft: ResumeDraft;
  /** 把提示词填进输入框，不自动发送，保持用户可编辑 */
  onPrefillPrompt: (prompt: string) => void;
}

/**
 * 草稿 Tab 底部的快捷工具：专业技能 Tag 云 + 快捷提示词 + 岗位关键词/缺口。
 * 澄清问题卡片已移入对话流，不再由这里承载。
 */
export const AgentQuickToolsPanel = ({ t, draft, onPrefillPrompt }: AgentQuickToolsPanelProps) => {
  const gaps = draft.targetJob.missingSkills.filter(Boolean);
  const keywords = draft.targetJob.matchedKeywords.filter(Boolean);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("tools.copied"));
    } catch {
      toast.error(t("tools.copyFailed"));
    }
  };

  return (
    <div className="space-y-4 border-t p-5">
      {/* 专业技能 Tag 云：草稿已确认的技能，与下方 JD 关键词/缺口分开 */}
      {draft.skills.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("draft.skills")}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {draft.skills.map((skill, index) => (
              <Badge key={`${skill}-${index}`} variant="outline" className="font-normal">
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Wrench className="h-3.5 w-3.5" />
          {t("tools.prompts")}
        </h3>
        <div className="grid gap-2">
          {PROMPT_KEYS.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="h-auto justify-start whitespace-normal py-2 text-left text-xs font-normal leading-5"
              onClick={() => onPrefillPrompt(t(`tools.prompt.${key}`))}
            >
              {t(`tools.promptLabel.${key}`)}
            </Button>
          ))}
        </div>
      </section>

      {(keywords.length > 0 || gaps.length > 0) && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("tools.keywords")}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {keywords.slice(0, 20).map((keyword, index) => (
              <Badge key={`matched-${keyword}-${index}`} variant="outline" className="font-normal">
                {keyword}
              </Badge>
            ))}
            {gaps.slice(0, 20).map((gap, index) => (
              <Badge key={`gap-${gap}-${index}`} variant="secondary" className="font-normal">
                {gap}
              </Badge>
            ))}
          </div>
          {keywords.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-[11px] text-muted-foreground"
              onClick={() => void copy(keywords.join(", "))}
            >
              <ClipboardCopy className="h-3 w-3" />
              {t("tools.copyKeywords")}
            </Button>
          )}
        </section>
      )}
    </div>
  );
};
