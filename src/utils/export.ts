import { toast } from "sonner";
import { PDF_EXPORT_CONFIG } from "@/config";
import { getFontFaceCss, normalizeFontFamily } from "@/utils/fonts";
import { ResumeData } from "@/types/resume";
import { generateResumeMarkdown, ResumeMarkdownOptions } from "@/utils/markdown";

const INVALID_FILE_NAME_CHAR_REGEX = /[\\/:*?"<>|]/g;

const getSafeFileName = (title?: string) => {
  const normalized = (title || "resume")
    .trim()
    .replace(INVALID_FILE_NAME_CHAR_REGEX, "_")
    .replace(/\s+/g, " ");

  return normalized || "resume";
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};

const downloadTextFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, fileName);
};

export const getOptimizedStyles = () => {
  const styleCache = new Map();
  const startTime = performance.now();

  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .filter((rule) => {
            const ruleText = rule.cssText;
            const normalizedRuleText = ruleText.toLowerCase();
            if (styleCache.has(ruleText)) return false;
            styleCache.set(ruleText, true);

            if (rule instanceof CSSFontFaceRule) return false;
            if (rule instanceof CSSImportRule) return false;
            if (normalizedRuleText.includes("fonts.googleapis.com")) return false;
            if (normalizedRuleText.includes("fonts.gstatic.com")) return false;
            if (ruleText.includes("font-family")) return false;
            if (ruleText.includes("@keyframes")) return false;
            if (ruleText.includes("animation")) return false;
            if (ruleText.includes("transition")) return false;
            if (ruleText.includes("hover")) return false;
            return true;
          })
          .map((rule) => rule.cssText)
          .join("\n");
      } catch (e) {
        console.warn("Style processing error:", e);
        return "";
      }
    })
    .join("\n");

  console.log(`Style processing took ${performance.now() - startTime}ms`);
  return styles;
};

export const optimizeImages = async (element: HTMLElement) => {
  const startTime = performance.now();
  const images = element.getElementsByTagName("img");

  const imagePromises = Array.from(images)
    .filter((img) => !img.src.startsWith("data:"))
    .map(async (img) => {
      try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            img.src = reader.result as string;
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Image conversion error:", error);
        return Promise.resolve();
      }
    });

  await Promise.all(imagePromises);
  console.log(`Image processing took ${performance.now() - startTime}ms`);
};

