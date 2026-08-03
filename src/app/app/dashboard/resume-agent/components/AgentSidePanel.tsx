import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  ScrollText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Translator } from "@/i18n/compat/utils";
import {
  SIDE_PANEL_MAX_WIDTH,
  SIDE_PANEL_MIN_WIDTH,
  SIDE_PANEL_RAIL_WIDTH,
  useResumeAgentLayoutStore,
} from "@/store/useResumeAgentLayoutStore";
import type {
  ResumeAgentValidationResult,
  ResumeDraft,
} from "@/types/resume-agent";
import type { AgentSidePanelTab } from "@/types/resume-agent-ui";
import { AgentDraftPanel } from "./AgentDraftPanel";
import { AgentQuickToolsPanel } from "./AgentQuickToolsPanel";
import { AgentResumePreview } from "./AgentResumePreview";
import { AgentTracePanel } from "./AgentTracePanel";
import { useSidePanelResize } from "./useSidePanelResize";

/**
 * 左右分栏的断点比全局 768 高：768–1024 之间对话区会被右侧固定宽面板挤扁，
 * 所以堆叠断点提到 lg（1024）。全局 use-mobile 给侧边栏用，这里独立判断。
 */
const SPLIT_BREAKPOINT_PX = 1024;

const useSplitLayout = () => {
  const [split, setSplit] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= SPLIT_BREAKPOINT_PX
  );
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${SPLIT_BREAKPOINT_PX}px)`);
    const onChange = () => setSplit(mql.matches);
    mql.addEventListener("change", onChange);
    setSplit(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return split;
};

const TAB_ORDER: AgentSidePanelTab[] = ["draft", "preview", "trace"];
const TAB_ICONS: Record<AgentSidePanelTab, typeof FileText> = {
  draft: FileText,
  preview: Eye,
  trace: ScrollText,
};

interface AgentSidePanelProps {
  t: Translator;
  draft: ResumeDraft;
  validation: ResumeAgentValidationResult;
  isRunning: boolean;
  /** 实时预览用的模板 id，与保存时选择的模板保持一致 */
  templateId: string;
  /** 模板栏切换 */
  onTemplateChange: (id: string) => void;
  /** 打开模板选择弹窗 */
  onApprove: () => void;
  onPrefillPrompt: (prompt: string) => void;
  onReset: () => void;
}

export const AgentSidePanel = ({
  t,
  draft,
  validation,
  isRunning,
  templateId,
  onTemplateChange,
  onApprove,
  onPrefillPrompt,
  onReset,
}: AgentSidePanelProps) => {
  const split = useSplitLayout();
  const width = useResumeAgentLayoutStore((state) => state.sidePanelWidth);
  const collapsed = useResumeAgentLayoutStore((state) => state.sidePanelCollapsed);
  const isResizing = useResumeAgentLayoutStore((state) => state.isResizing);
  const activeTab = useResumeAgentLayoutStore((state) => state.activeTab);
  const setActiveTab = useResumeAgentLayoutStore((state) => state.setActiveTab);
  const toggleSidePanel = useResumeAgentLayoutStore((state) => state.toggleSidePanel);
  const resize = useSidePanelResize();

  // 拖拽中必须关动画，否则 spring 会追着指针滞后
  const transition = isResizing ? { duration: 0 } : { type: "spring" as const, stiffness: 320, damping: 32 };

  const validationBadge = validation.errorCount
    ? { variant: "destructive" as const, text: t("validation.errors", { count: validation.errorCount }) }
    : validation.warningCount
      ? { variant: "secondary" as const, text: t("validation.warnings", { count: validation.warningCount }) }
      : { variant: "outline" as const, text: t("validation.ready") };

  /** 面板宽度不足时隐藏 Tab 文字，避免头部在默认宽度下就溢出裁切 */
  const showTabLabels = !split || width >= 640;

  const railContent = (
    <div className="flex h-full items-center gap-2 p-2 max-lg:justify-center lg:flex-col lg:py-3">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={toggleSidePanel}
        aria-label={t("panel.expand")}
        title={t("panel.expand")}
      >
        <PanelRightOpen className="h-4 w-4" />
      </Button>
      <div className="h-5 w-px bg-border lg:h-px lg:w-5" />
      {TAB_ORDER.map((tab) => {
        const Icon = TAB_ICONS[tab];
        return (
          <Button
            key={tab}
            variant={activeTab === tab ? "secondary" : "ghost"}
            size="icon"
            className="relative h-8 w-8"
            onClick={() => setActiveTab(tab)}
            aria-label={t(`panel.tab.${tab}`)}
            title={t(`panel.tab.${tab}`)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
      {validation.errorCount > 0 && (
        <span
          aria-hidden
          title={validationBadge.text}
          className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive max-lg:mt-0"
        />
      )}
    </div>
  );

  const panelContent = (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as AgentSidePanelTab)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5">
        <TabsList className="h-8 shrink-0">
          {TAB_ORDER.map((tab) => {
            const Icon = TAB_ICONS[tab];
            return (
              <TabsTrigger key={tab} value={tab} className="h-6 gap-1.5 px-2 text-xs">
                <Icon className="h-3.5 w-3.5" />
                {showTabLabels && <span>{t(`panel.tab.${tab}`)}</span>}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {width >= 560 && (
            <Badge
              variant={validationBadge.variant}
              className="hidden sm:inline-flex"
              title={t("validation.errorsHint")}
            >
              {validationBadge.text}
            </Badge>
          )}
          <Button size="sm" onClick={onApprove} disabled={!validation.canSave || !draft.basic.name}>
            {t("approve")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidePanel}
            aria-label={t("panel.collapse")}
            title={t("panel.collapse")}
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 面板填满视口高度，Tab 内容在内部滚动 */}
      <TabsContent value="draft" className="mt-0 min-h-0 flex-1 overflow-y-auto">
        <AgentDraftPanel t={t} draft={draft} validation={validation} />
        {/* 快捷工具（技能云 / 关键词 / 提示词）收进草稿页底部 */}
        <AgentQuickToolsPanel t={t} draft={draft} onPrefillPrompt={onPrefillPrompt} />
      </TabsContent>
      {/* preview 需要内部 flex 布局（工具条 + 画布 + 状态条），lg 下用绝对定位撑满 Tab */}
      <TabsContent
        value="preview"
        className={split ? "relative mt-0 min-h-0 flex-1" : "mt-0"}
      >
        <div className={split ? "absolute inset-0" : ""}>
          <AgentResumePreview
            t={t}
            draft={draft}
            templateId={templateId}
            isRunning={isRunning}
            onTemplateChange={onTemplateChange}
          />
        </div>
      </TabsContent>
      <TabsContent value="trace" className="mt-0 min-h-0 flex-1 overflow-y-auto">
        <AgentTracePanel t={t} isRunning={isRunning} />
      </TabsContent>
    </Tabs>
  );

  return (
    // lg 以下堆叠为上下布局，占满宽度；lg 起为右侧固定像素宽侧栏。
    // 页面已是固定视口高度，面板随行 stretch 等高，内部 Tab 滚动。
    <div className="flex min-w-0 max-lg:w-full lg:shrink-0">
      {/* 拖拽把手：贴在面板左缘；收起态与堆叠布局不显示 */}
      {split && !collapsed && (
        <div
          {...resize}
          role="separator"
          aria-orientation="vertical"
          aria-label={t("panel.resizeHandle")}
          aria-valuemin={SIDE_PANEL_MIN_WIDTH}
          aria-valuemax={SIDE_PANEL_MAX_WIDTH}
          aria-valuenow={width}
          tabIndex={0}
          className="group relative -mr-1 flex w-3 shrink-0 cursor-col-resize touch-none items-center justify-center focus-visible:outline-none"
        >
          <span className="h-10 w-1 rounded-full bg-border transition-colors group-hover:bg-primary/60 group-focus-visible:bg-primary" />
        </div>
      )}

      {/* 收起/展开是同一条 motion.aside 的宽度动画，而不是把整个面板卸载重挂。
          面板内容与窄边条按状态交叉切换，宽度由 spring 过渡。 */}
      <motion.aside
        animate={split ? { width: collapsed ? SIDE_PANEL_RAIL_WIDTH : width } : { width: "100%" }}
        initial={false}
        transition={transition}
        className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm lg:shrink-0"
      >
        {collapsed ? railContent : panelContent}
      </motion.aside>
    </div>
  );
};
