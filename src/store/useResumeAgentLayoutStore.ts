import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgentSidePanelTab } from "@/types/resume-agent-ui";

export const SIDE_PANEL_MIN_WIDTH = 360;
/** A4 在 100% 缩放下是 794px；预览 Tab 需要能拖到这个宽度以上才有意义 */
export const SIDE_PANEL_MAX_WIDTH = 1000;
export const SIDE_PANEL_DEFAULT_WIDTH = 520;
export const SIDE_PANEL_RAIL_WIDTH = 44;
export const SIDE_PANEL_KEYBOARD_STEP = 16;

export const clampSidePanelWidth = (width: number, max = SIDE_PANEL_MAX_WIDTH) =>
  Math.min(max, Math.max(SIDE_PANEL_MIN_WIDTH, Math.round(width)));

interface ResumeAgentLayoutState {
  sidePanelWidth: number;
  sidePanelCollapsed: boolean;
  activeTab: AgentSidePanelTab;
  /** 左侧对话内的执行步骤区是否整体折叠 */
  traceBlockCollapsed: boolean;
  /** 自动展开最新步骤、自动折叠已完成的旧步骤 */
  autoFollowLatestStep: boolean;
  /** 拖拽中标记，不持久化：拖拽时需要关闭宽度动画 */
  isResizing: boolean;
  setSidePanelWidth: (width: number) => void;
  nudgeSidePanelWidth: (delta: number) => void;
  resetSidePanelWidth: () => void;
  setSidePanelCollapsed: (collapsed: boolean) => void;
  toggleSidePanel: () => void;
  setActiveTab: (tab: AgentSidePanelTab) => void;
  setTraceBlockCollapsed: (collapsed: boolean) => void;
  toggleTraceBlock: () => void;
  setAutoFollowLatestStep: (enabled: boolean) => void;
  setResizing: (resizing: boolean) => void;
}

export const useResumeAgentLayoutStore = create<ResumeAgentLayoutState>()(
  persist(
    (set, get) => ({
      sidePanelWidth: SIDE_PANEL_DEFAULT_WIDTH,
      sidePanelCollapsed: false,
      activeTab: "draft",
      traceBlockCollapsed: false,
      autoFollowLatestStep: true,
      isResizing: false,
      setSidePanelWidth: (width) => set({ sidePanelWidth: clampSidePanelWidth(width) }),
      nudgeSidePanelWidth: (delta) =>
        set({ sidePanelWidth: clampSidePanelWidth(get().sidePanelWidth + delta) }),
      resetSidePanelWidth: () => set({ sidePanelWidth: SIDE_PANEL_DEFAULT_WIDTH }),
      setSidePanelCollapsed: (collapsed) => set({ sidePanelCollapsed: collapsed }),
      toggleSidePanel: () => set({ sidePanelCollapsed: !get().sidePanelCollapsed }),
      // 切 Tab 时顺带展开，避免收起状态下点 Tab 没有任何反馈
      setActiveTab: (tab) => set({ activeTab: tab, sidePanelCollapsed: false }),
      setTraceBlockCollapsed: (collapsed) => set({ traceBlockCollapsed: collapsed }),
      toggleTraceBlock: () => set({ traceBlockCollapsed: !get().traceBlockCollapsed }),
      setAutoFollowLatestStep: (enabled) => set({ autoFollowLatestStep: enabled }),
      setResizing: (resizing) => set({ isResizing: resizing }),
    }),
    {
      // v3：Tab 枚举从 draft|preview|gaps|trace 精简为 draft|preview|trace
      //（澄清问题卡片移入对话流，「待办与缺口」Tab 移除）。
      // 换 key 让旧快照自然失效，避免 activeTab 落在已不存在的 "gaps" 上导致 Tabs 无选中项。
      name: "resume-agent-layout-v3",
      // 该路由（app/dashboard）是 ssr:false，只在客户端创建 store。
      // localStorage 是同步存储，persist 在 create 时就地 rehydrate，
      // 首帧即拿到持久化宽度，不需要 skipHydration + 手动 rehydrate 那套。
      partialize: (state) => ({
        sidePanelWidth: state.sidePanelWidth,
        sidePanelCollapsed: state.sidePanelCollapsed,
        activeTab: state.activeTab,
        traceBlockCollapsed: state.traceBlockCollapsed,
        autoFollowLatestStep: state.autoFollowLatestStep,
      }),
    }
  )
);

/**
 * 挂载后触发一次 rehydrate 并返回是否完成。
 * 未完成前把宽度动画时长设为 0，避免默认宽度“跳”到持久化宽度时多一次动画。
 */
export const useResumeAgentLayoutHydrated = () => {
  const [hydrated, setHydrated] = useState(() =>
    Boolean(useResumeAgentLayoutStore.persist.hasHydrated())
  );

  useEffect(() => {
    const unsubscribe = useResumeAgentLayoutStore.persist.onFinishHydration(() =>
      setHydrated(true)
    );
    void useResumeAgentLayoutStore.persist.rehydrate();
    return unsubscribe;
  }, []);

  return hydrated;
};
