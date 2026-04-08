import React, { useState } from "react";
import { useTranslations } from "@/i18n/compat/client";
import {
  Download,
  Loader2,
  FileJson,
  Printer,
  ChevronDown
} from "lucide-react";
import { RiMarkdownLine } from "@remixicon/react";
import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { exportResumeAsJson, exportResumeAsMarkdown, exportToPdf } from "@/utils/export";
import { exportResumeToBrowserPrint } from "@/utils/print";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const PdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingMarkdown, setIsExportingMarkdown] = useState(false);
  const { activeResume } = useResumeStore();
  const { globalSettings = {}, title } = activeResume || {};
  const t = useTranslations("pdfExport");
  const tBasicField = useTranslations("workbench.basicPanel.basicFields");

  const handleExport = async () => {
    await exportToPdf({
      elementId: "resume-preview",
      title: title || "resume",
      pagePadding: globalSettings?.pagePadding || 0,
      fontFamily: globalSettings?.fontFamily,
      onStart: () => setIsExporting(true),
      onEnd: () => setIsExporting(false),
      successMessage: t("toast.success"),
      errorMessage: t("toast.error")
    });
  };

  const handleJsonExport = () => {
    exportResumeAsJson({
      resume: activeResume,
      title,
      onStart: () => setIsExportingJson(true),
      onEnd: () => setIsExportingJson(false),
      successMessage: t("toast.jsonSuccess"),
      errorMessage: t("toast.jsonError")
    });
  };

  const handleMarkdownExport = () => {
    exportResumeAsMarkdown({
      resume: activeResume,
      title,
      onStart: () => setIsExportingMarkdown(true),
      onEnd: () => setIsExportingMarkdown(false),
      successMessage: t("toast.markdownSuccess"),
      errorMessage: t("toast.markdownError"),
      markdownOptions: {
        basicFieldLabels: {
          name: tBasicField("name"),
          title: tBasicField("title"),
          employementStatus: tBasicField("employementStatus"),
          birthDate: tBasicField("birthDate"),
          email: tBasicField("email"),
          phone: tBasicField("phone"),
          location: tBasicField("location")
        }
      }
    });
  };

  const handlePrint = async () => {
    const resumeContent = document.getElementById("resume-preview");
    if (!resumeContent) {
      console.error("Resume content not found");
      return;
    }

    const pagePadding = globalSettings?.pagePadding || 0;
    await exportResumeToBrowserPrint(
      resumeContent,
      pagePadding,
      globalSettings?.fontFamily
    );
  };

  const isLoading = isExporting || isExportingJson || isExportingMarkdown;
  const loadingText = isExporting
    ? t("button.exporting")
    : isExportingJson
      ? t("button.exportingJson")
      : isExportingMarkdown
        ? t("button.exportingMarkdown")
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
          <DropdownMenuItem onClick={handleMarkdownExport} disabled={isLoading}>
            <RiMarkdownLine className="w-4 h-4 mr-2" />
            {t("button.exportMarkdown")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default PdfExport;
