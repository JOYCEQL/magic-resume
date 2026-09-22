export const A4_HEIGHT_PX = 297 * 96 / 25.4;
export const RESUME_CONTENT_SELECTOR = "[data-resume-content]";

// 同一份规则用于预览、测量副本和导出，避免视口高度改变文档排版。
export const RESUME_LAYOUT_CSS = `
  [data-resume-document] .min-h-screen,
  [data-resume-document] .min-h-full,
  [data-resume-document] .editorial-print-container {
    min-height: 0 !important;
  }
`;

export function cloneResumeForExport(element: HTMLElement, usePageMargins = false): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  const content = element.querySelector<HTMLElement>(RESUME_CONTENT_SELECTOR);
  const clonedContent = clone.querySelector<HTMLElement>(RESUME_CONTENT_SELECTOR);
  if (!content || !clonedContent) throw new Error("Resume layout content not found");

  // 固定未缩放的容器宽度，让百分比内层继续使用与预览相同的计算基准。
  const style = getComputedStyle(element);
  const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  clone.style.width = `${parseFloat(style.width) - (usePageMargins ? padding : 0)}px`;
  if (usePageMargins) clone.style.padding = "0";
  clone.querySelectorAll(".page-break-line").forEach((line) => line.remove());
  return clone;
}
