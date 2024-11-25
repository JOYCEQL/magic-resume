"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2 } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import { convertImagesToBase64 } from "@/utils";

export function PdfExport() {
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
    let styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch (e) {
          return "";
        }
      })
      .join("\n");

    const content = `
    <html>
     <head>
       <style>
          @font-face {
            font-family: 'Noto Sans SC';
            src: url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC&display=swap') format('woff2');
            font-weight: normal;
            font-style: normal;
          }
          body {
            font-family: 'Noto Sans SC', sans-serif;
          }
        </style>
        <style>${styles}</style>
      </head>
      <body>
        ${pdfContent}
      </body>
    </html>
  `;
    const response = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content,
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
      <motion.button
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 
          disabled:opacity-50 disabled:cursor-not-allowed"
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
