import { useLayoutEffect, useState, type RefObject } from "react";
import {
  createResumeMeasurement,
  measureResumeLayout,
  RESUME_CONTENT_SELECTOR,
  type ResumeLayout,
} from "@/utils/resumeLayout";

interface UseAutoOnePageOptions {
  contentRef: RefObject<HTMLDivElement>;
  content: unknown;
  pagePadding: number;
  enabled: boolean;
}

export function useAutoOnePage({
  contentRef,
  content,
  pagePadding,
  enabled,
}: UseAutoOnePageOptions): ResumeLayout {
  const [layout, setLayout] = useState<ResumeLayout>({
    contentHeight: 0,
    scaleFactor: 1,
    pageCount: 1,
    cannotFit: false,
  });

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    let measurement = createResumeMeasurement(element);
    let measuredContent = measurement.querySelector<HTMLElement>(RESUME_CONTENT_SELECTOR)!;
    const displayedContent = element.querySelector<HTMLElement>(RESUME_CONTENT_SELECTOR)!;
    let needsClone = false;

    let frameId: number | undefined;
    const measure = () => {
      frameId = undefined;
      if (needsClone) {
        observer.unobserve(measuredContent);
        measurement.remove();
        measurement = createResumeMeasurement(element);
        measuredContent = measurement.querySelector<HTMLElement>(RESUME_CONTENT_SELECTOR)!;
        observer.observe(measuredContent, { box: "border-box" });
        needsClone = false;
      }
      const next = measureResumeLayout(measuredContent, pagePadding, enabled);
      setLayout((previous) =>
        previous.contentHeight === next.contentHeight &&
        previous.scaleFactor === next.scaleFactor &&
        previous.cannotFit === next.cannotFit &&
        previous.pageCount === next.pageCount ? previous : next,
      );
    };
    let disposed = false;
    const scheduleMeasure = () => {
      if (!disposed && frameId === undefined) frameId = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(scheduleMeasure);
    // AnimatePresence may remove exiting children after the React data update.
    // Observe only content, excluding our own page indicators and zoom attribute.
    const mutations = new MutationObserver(() => {
      needsClone = true;
      scheduleMeasure();
    });
    mutations.observe(displayedContent, { childList: true, subtree: true, characterData: true });
    document.fonts.addEventListener("loadingdone", scheduleMeasure);
    void document.fonts.ready.then(scheduleMeasure);
    observer.observe(measuredContent, { box: "border-box" });
    measure();

    return () => {
      disposed = true;
      document.fonts.removeEventListener("loadingdone", scheduleMeasure);
      observer.disconnect();
      mutations.disconnect();
      if (frameId !== undefined) cancelAnimationFrame(frameId);
      measurement.remove();
    };
  }, [contentRef, content, pagePadding, enabled]);

  return layout;
}
