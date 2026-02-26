import React, { useState, useRef } from "react";
import { useTranslations } from "@/i18n/compat/client";
import {
  Download,
  Loader2,
  FileJson,
  Printer,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { PDF_EXPORT_CONFIG } from "@/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const getOptimizedStyles = () => {
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

const optimizeImages = async (element: HTMLElement) => {
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

const PdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const { activeResume } = useResumeStore();
  const { globalSettings = {}, title } = activeResume || {};
  const t = useTranslations("pdfExport");
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  const handleExport = async () => {
    const exportStartTime = performance.now();
    setIsExporting(true);

    try {
      const pdfElement = document.querySelector<HTMLElement>("#resume-preview");
      if (!pdfElement) {
        throw new Error("PDF element not found");
      }

      const clonedElement = pdfElement.cloneNode(true) as HTMLElement;
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

      // 服务端会强制 #resume-preview { width: 210mm; padding: 0 !important }
      // 预览中内容宽度 = 210mm（父容器）- 2*pagePadding（padding）
      // 通过 inline style 覆盖服务端样式，使内容宽度与预览一致
      const pagePadding = globalSettings?.pagePadding || 0;
      clonedElement.style.setProperty(
        "width",
        "100%",
        "important"
      );
      clonedElement.style.setProperty("padding", "0", "important");
      clonedElement.style.setProperty("box-sizing", "border-box");

      const pageBreakLines =
        clonedElement.querySelectorAll<HTMLElement>(".page-break-line");
      pageBreakLines.forEach((line) => {
        line.style.display = "none";
      });

      const [capturedStyles] = await Promise.all([
        getOptimizedStyles(),
        optimizeImages(clonedElement)
      ]);

      const styles = `
        ${capturedStyles}
        html, body { background: white !important; background-color: white !important; }
        #resume-preview { background: white !important; background-color: white !important; }
      `;

      const response = await fetch(PDF_EXPORT_CONFIG.SERVER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: clonedElement.outerHTML,
          styles,
          margin: globalSettings.pagePadding
        }),
        // 允许跨域请求
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
      console.log(`Total export took ${performance.now() - exportStartTime}ms`);
      toast.success(t("toast.success"));
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("toast.error"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleJsonExport = () => {
    try {
      setIsExportingJson(true);
      if (!activeResume) {
        throw new Error("No active resume");
      }

      const jsonStr = JSON.stringify(activeResume, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title}.json`;
      link.click();

      window.URL.revokeObjectURL(url);
      toast.success(t("toast.jsonSuccess"));
    } catch (error) {
      console.error("JSON export error:", error);
      toast.error(t("toast.jsonError"));
    } finally {
      setIsExportingJson(false);
    }
  };

  const handlePrint = () => {
    if (!printFrameRef.current) {
      console.error("Print frame not found");
      return;
    }

    const resumeContent = document.getElementById("resume-preview");
    if (!resumeContent) {
      console.error("Resume content not found");
      return;
    }

    const actualContent = resumeContent.parentElement;
    if (!actualContent) {
      console.error("Actual content not found");
      return;
    }

    console.log("Found content:", actualContent);

    const pagePadding = globalSettings?.pagePadding || 0;
    const iframeWindow = printFrameRef.current.contentWindow;
    if (!iframeWindow) {
      console.error("IFrame window not found");
      return;
    }

    try {
      iframeWindow.document.open();
      const clonedContent = actualContent.cloneNode(true) as HTMLElement;
      const previewEl = clonedContent.querySelector<HTMLElement>("#resume-preview");
      if (previewEl) {
        const transformValue = previewEl.style.transform || "";
        const match = transformValue.match(/scale\(([\d.]+)\)/);
        if (match) {
          const scale = Number(match[1]);
          if (Number.isFinite(scale) && scale > 0 && scale < 1) {
            // 打印时使用 zoom 参与分页布局计算，比 transform 更接近最终分页效果
            previewEl.style.removeProperty("transform");
            previewEl.style.removeProperty("transform-origin");
            previewEl.style.setProperty("width", "100%");
            previewEl.style.setProperty("zoom", String(scale));
          }
        }
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Resume</title>
            <style>
              @font-face {
                font-family: "Alibaba PuHuiTi";
                src: url("/fonts/AlibabaPuHuiTi-3-55-Regular.ttf") format("truetype");
                font-weight: normal;
                font-style: normal;
                font-display: swap;
              }

              @page {
                size: A4;
                margin: 0;
                padding: 0;
              }
              * {
                box-sizing: border-box;
              }
              html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                background: white;
              }
              body {
                font-family: sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              #resume-preview {
                margin: 0 !important;
                padding: ${pagePadding}px !important;
                -webkit-box-decoration-break: clone;
                box-decoration-break: clone;
                font-family: "Alibaba PuHuiTi", sans-serif !important;
              }

              #print-content {
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto;
                padding: 0;
                background: white;
                box-shadow: none;
              }
              #print-content * {
                box-shadow: none !important;
              }
              
              .page-break-line {
                display: none;
              }

              ${Array.from(document.styleSheets)
                .map((sheet) => {
                  try {
                    return Array.from(sheet.cssRules)
                      .map((rule) => rule.cssText)
                      .join("\n");
                  } catch (e) {
                    console.warn("Could not copy styles from sheet:", e);
                    return "";
                  }
                })
                .join("\n")}
            </style>
          </head>
          <body>
            <div id="print-content">
              ${clonedContent.innerHTML}
            </div>
          </body>
        </html>
      `;

      iframeWindow.document.write(htmlContent);
      iframeWindow.document.close();

      const printWhenReady = async () => {
        try {
          const doc = iframeWindow.document;
          if (doc.fonts?.ready) {
            await doc.fonts.ready;
          }

          const images = Array.from(doc.images);
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

          await new Promise<void>((resolve) => {
            iframeWindow.requestAnimationFrame(() => {
              iframeWindow.requestAnimationFrame(() => resolve());
            });
          });

          iframeWindow.focus();
          iframeWindow.print();
        } catch (error) {
          console.error("Error  print:", error);
        }
      };

      void printWhenReady();
    } catch (error) {
      console.error("Error setting up print:", error);
    }
  };

  const isLoading = isExporting || isExportingJson;
  const loadingText = isExporting
    ? t("button.exporting")
    : isExportingJson
    ? t("button.exportingJson")
    : "";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingText}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{t("button.export")}</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport} disabled={isLoading}>
            <Download className="w-4 h-4 mr-2" />
            {t("button.exportPdf")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrint} disabled={isLoading}>
            <Printer className="w-4 h-4 mr-2" />
            {t("button.print")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleJsonExport} disabled={isLoading}>
            <FileJson className="w-4 h-4 mr-2" />
            {t("button.exportJson")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <iframe
        ref={printFrameRef}
        style={{
          position: "absolute",
          width: "210mm",
          height: "297mm",
          visibility: "hidden",
          zIndex: -1
        }}
        title="Print Frame"
      />
    </>
  );
};

export default PdfExport;
