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
      return;
    }
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${basic.name}_简历.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      }
    };

    const res = html2pdf().set(opt).from(element).save();
    setIsExporting(false);
    return res;
  };

  return (
    <div>
      <motion.button
        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2
          ${
            theme === "dark"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-black hover:bg-neutral-800 text-white"
          } 
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