export interface ExportToPdfOptions {
  elementId: string;
  title: string;
  pagePadding: number;
  fontFamily?: string;
  onStart?: () => void;
  onEnd?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

const A4_WIDTH_MM = 210;
const PX_PER_MM = 96 / 25.4;
const LONG_PAGE_HEIGHT_BUFFER_MM = 2;
const LONG_PAGE_CAPTURE_BUFFER_PX = 8;
const LONG_PAGE_BOTTOM_SAFE_AREA_PX = 8;

const keepOnlyFirstPage = (pdf: jsPDF) => {
  const pdfWithPageControl = pdf as jsPDF & {
    getNumberOfPages?: () => number;
    deletePage?: (pageNumber: number) => void;
  };

  const totalPages = pdfWithPageControl.getNumberOfPages?.() ?? 1;
  if (totalPages <= 1 || !pdfWithPageControl.deletePage) {
    return;
  }

  for (let pageNumber = totalPages; pageNumber > 1; pageNumber -= 1) {
    pdfWithPageControl.deletePage(pageNumber);
  }
};

interface ExportResumeFileOptions {
  resume?: ResumeData | null;
  title?: string;
  onStart?: () => void;
  onEnd?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

interface ExportResumeMarkdownOptions extends ExportResumeFileOptions {
  markdownOptions?: ResumeMarkdownOptions;
}

export const exportResumeAsJson = ({
  resume,
  title,
  onStart,
  onEnd,
  successMessage,
  errorMessage
}: ExportResumeFileOptions) => {
  onStart?.();

  try {
    if (!resume) {
      throw new Error("No active resume");
    }

    const json = JSON.stringify(resume, null, 2);
    const fileName = `${getSafeFileName(title || resume.title)}.json`;
    downloadTextFile(json, fileName, "application/json;charset=utf-8");
    if (successMessage) toast.success(successMessage);
  } catch (error) {
    console.error("JSON export error:", error);
    if (errorMessage) toast.error(errorMessage);
  } finally {
    onEnd?.();
  }
};

export const exportResumeAsMarkdown = ({
  resume,
  title,
  onStart,
  onEnd,
  successMessage,
  errorMessage,
  markdownOptions
}: ExportResumeMarkdownOptions) => {
  onStart?.();

  try {
    if (!resume) {
      throw new Error("No active resume");
    }

    const markdown = generateResumeMarkdown(resume, markdownOptions);
    const fileName = `${getSafeFileName(title || resume.title)}.md`;
    downloadTextFile(markdown, fileName, "text/markdown;charset=utf-8");
    if (successMessage) toast.success(successMessage);
  } catch (error) {
    console.error("Markdown export error:", error);
    if (errorMessage) toast.error(errorMessage);
  } finally {
    onEnd?.();
  }
};

const hidePageBreakLines = (element: HTMLElement) => {
  const pageBreakLines = element.querySelectorAll<HTMLElement>(".page-break-line");
  pageBreakLines.forEach((line) => {
    line.remove();
  });
};

const removeLongPageHeightConstraints = (element: HTMLElement) => {
  const rootElement = element.firstElementChild as HTMLElement | null;
  if (rootElement) {
    rootElement.style.setProperty("height", "auto", "important");
    rootElement.style.setProperty("min-height", "0", "important");
  }

  const constrainedElements = element.querySelectorAll<HTMLElement>(".min-h-screen, .min-h-full, .editorial-print-container");
  constrainedElements.forEach((node) => {
    node.style.setProperty("height", "auto", "important");
    node.style.setProperty("min-height", "0", "important");
  });
};

const getPreviewScale = (element: HTMLElement) => {
  const transformValue = element.style.transform || "";
  const scaleMatch = transformValue.match(/scale\(([\d.]+)\)/);
  if (!scaleMatch) return 1;

  const scale = Number(scaleMatch[1]);
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
};

const waitForImages = async (element: HTMLElement) => {
  const images = Array.from(element.getElementsByTagName("img"));
  await Promise.all(
    images
      .filter((img) => !img.complete)
      .map(
        (img) =>
          new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
  );
};

export const exportToLongPagePdf = async ({
  elementId,
  title,
  pagePadding,
  fontFamily,
  onStart,
  onEnd,
  successMessage,
  errorMessage
}: ExportToPdfOptions) => {
  const exportStartTime = performance.now();
  onStart?.();

  let container: HTMLDivElement | null = null;

  try {
    const pdfElement = document.querySelector<HTMLElement>(`#${elementId}`);
    if (!pdfElement) {
      throw new Error(`PDF element #${elementId} not found`);
    }

    const selectedFontFamily = normalizeFontFamily(fontFamily);
    const clonedElement = pdfElement.cloneNode(true) as HTMLElement;
    const previewScale = getPreviewScale(clonedElement);
    hidePageBreakLines(clonedElement);
    removeLongPageHeightConstraints(clonedElement);
    await optimizeImages(clonedElement);

    clonedElement.style.setProperty("padding", `${pagePadding}px`, "important");
    clonedElement.style.setProperty("box-sizing", "border-box", "important");
    clonedElement.style.setProperty("background", "white", "important");
    clonedElement.style.setProperty("font-family", selectedFontFamily, "important");

    const bottomSpacer = document.createElement("div");
    bottomSpacer.setAttribute("aria-hidden", "true");
    bottomSpacer.style.width = "100%";
    bottomSpacer.style.height = `${Math.ceil(LONG_PAGE_BOTTOM_SAFE_AREA_PX / previewScale)}px`;
    bottomSpacer.style.pointerEvents = "none";
    clonedElement.appendChild(bottomSpacer);

    container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.style.width = `${A4_WIDTH_MM}mm`;
    container.style.background = "white";
    container.style.pointerEvents = "none";
    container.style.zIndex = "-1";

    const fontStyles = document.createElement("style");
    fontStyles.textContent = await getFontFaceCss(selectedFontFamily);
    container.appendChild(fontStyles);
    container.appendChild(clonedElement);
    document.body.appendChild(container);

    await waitForImages(clonedElement);
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

    const renderedRect = clonedElement.getBoundingClientRect();
    const contentWidthPx =
      renderedRect.width || clonedElement.scrollWidth || A4_WIDTH_MM * PX_PER_MM;
    const contentHeightPx = Math.max(
      renderedRect.height,
      clonedElement.scrollHeight * previewScale,
      1
    );
    const pageHeightMm = Math.max(
      contentHeightPx * (A4_WIDTH_MM / contentWidthPx) + LONG_PAGE_HEIGHT_BUFFER_MM,
      1
    );
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf")
    ]);

    const fileName = `${getSafeFileName(title)}.pdf`;
    const canvas = await html2canvas(clonedElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.ceil(contentWidthPx),
      windowHeight: Math.ceil(contentHeightPx + LONG_PAGE_CAPTURE_BUFFER_PX)
    });

