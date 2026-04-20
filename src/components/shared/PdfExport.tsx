import React, { useState } from "react";
import { useTranslations } from "@/i18n/compat/client";
import { Download, Loader2, ChevronDown } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import { exportResumeAsJson, exportResumeAsMarkdown, exportToPdf } from "@/utils/export";
import { exportResumeToBrowserPrint } from "@/utils/print";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  PdfGlassIcon,
  PrintGlassIcon,
  JsonGlassIcon,
  MarkdownGlassIcon,
} from "./GlassIcons";


const ExportCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  isLoading,
  bgGradientClass,
  hoverBorderClass,
}: {
  icon: React.ElementType | any,
  title: string,
  description: string,
  onClick: () => void,
  isLoading: boolean,
  bgGradientClass?: string,
  hoverBorderClass?: string,
}) => {
  return (
    <div
      onClick={() => {
        if (!isLoading) onClick();
      }}
      className={cn(
        "group relative flex flex-col justify-center overflow-hidden p-6 pl-[130px] min-h-[140px] rounded-3xl border bg-card text-card-foreground shadow-sm transition-all duration-500",
        isLoading ? "opacity-70 cursor-not-allowed" : cn("cursor-pointer hover:shadow-xl active:scale-[0.98] hover:-translate-y-1", hoverBorderClass)
      )}
    >
      {/* 底部环境光晕，让图标色渗入背景 */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-opacity duration-500 bg-gradient-to-r to-transparent",
        isLoading ? "opacity-50" : "opacity-0 group-hover:opacity-100",
        bgGradientClass
      )} />

      <div className={cn(
        "absolute -left-6 top-1/2 -translate-y-1/2 w-40 h-40 transition-transform duration-500 will-change-transform drop-shadow-xl pointer-events-none",
        isLoading ? "-rotate-12 scale-[1.08] opacity-80" : "-rotate-12 group-hover:scale-[1.08]"
      )}>
        <Icon className="w-full h-full object-contain" isLoading={isLoading} />
      </div>

      {/* 文本内容说明 (Z-indexed above icon) */}
      <div className="relative z-10 flex flex-col pointer-events-none">
        <h3 className="font-bold text-[17px] mb-2 tracking-tight text-foreground/90 transition-colors">{title}</h3>
        <p className="text-[13px] text-muted-foreground/80 leading-relaxed line-clamp-3 group-hover:text-muted-foreground transition-colors">
          {description}
        </p>
      </div>
    </div>
  );
};

const PdfExport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
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

    try {
      setIsPrinting(true);
      const pagePadding = globalSettings?.pagePadding || 0;
      await exportResumeToBrowserPrint(
        resumeContent,
        pagePadding,
        globalSettings?.fontFamily
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const isLoading = isExporting || isExportingJson || isExportingMarkdown || isPrinting;
  const loadingText = isExporting
    ? t("button.exporting")
    : isExportingJson
      ? t("button.exportingJson")
      : isExportingMarkdown
        ? t("button.exportingMarkdown")
        : isPrinting
          ? t("button.exporting")
          : "";

  return (
    <Dialog open={isOpen} onOpenChange={(val) => {
      if (isLoading) return; // 导出中不允许关闭，以防止打断流程或丢失提示
      setIsOpen(val);
    }}>
      <DialogTrigger asChild>
        <Button
          className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl gap-8 p-8 sm:rounded-2xl border-none shadow-2xl bg-gradient-to-b from-background to-muted/20">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            {t("modal.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground/80 mt-1">
            {t("modal.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ExportCard
            icon={PdfGlassIcon}
            title={t("button.exportPdf")}
            description={t("modal.pdfDesc")}
            isLoading={isExporting}
            onClick={handleExport}
            bgGradientClass="from-rose-500/10 dark:from-rose-500/20"
            hoverBorderClass="hover:border-rose-500/40 hover:ring-1 hover:ring-rose-500/20"
          />
          <ExportCard
            icon={PrintGlassIcon}
            title={t("button.print")}
            description={t("modal.printDesc")}
            isLoading={isPrinting}
            onClick={handlePrint}
            bgGradientClass="from-sky-500/10 dark:from-sky-500/20"
            hoverBorderClass="hover:border-sky-500/40 hover:ring-1 hover:ring-sky-500/20"
          />
          <ExportCard
            icon={JsonGlassIcon}
            title={t("button.exportJson")}
            description={t("modal.jsonDesc")}
            isLoading={isExportingJson}
            onClick={handleJsonExport}
            bgGradientClass="from-amber-500/10 dark:from-amber-500/20"
            hoverBorderClass="hover:border-amber-500/40 hover:ring-1 hover:ring-amber-500/20"
          />
          <ExportCard
            icon={MarkdownGlassIcon}
            title={t("button.exportMarkdown")}
            description={t("modal.markdownDesc")}
            isLoading={isExportingMarkdown}
            onClick={handleMarkdownExport}
            bgGradientClass="from-indigo-500/10 dark:from-indigo-500/20"
            hoverBorderClass="hover:border-indigo-500/40 hover:ring-1 hover:ring-indigo-500/20"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfExport;
