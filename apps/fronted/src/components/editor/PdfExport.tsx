import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download, Loader2 } from "lucide-react";
import html2pdf from "html2pdf.js";
import { useResumeStore } from "@/store/useResumeStore";
import { getThemeConfig } from "@/theme/themeConfig";

export function PdfExport() {
  const { basic, theme } = useResumeStore();
  const [isExporting, setIsExporting] = useState(false);
  const themeConfig = getThemeConfig(theme === "dark");

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const element = document.querySelector("#resume-preview");
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

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF export failed:", error);
      // 可以添加错误提示
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.button
      className={`px-4 py-2 ${themeConfig.buttonPrimary} text-white rounded-lg text-sm font-medium flex items-center space-x-2`}
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
  );
}