    const imageHeightMm = canvas.height * (A4_WIDTH_MM / canvas.width);
    const canvasPageHeightMm = Math.max(
      imageHeightMm + LONG_PAGE_HEIGHT_BUFFER_MM,
      pageHeightMm
    );
    const pdf = new jsPDF({
      unit: "mm",
      format: [A4_WIDTH_MM, canvasPageHeightMm],
      orientation: "portrait",
      compress: true
    });
    const imageData = canvas.toDataURL("image/png");
    pdf.addImage(imageData, "PNG", 0, 0, A4_WIDTH_MM, imageHeightMm);
    keepOnlyFirstPage(pdf);
    pdf.save(fileName);

    if (successMessage) toast.success(successMessage);
    console.log(`Total long page export took ${performance.now() - exportStartTime}ms`);
  } catch (error) {
    console.error("Long page export error:", error);
    if (errorMessage) toast.error(errorMessage);
  } finally {
    if (container?.parentNode) {
      container.parentNode.removeChild(container);
    }
    onEnd?.();
  }
};

export const exportToPdf = async ({
  elementId,
  title,
  pagePadding,
  fontFamily,
  onStart,
  onEnd,
  successMessage,
  errorMessage
}: ExportToPdfOptions) => {
  const exportStartTime = performance.now();
  onStart?.();

  try {
    const pdfElement = document.querySelector<HTMLElement>(`#${elementId}`);
    if (!pdfElement) {
      throw new Error(`PDF element #${elementId} not found`);
    }

    const clonedElement = pdfElement.cloneNode(true) as HTMLElement;
    const selectedFontFamily = normalizeFontFamily(fontFamily);
    const transformValue = clonedElement.style.transform || "";
    const scaleMatch = transformValue.match(/scale\(([\d.]+)\)/);
    
    if (scaleMatch) {
      const scale = Number(scaleMatch[1]);
      if (Number.isFinite(scale) && scale > 0 && scale < 1) {
        // 服务端导出前将 transform 缩放转为 zoom，避免分页计算偏差
        clonedElement.style.removeProperty("transform");
        clonedElement.style.removeProperty("transform-origin");
        clonedElement.style.setProperty("width", "100%", "important");
        clonedElement.style.setProperty("zoom", String(scale));
      }
    }

    // 采用 PdfExport.tsx 中的逻辑，统一宽度和 padding 处理
    clonedElement.style.setProperty("width", "100%", "important");
    clonedElement.style.setProperty("padding", "0", "important");
    clonedElement.style.setProperty("box-sizing", "border-box");
    clonedElement.style.setProperty("font-family", selectedFontFamily, "important");

    hidePageBreakLines(clonedElement);

    const [capturedStyles] = await Promise.all([
      getOptimizedStyles(),
      optimizeImages(clonedElement)
    ]);

    // 注入 PdfExport.tsx 中的样式增强
    const styles = `
      ${capturedStyles}
      html, body { background: white !important; background-color: white !important; }
      html, body, #${elementId} {
        background: white !important;
        background-color: white !important;
        font-family: ${selectedFontFamily} !important;
      }
    `;

    const response = await fetch(PDF_EXPORT_CONFIG.SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: clonedElement.outerHTML,
        styles,
        margin: pagePadding
      }),
      mode: "cors",
      signal: AbortSignal.timeout(PDF_EXPORT_CONFIG.TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.status}`);
    }

    const blob = await response.blob();
    const fileName = `${getSafeFileName(title)}.pdf`;
    downloadBlob(blob, fileName);

    if (successMessage) toast.success(successMessage);
    console.log(`Total export took ${performance.now() - exportStartTime}ms`);
  } catch (error) {
    console.error("Export error:", error);
    if (errorMessage) toast.error(errorMessage);
  } finally {
    onEnd?.();
  }
};
