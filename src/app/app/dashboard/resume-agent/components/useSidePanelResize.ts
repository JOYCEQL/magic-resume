import { useCallback, useEffect, useRef } from "react";
import {
  clampSidePanelWidth,
  SIDE_PANEL_KEYBOARD_STEP,
  SIDE_PANEL_MAX_WIDTH,
  SIDE_PANEL_MIN_WIDTH,
  useResumeAgentLayoutStore,
} from "@/store/useResumeAgentLayoutStore";

/**
 * 面板必须给中间对话区留出的最小宽度。
 * 含 dashboard 侧边栏（展开 16rem / 收起 4rem）、页面 sm:px-6 内边距、
 * flex 行 gap 与拖拽把手，取一个覆盖两种侧边栏状态的保守值。
 */
const MIN_CHAT_COLUMN_WIDTH = 620;

/** 当前视口下允许的最大面板宽度：不能把对话区挤没 */
const maxAllowedWidth = () =>
  Math.max(
    SIDE_PANEL_MIN_WIDTH,
    Math.min(SIDE_PANEL_MAX_WIDTH, window.innerWidth - MIN_CHAT_COLUMN_WIDTH)
  );

/**
 * 右侧面板拖拽调宽。
 * 用 Pointer Events 而非 components/ui/resizable：那是百分比 PanelGroup，
 * 无法表达「像素 min/max + 收起后固定 rail 宽度」这种单侧栏形态。
 * 拖拽期间宽度写入 store（isResizing=true 时组件关闭动画），松手后由 persist 落 localStorage。
 *
 * 坐标按增量计算：面板不贴视口右缘（页面 mx-auto max-w-[1600px] + 左侧边栏），
 * 用 `window.innerWidth - clientX` 会恒定高估宽度，越宽的屏幕偏差越大。
 */
export const useSidePanelResize = () => {
  const setSidePanelWidth = useResumeAgentLayoutStore((state) => state.setSidePanelWidth);
  const resetSidePanelWidth = useResumeAgentLayoutStore((state) => state.resetSidePanelWidth);
  const setResizing = useResumeAgentLayoutStore((state) => state.setResizing);
  const pointerIdRef = useRef<number>();
  /** 按下时的起始宽度与起始指针 X；移动时只加增量 */
  const startWidthRef = useRef(0);
  const startXRef = useRef(0);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      pointerIdRef.current = event.pointerId;
      startWidthRef.current = useResumeAgentLayoutStore.getState().sidePanelWidth;
      startXRef.current = event.clientX;
      event.currentTarget.setPointerCapture(event.pointerId);
      setResizing(true);
      document.body.style.cursor = "col-resize";
      // 拖拽时禁选文本，否则会把右侧草稿整段选蓝
      document.body.style.userSelect = "none";
    },
    [setResizing]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      const delta = startXRef.current - event.clientX;
      setSidePanelWidth(clampSidePanelWidth(startWidthRef.current + delta, maxAllowedWidth()));
    },
    [setSidePanelWidth]
  );

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current !== event.pointerId) return;
      pointerIdRef.current = undefined;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      setResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    },
    [setResizing]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const current = useResumeAgentLayoutStore.getState().sidePanelWidth;
        setSidePanelWidth(
          clampSidePanelWidth(current + SIDE_PANEL_KEYBOARD_STEP, maxAllowedWidth())
        );
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        const current = useResumeAgentLayoutStore.getState().sidePanelWidth;
        setSidePanelWidth(clampSidePanelWidth(current - SIDE_PANEL_KEYBOARD_STEP));
        return;
      }
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        setSidePanelWidth(event.key === "Home" ? maxAllowedWidth() : SIDE_PANEL_MIN_WIDTH);
      }
    },
    [setSidePanelWidth]
  );

  // 视口变化时，持久化的宽度可能已超过新视口允许的上限（如从大屏切到小窗），回钳。
  // 只在真实超过时写入，避免每次 resize 都触发一次持久化。
  // 挂载时也跑一次：换屏后旧宽度可能已超限，不能等到下一次 resize 才修。
  useEffect(() => {
    const clampToViewport = () => {
      const current = useResumeAgentLayoutStore.getState().sidePanelWidth;
      const max = maxAllowedWidth();
      if (current > max) setSidePanelWidth(max);
    };
    clampToViewport();
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [setSidePanelWidth]);

  // 卸载时若仍在拖拽，恢复 body 样式，避免整站光标卡在 col-resize
  useEffect(
    () => () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    },
    []
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    onKeyDown,
    onDoubleClick: resetSidePanelWidth,
  };
};
