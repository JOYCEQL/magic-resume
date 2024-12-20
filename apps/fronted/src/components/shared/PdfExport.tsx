"use client";
import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";

const getOptimizedStyles = () => {
  const styleCache = new Map();
  const startTime = performance.now();

  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .filter((rule) => {
            const ruleText = rule.cssText;
            if (styleCache.has(ruleText)) return false;
            styleCache.set(ruleText, true);

            if (rule instanceof CSSFontFaceRule) return false;
            if (ruleText.includes("font-family")) return false;
            if (ruleText.includes("@keyframes")) return false;
            if (ruleText.includes("animation")) return false;
            if (ruleText.includes("transition")) return false;
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
  const { activeResume } = useResumeStore();
  const { globalSettings = {}, title } = activeResume || {};

  const handleExport = async () => {
    const exportStartTime = performance.now();
    setIsExporting(true);

    try {
      const pdfElement = document.querySelector<HTMLElement>("#resume-preview");
      if (!pdfElement) {
        throw new Error("PDF element not found");
      }

      const clonedElement = pdfElement.cloneNode(true) as HTMLElement;

      const pageBreakLines =
        clonedElement.querySelectorAll<HTMLElement>(".page-break-line");
      pageBreakLines.forEach((line) => {
        line.style.display = "none";
      });

      const [styles] = await Promise.all([
        getOptimizedStyles(),
        optimizeImages(clonedElement),
      ]);

      const response = await fetch("/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: clonedElement.outerHTML,
          styles,
        }),
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
      toast.success("PDF 导出成功！");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("PDF 导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <Button
        className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isExporting ? "导出中..." : "导出 PDF"}</span>
      </Button>
    </div>
  );
};

export default PdfExport;
