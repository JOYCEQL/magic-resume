import { toast } from "sonner";
import { PDF_EXPORT_CONFIG } from "@/config";
import { normalizeFontFamily } from "@/utils/fonts";

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

    const pageBreakLines = clonedElement.querySelectorAll<HTMLElement>(".page-break-line");
    pageBreakLines.forEach((line) => {
      line.style.display = "none";
    });

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
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}.pdf`;
    link.click();

    window.URL.revokeObjectURL(url);
    if (successMessage) toast.success(successMessage);
    console.log(`Total export took ${performance.now() - exportStartTime}ms`);
  } catch (error) {
    console.error("Export error:", error);
    if (errorMessage) toast.error(errorMessage);
  } finally {
    onEnd?.();
  }
};
