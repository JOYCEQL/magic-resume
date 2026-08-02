import { useMemo, useRef, useState } from "react";
import { Loader2, Maximize2, Minus, Plus, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ResumeTemplateComponent from "@/components/templates";
import { DEFAULT_TEMPLATES } from "@/components/templates/registry";
import { useTemplateSnapshots } from "@/hooks/useTemplateSnapshots";
import type { Translator } from "@/i18n/compat/utils";
import { cn } from "@/lib/utils";
import type { ResumeDraft } from "@/types/resume-agent";
import { createResumeFromAgentDraft } from "@/utils/resumeAgent";
import { AgentTemplateRail } from "./AgentTemplateRail";

/** A4 在 96dpi 下的像素尺寸（宽度与按比例换算的高度） */
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = Math.round((A4_WIDTH_PX * 297) / 210);
const ZOOM_STEPS = [50, 62, 75, 87, 100, 125] as const;

interface AgentResumePreviewProps {
  t: Translator;
  draft: ResumeDraft;
  templateId: string;
  /** 运行中视为未同步，且不渲染半成品草稿 */
  isRunning: boolean;
  /** 模板栏切换 */
  onTemplateChange: (id: string) => void;
}

/**
 * A4 预览。与工作台渲染链一致：ResumeDraft → createResumeFromAgentDraft →
 * #resume-preview（含 pagePadding，重置标题字体为模板自带）→ ResumeTemplateComponent。
 * 缩放用 CSS zoom（真实缩放布局尺寸，滚动区覆盖全部视觉内容），
 * 而不是 transform: scale（不改变布局、需要手动测量，绝对定位溢出会漏出滚动区）。
 */
export const AgentResumePreview = ({
  t,
  draft,
  templateId,
  isRunning,
  onTemplateChange,
}: AgentResumePreviewProps) => {
  const [zoomIndex, setZoomIndex] = useState(2);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { snapshotMap } = useTemplateSnapshots(draft.language);

  const template = useMemo(
    () => DEFAULT_TEMPLATES.find((item) => item.id === templateId) ?? DEFAULT_TEMPLATES[0],
    [templateId]
  );
  const resume = useMemo(
    () => createResumeFromAgentDraft(draft, templateId),
    [draft, templateId]
  );

  const zoom = ZOOM_STEPS[zoomIndex];
  const hasContent = Boolean(draft.basic.name || draft.summary || draft.experience.length);
  // 预览门禁：真正在跑时不渲染半成品草稿；等待/完成/失败但已有草稿时都可预览
  const showPaper = !isRunning && hasContent;

  /** 按画布容器（= 面板宽度）选出刚好铺满的缩放档 */
  const fitToWidth = () => {
    const width = canvasRef.current?.clientWidth;
    if (!width) return;
    // p-4 左右各 16px 内边距，A4 实际可用宽度比容器窄 32px
    const target = ((width - 32) / A4_WIDTH_PX) * 100;
    let best = 0;
    ZOOM_STEPS.forEach((step, index) => {
      if (step <= target) best = index;
    });
    setZoomIndex(best);
  };

  return (
    // resume-agent-preview：作用域类，globals.css 用它把模板根节点的 min-h-screen 压回 A4 高度
    <div className="resume-agent-preview flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {t("preview.breadcrumb")}
          {draft.basic.name && (
            <>
              <span className="mx-1.5">/</span>
              <span className="text-foreground">
                {draft.basic.name}
                {(draft.basic.title || draft.targetJob.title) &&
                  ` – ${draft.basic.title || draft.targetJob.title}`}
              </span>
            </>
          )}
        </span>
        <div className="flex shrink-0 items-center gap-1 rounded-lg border bg-background px-1 py-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
            disabled={zoomIndex === 0}
            aria-label={t("preview.zoomOut")}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-11 text-center font-mono text-[11px] tabular-nums">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setZoomIndex((index) => Math.min(ZOOM_STEPS.length - 1, index + 1))}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            aria-label={t("preview.zoomIn")}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <div className="mx-0.5 h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={fitToWidth}
            aria-label={t("preview.fitWidth")}
            title={t("preview.fitWidth")}
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 画布（左）+ 模板栏（右缘，可折叠） */}
      <div className="flex min-h-0 flex-1">
        <div ref={canvasRef} className="min-h-0 flex-1 overflow-auto bg-muted/30 p-4">
          {isRunning ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t("preview.generating")}</p>
            </div>
          ) : showPaper ? (
            <div className="mx-auto w-fit">
              {/* zoom 真实缩放布局：滚动区自动覆盖全部视觉内容，不再需要手动测量 */}
              <div
                className="bg-white shadow-sm ring-1 ring-border"
                style={{ width: A4_WIDTH_PX, minHeight: A4_HEIGHT_PX, zoom: zoom / 100 }}
              >
                {/* 与工作台一致：pagePadding 提供页边距，#resume-preview 让标题字体回归模板自带 */}
                <div
                  id="resume-preview"
                  className="relative"
                  style={{ padding: `${resume.globalSettings?.pagePadding ?? 48}px` }}
                >
                  <ResumeTemplateComponent data={resume} template={template} />
                </div>
              </div>
            </div>
          ) : (
            // 签名元素：空状态就是一张待排版的空白纸——衬线姓名占位 + 印刷线骨架
            <div className="mx-auto flex h-full w-full max-w-[420px] flex-col items-center justify-center">
              <div className="w-full rounded-sm border border-border bg-white px-10 py-12 shadow-[0_18px_52px_-22px_rgba(89,49,24,0.22)]">
                <div className="text-center">
                  <div className="mx-auto h-3 w-32 rounded-sm bg-primary/15" />
                  <p className="mt-3 font-serif text-lg tracking-tight text-muted-foreground/50">
                    {t("preview.emptyName")}
                  </p>
                </div>
                <div className="mt-9 space-y-5">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="space-y-2">
                      <div className="h-2 w-16 rounded-sm bg-primary/10" />
                      <div className="h-1.5 w-full rounded-full bg-muted/40" />
                      <div className="h-1.5 w-4/5 rounded-full bg-muted/30" />
                      <div className="h-1.5 w-3/5 rounded-full bg-muted/30" />
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-5 max-w-xs text-center text-xs leading-5 text-muted-foreground">
                {t("preview.empty")}
              </p>
            </div>
          )}
        </div>

        <AgentTemplateRail
          t={t}
          templates={DEFAULT_TEMPLATES}
          snapshots={snapshotMap}
          activeId={templateId}
          onSelect={onTemplateChange}
        />
      </div>

      <div className="flex shrink-0 items-center justify-between border-t px-4 py-2 text-[11px] text-muted-foreground">
        <span className="font-mono tabular-nums">{zoom}%</span>
        <span>{t("preview.paperSize")}</span>
        <Badge
          variant="outline"
          className={cn(
            "h-5 gap-1 px-1.5 font-normal",
            !isRunning && "text-emerald-700 dark:text-emerald-500"
          )}
        >
          {isRunning ? (
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
          ) : (
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          )}
          {isRunning ? t("preview.syncing") : t("preview.synced")}
        </Badge>
      </div>
    </div>
  );
};
