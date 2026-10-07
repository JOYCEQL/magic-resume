export const A4_HEIGHT_PX = 297 * 96 / 25.4;
export const RESUME_CONTENT_SELECTOR = "[data-resume-content]";
export const MIN_RESUME_SCALE = 0.9;

// Chromium lays out in 1/64 CSS-pixel units. Round the usable page inward;
// never hide an overflow by granting the content extra page height.
export const getPageContentHeight = (pagePadding: number) =>
  Math.floor((A4_HEIGHT_PX - 2 * pagePadding) * 64) / 64;

export interface ResumeLayout {
  contentHeight: number;
  scaleFactor: number;
  pageCount: number;
  cannotFit: boolean;
}

export function createResumeMeasurement(element: HTMLElement): HTMLElement {
  const measurement = element.cloneNode(true) as HTMLElement;
  // Styling is scoped by data-resume-document, not this unique DOM id.
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
  const content = measurement.querySelector<HTMLElement>(RESUME_CONTENT_SELECTOR);
  if (!content) throw new Error("Resume layout content not found");
  content.style.zoom = "1";
  document.body.appendChild(measurement);
  return measurement;
}

/** Measure actual layout after zoom; CSS zoom can change wrapping and rounding. */
export function measureResumeLayout(
  content: HTMLElement,
  pagePadding: number,
  enabled: boolean,
): ResumeLayout {
  const availableHeight = getPageContentHeight(pagePadding);
  if (availableHeight <= 0) throw new Error("Resume page margins exceed the paper height");
  const heightAt = (scale: number) => {
    content.style.zoom = String(scale);
    return content.getBoundingClientRect().height;
  };

  try {
    const naturalHeight = heightAt(1);
    let scaleFactor = 1;
    let height = naturalHeight;
    if (enabled && naturalHeight > availableHeight) {
      scaleFactor = MIN_RESUME_SCALE;
      height = heightAt(scaleFactor);
      if (height <= availableHeight) {
        // Search only in this independent copy; never feed display measurements
        // back into React. Keep the largest verified fitting scale.
        let low = MIN_RESUME_SCALE;
        let high = 1;
        for (let i = 0; i < 12; i++) {
          const candidate = (low + high) / 2;
          const candidateHeight = heightAt(candidate);
          if (candidateHeight <= availableHeight) {
            low = candidate;
            height = candidateHeight;
          } else {
            high = candidate;
          }
        }
        scaleFactor = low;
      }
    }
    const pageCount = Math.max(1, Math.ceil(height / availableHeight));
    return {
      contentHeight: height + 2 * pagePadding,
      scaleFactor,
      pageCount,
      cannotFit: enabled && pageCount > 1,
    };
  } finally {
    content.style.zoom = "1";
  }
}

// 同一份规则用于预览、测量副本和导出，避免视口高度改变文档排版。
export const RESUME_LAYOUT_CSS = `
  [data-resume-document] .min-h-screen,
  [data-resume-document] .min-h-full,
  [data-resume-document] .editorial-print-container {
    min-height: 0 !important;
  }
`;

export async function waitForResumeAssets(element: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await Promise.all(Array.from(element.querySelectorAll("img"), (image) => image.decode()));
  // Font/image completion can queue a layout measurement in the next frame.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

export function cloneResumeForExport(element: HTMLElement, usePageMargins = false): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  const content = element.querySelector<HTMLElement>(RESUME_CONTENT_SELECTOR);
  const clonedContent = clone.querySelector<HTMLElement>(RESUME_CONTENT_SELECTOR);
  if (!content || !clonedContent) throw new Error("Resume layout content not found");

  // 固定未缩放的容器宽度，让百分比内层继续使用与预览相同的计算基准。
  const style = getComputedStyle(element);
  const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const measurement = createResumeMeasurement(element);
  try {
    const measuredContent = measurement.querySelector<HTMLElement>(RESUME_CONTENT_SELECTOR)!;
    const layout = measureResumeLayout(
      measuredContent,
      parseFloat(style.paddingTop),
      element.dataset.autoOnePage === "true",
    );
    clonedContent.style.zoom = String(layout.scaleFactor);
    clone.dataset.pageCount = String(layout.pageCount);
  } finally {
    measurement.remove();
  }
  clone.style.width = `${parseFloat(style.width) - (usePageMargins ? padding : 0)}px`;
  if (usePageMargins) clone.style.padding = "0";
  clone.querySelectorAll(".page-break-line").forEach((line) => line.remove());
  return clone;
}
