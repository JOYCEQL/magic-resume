"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2 } from "lucide-react";
import html2pdf from "html2pdf.js";
import { useResumeStore } from "@/store/useResumeStore";

export function PdfExport() {
  const { basic, theme } = useResumeStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    const element = document.querySelector("#resume-preview");
    if (!element) {
      setIsExporting(false);
      return;
    }
    // 内容高度的问题
    const contentHeight = element.scrollHeight - 30.22;
    const A4_HEIGHT_MM = 297;
    const MARGINS_MM = 8;
    const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - MARGINS_MM;
    const DPI = 96;
    const MM_TO_PX = DPI / 25.4;

    const pageHeightPx = Math.ceil(CONTENT_HEIGHT_MM * MM_TO_PX);
    const numberOfPages = Math.ceil(contentHeight / pageHeightPx);

    const pageBreakLines = element.querySelectorAll(".page-break-line");
    pageBreakLines.forEach((line) => {
      line.style.display = "none";
    });

    // 导出后的清理代码
    const cleanup = () => {
      pageBreakLines.forEach((line) => {
        line.style.display = "";
      });
      setIsExporting(false);
    };

    const opt = {
      margin: [4, 4, 4, 4],
      filename: `${basic.name}_简历.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      pagebreak: {
        mode: ["css", "legacy"]
      },
      html2canvas: {
        scale: window.devicePixelRatio * 3,
        letterRendering: true,
        scrollY: -window.scrollY,
        height: pageHeightPx * numberOfPages
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        putTotalPages: false
      }
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then((res: any) => {
        return res;
      })
      .catch((error: any) => {
        console.error("PDF export failed:", error);
        return { notFound: true };
      })
      .finally(() => {
        setIsExporting(false);
        cleanup();
        return { finally: true };
      });
  };

  return (
    <div>
      <motion.button
        className={`bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2
            disabled:opacity-50 disabled:cursor-not-allowed`}
        whileHover={!isExporting ? { scale: 1.02 } : {}}
        whileTap={!isExporting ? { scale: 0.98 } : {}}
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isExporting ? "导出中..." : "导出 PDF"}</span>
      </motion.button>
    </div>
  );
}
