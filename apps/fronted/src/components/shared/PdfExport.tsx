"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2 } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import { convertImagesToBase64 } from "@/utils";
import { Button } from "@/components/ui/button";

const PdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const globalSettings = useResumeStore((state) => state.globalSettings);

  const handleExport = async () => {
    setIsExporting(true);
    const pdfElement = document.querySelector<HTMLElement>("#resume-preview");
    if (!pdfElement) return;
    const pageBreakLines =
      pdfElement.querySelectorAll<HTMLElement>(".page-break-line");

    pageBreakLines.forEach((line: HTMLElement) => {
      line.style.display = "none";
    });
    const pdfContent = await convertImagesToBase64(pdfElement);

    // 不过滤字体
    // let styles = Array.from(document.styleSheets)
    //   .map((sheet) => {
    //     try {
    //       return Array.from(sheet.cssRules)
    //         .map((rule) => rule.cssText)
    //         .join("\n");
    //     } catch (e) {
    //       return "";
    //     }
    //   })
    //   .join("\n");

    // 过滤字体
    let styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .filter((rule) => {
              // 过滤掉 @font-face 规则
              if (rule instanceof CSSFontFaceRule) return false;
              // 过滤掉包含 font 相关属性的规则
              if (rule.cssText.includes("font-family")) return false;
              return true;
            })
            .map((rule) => rule.cssText)
            .join("\n");
        } catch (e) {
          return "";
        }
      })
      .join("\n");

    const response = await fetch("/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: pdfContent,
        styles: styles,
        margin: globalSettings.pagePadding
      })
    });

    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "document.pdf";
    link.click();
    window.URL.revokeObjectURL(url);
    setIsExporting(false);
    pageBreakLines.forEach((line) => {
      line.style.display = "block";
    });
  };

  return (
    <div>
      <Button
        className=" px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 
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
