import { useLayoutEffect, useState, type RefObject } from "react";
import { A4_HEIGHT_PX, RESUME_CONTENT_SELECTOR } from "@/utils/resumeLayout";

const MIN_SCALE = 0.9;

interface UseAutoOnePageOptions {
  contentRef: RefObject<HTMLDivElement>;
  content: unknown;
  pagePadding: number;
  enabled: boolean;
}

interface UseAutoOnePageResult {
  contentHeight: number;
  scaleFactor: number;
  isScaled: boolean;
  cannotFit: boolean;
}

export function useAutoOnePage({
  contentRef,
  content,
  pagePadding,
  enabled,
}: UseAutoOnePageOptions): UseAutoOnePageResult {
  const [layout, setLayout] = useState<UseAutoOnePageResult>({
    contentHeight: 0,
    scaleFactor: 1,
    isScaled: false,
    cannotFit: false,
  });

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    // 独立副本始终按原始宽度测量，不观察显示层的缩放或宽度变化。
    const measurement = element.cloneNode(true) as HTMLDivElement;
    measurement.removeAttribute("id");
    measurement.setAttribute("data-resume-measurement", "");
    measurement.setAttribute("aria-hidden", "true");
    measurement.inert = true;
    Object.assign(measurement.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: getComputedStyle(element).width,
      visibility: "hidden",
      pointerEvents: "none",
    });
    measurement.querySelectorAll(".page-break-line").forEach((line) => line.remove());
    const measuredContent = measurement.querySelector<HTMLElement>(RESUME_CONTENT_SELECTOR)!;
    measuredContent.style.zoom = "1";
    document.body.appendChild(measurement);

    let frameId: number | undefined;
    const measure = () => {
      frameId = undefined;
      const availableHeight = A4_HEIGHT_PX - 2 * pagePadding;
      const naturalHeight = parseFloat(getComputedStyle(measuredContent).height);
      const scaleFactor = enabled && naturalHeight > availableHeight
        ? Math.max(MIN_SCALE, availableHeight / naturalHeight)
        : 1;

      // 比例只由原始高度决定；最终高度仅用于分页和溢出提示，不反推比例。
      let renderedHeight: number;
      try {
        measuredContent.style.zoom = String(scaleFactor);
        renderedHeight = parseFloat(getComputedStyle(measuredContent).height) * scaleFactor;
      } finally {
        measuredContent.style.zoom = "1";
      }
      const next = {
        contentHeight: renderedHeight + 2 * pagePadding,
        scaleFactor,
        isScaled: scaleFactor < 1,
        cannotFit: enabled && renderedHeight > availableHeight + 0.5,
      };
      setLayout((previous) =>
        previous.contentHeight === next.contentHeight &&
        previous.scaleFactor === next.scaleFactor &&
        previous.cannotFit === next.cannotFit ? previous : next,
      );
    };
    const observer = new ResizeObserver(() => {
      if (frameId === undefined) frameId = requestAnimationFrame(measure);
    });
    observer.observe(measuredContent, { box: "border-box" });
    measure();

    return () => {
      observer.disconnect();
      if (frameId !== undefined) cancelAnimationFrame(frameId);
      measurement.remove();
    };
  }, [contentRef, content, pagePadding, enabled]);

  return layout;
}
