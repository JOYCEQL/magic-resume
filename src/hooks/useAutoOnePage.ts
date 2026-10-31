import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  createResumeMeasurement,
  getPageContentHeight,
  measureResumeLayout,
  RESUME_CONTENT_SELECTOR,
  syncResumeMeasurement,
  type ResumeLayout,
} from "@/utils/resumeLayout";

interface UseAutoOnePageOptions {
  contentRef: RefObject<HTMLDivElement>;
  content?: unknown;
  pagePadding: number;
  enabled: boolean;
}

const INPUT_SETTLE_DELAY_MS = 180;
let lastUserInputAt = -Infinity;
let inputListenerAttached = false;

function ensureInputActivityListener() {
  if (inputListenerAttached || typeof window === "undefined") return;
  inputListenerAttached = true;
  const markInput = () => {
    lastUserInputAt = performance.now();
  };
  window.addEventListener("input", markInput, { capture: true, passive: true });
  window.addEventListener("compositionupdate", markInput, {
    capture: true,
    passive: true,
  });
}

export function useAutoOnePage({
  contentRef,
  pagePadding,
  enabled,
}: UseAutoOnePageOptions): ResumeLayout {
  const [layout, setLayout] = useState<ResumeLayout>({
    contentHeight: 0,
    scaleFactor: 1,
    pageCount: 1,
    cannotFit: false,
  });

  const optionsRef = useRef({ pagePadding, enabled });
  optionsRef.current = { pagePadding, enabled };

  const recalcRef = useRef<(() => void) | null>(null);
  const didMountRef = useRef(false);

  useLayoutEffect(() => {
    ensureInputActivityListener();
    const element = contentRef.current;
    if (!element) return;

    const measurement = createResumeMeasurement(element);
    let measuredContent = measurement.querySelector<HTMLElement>(
      RESUME_CONTENT_SELECTOR
    )!;
    const displayedContent = element.querySelector<HTMLElement>(
      RESUME_CONTENT_SELECTOR
    )!;
    let needsClone = false;
    let disposed = false;
    let frameId: number | undefined;
    let settleTimerId: number | undefined;

    const commitLayout = (next: ResumeLayout) => {
      setLayout((previous) =>
        previous.contentHeight === next.contentHeight &&
        previous.scaleFactor === next.scaleFactor &&
        previous.cannotFit === next.cannotFit &&
        previous.pageCount === next.pageCount
          ? previous
          : next
      );
    };

    const measure = () => {
      frameId = undefined;
      if (disposed) return;
      if (needsClone) {
        observer.unobserve(measuredContent);
        measuredContent = syncResumeMeasurement(element, measurement);
        observer.observe(measuredContent, { box: "border-box" });
        needsClone = false;
      } else {
        measurement.style.padding = element.style.padding;
        measurement.style.fontFamily = element.style.fontFamily;
      }
      const { pagePadding: currentPadding, enabled: currentEnabled } =
        optionsRef.current;
      const next = measureResumeLayout(
        measuredContent,
        currentPadding,
        currentEnabled
      );
      commitLayout(next);
    };

    const scheduleMeasure = () => {
      if (!disposed && frameId === undefined) {
        frameId = requestAnimationFrame(measure);
      }
    };

    const scheduleAfterInputOrFrame = () => {
      if (disposed) return;
      const elapsed = performance.now() - lastUserInputAt;
      if (elapsed < INPUT_SETTLE_DELAY_MS) {
        if (settleTimerId !== undefined) {
          window.clearTimeout(settleTimerId);
        }
        settleTimerId = window.setTimeout(() => {
          settleTimerId = undefined;
          scheduleMeasure();
        }, Math.max(16, INPUT_SETTLE_DELAY_MS - elapsed));
        return;
      }
      scheduleMeasure();
    };

    const observer = new ResizeObserver(() => {
      if (needsClone && performance.now() - lastUserInputAt < INPUT_SETTLE_DELAY_MS) {
        return;
      }
      scheduleMeasure();
    });

    const displayedResizeObserver = new ResizeObserver((entries) => {
      if (disposed) return;
      const isTyping =
        performance.now() - lastUserInputAt < INPUT_SETTLE_DELAY_MS;
      const { pagePadding: currentPadding, enabled: currentEnabled } =
        optionsRef.current;
      if (isTyping && !currentEnabled) {
        const entry = entries[0];
        const boxHeight =
          entry?.borderBoxSize?.[0]?.blockSize ?? entry?.contentRect?.height;
        if (typeof boxHeight === "number" && boxHeight > 0) {
          const availableHeight = getPageContentHeight(currentPadding);
          if (availableHeight > 0) {
            const pageCount = Math.max(
              1,
              Math.ceil(boxHeight / availableHeight)
            );
            commitLayout({
              contentHeight: boxHeight + 2 * currentPadding,
              scaleFactor: 1,
              pageCount,
              cannotFit: false,
            });
          }
        }
      }
    });

    // Observe only content, excluding our own page indicators and root zoom attribute.
    const mutations = new MutationObserver((records) => {
      const hasContentChange = records.some(
        (record) =>
          record.type !== "attributes" || record.target !== displayedContent
      );
      if (!hasContentChange) return;
      needsClone = true;
      scheduleAfterInputOrFrame();
    });
    mutations.observe(displayedContent, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });
    document.fonts.addEventListener("loadingdone", scheduleMeasure);
    void document.fonts.ready.then(scheduleMeasure);
    observer.observe(measuredContent, { box: "border-box" });
    displayedResizeObserver.observe(displayedContent, { box: "border-box" });

    recalcRef.current = () => {
      needsClone = true;
      if (settleTimerId !== undefined) {
        window.clearTimeout(settleTimerId);
        settleTimerId = undefined;
      }
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
        frameId = undefined;
      }
      measure();
    };

    measure();

    return () => {
      disposed = true;
      recalcRef.current = null;
      document.fonts.removeEventListener("loadingdone", scheduleMeasure);
      observer.disconnect();
      displayedResizeObserver.disconnect();
      mutations.disconnect();
      if (frameId !== undefined) cancelAnimationFrame(frameId);
      if (settleTimerId !== undefined) window.clearTimeout(settleTimerId);
      measurement.remove();
    };
  }, [contentRef]);

  useLayoutEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    recalcRef.current?.();
  }, [pagePadding, enabled]);

  return layout;
}
