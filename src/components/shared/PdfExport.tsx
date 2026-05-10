import React, { useState } from "react";
import { useTranslations } from "@/i18n/compat/client";
import { Download, Loader2, ChevronDown, ShieldCheck } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import { Button } from "@/components/ui/button";
import {
  exportResumeAsJson,
  exportResumeAsMarkdown,
  exportToLongPagePdf,
  exportToPdf
} from "@/utils/export";
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
        "group relative flex flex-col justify-center overflow-hidden p-6 pl-[136px] min-h-[130px] rounded-3xl border border-border/50 bg-card text-card-foreground shadow-sm transition-all duration-500",
        isLoading ? "opacity-70 cursor-not-allowed" : cn("cursor-pointer hover:shadow-2xl active:scale-[0.98] hover:-translate-y-1 hover:bg-muted/10", hoverBorderClass)
      )}
    >
      {/* 顶部内发光高光，增加卡片立体感 */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* 底部环境光晕，让图标色渗入背景 */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-opacity duration-500 bg-gradient-to-r to-transparent",
        isLoading ? "opacity-50" : "opacity-0 group-hover:opacity-100",
        bgGradientClass
      )} />

      {/* 调整后的图标层：完全收入卡片内部，尺寸克制 */}
      <div className={cn(
        "absolute left-6 top-1/2 -translate-y-1/2 w-24 h-24 transition-transform duration-500 will-change-transform drop-shadow-xl pointer-events-none",
        isLoading ? "-rotate-6 scale-[1.05] opacity-80" : "-rotate-6 group-hover:scale-[1.1] group-hover:-rotate-3"
      )}>
        <Icon className="w-full h-full object-contain" isLoading={isLoading} />
      </div>

      {/* 文本内容说明 */}
      <div className="relative z-10 flex flex-col pointer-events-none">
        <h3 className="font-semibold text-[17px] mb-1.5 tracking-tight text-foreground/90 transition-colors">{title}</h3>
        <p className="text-[13px] text-muted-foreground/75 leading-relaxed line-clamp-3 group-hover:text-muted-foreground/90 transition-colors">
          {description}
        </p>
      </div>
    </div>
  );
};

const PdfExport = ({ children }: { children?: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingLongPage, setIsExportingLongPage] = useState(false);
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

  const handleLongPageExport = async () => {
    await exportToLongPagePdf({
      elementId: "resume-preview",
      title: title || "resume",
      pagePadding: globalSettings?.pagePadding || 0,
      fontFamily: globalSettings?.fontFamily,
      onStart: () => setIsExportingLongPage(true),
      onEnd: () => setIsExportingLongPage(false),
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

  const isLoading =
    isExporting ||
    isExportingLongPage ||
    isExportingJson ||
    isExportingMarkdown ||
    isPrinting;
  const loadingText = isExporting
    ? t("button.exporting")
    : isExportingLongPage
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
        {children ? children : (
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
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl gap-0 p-0 sm:rounded-[2rem] border border-border/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] bg-background overflow-hidden">
        {/* 头部区域：带精美网格和高光 */}
        <div className="relative p-8 pb-6 border-b border-border/40 bg-muted/10">
          {/* SaaS 网格底纹背景 */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

          <DialogHeader className="relative gap-2">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {t("modal.title")}
            </DialogTitle>
            <DialogDescription className="text-[15px] text-muted-foreground/80 mt-1">
              {t("modal.subtitle")}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* 卡片展示区域 */}
        <div className="p-8 bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
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
              icon={PdfGlassIcon}
              title={t("button.exportLongPagePdf")}
              description={t("modal.longPagePdfDesc")}
              isLoading={isExportingLongPage}
              onClick={handleLongPageExport}
              bgGradientClass="from-violet-500/10 dark:from-violet-500/20"
              hoverBorderClass="hover:border-violet-500/40 hover:ring-1 hover:ring-violet-500/20"
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

          {/* 隐私保护横幅 */}
          <div className="mt-6 flex items-center gap-2 p-3 sm:px-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <p className="text-[13px] font-medium">
              {t("modal.privacyNotice")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfExport;
