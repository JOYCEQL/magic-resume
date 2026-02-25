"use client";
import React, { useCallback, useState } from "react";
import {
  Edit2,
  PanelRightClose,
  PanelRightOpen,
  SpellCheck2,
  Home,
  Copy,
  Download,
  Printer,
  FileJson,
  Loader2,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/i18n/compat/client";
import { useRouter } from "@/lib/navigation";
import { Dock, DockIcon } from "@/components/magicui/dock";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import TemplateSheet from "@/components/shared/TemplateSheet";
import { GITHUB_REPO_URL, PDF_EXPORT_CONFIG } from "@/config";
import { cn } from "@/lib/utils";
import { useGrammarCheck } from "@/hooks/useGrammarCheck";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { AI_MODEL_CONFIGS } from "@/config/ai";
import { useResumeStore } from "@/store/useResumeStore";
import { useAIConfiguration } from "@/hooks/useAIConfiguration";

export type IconProps = React.HTMLAttributes<SVGElement>;

interface PreviewDockProps {
  sidePanelCollapsed: boolean;
  editPanelCollapsed: boolean;
  previewPanelCollapsed: boolean;
  toggleSidePanel: () => void;
  toggleEditPanel: () => void;
  togglePreviewPanel: () => void;
  resumeContentRef: React.RefObject<HTMLDivElement>;
}

const Icons = {
  gitHub: (props: IconProps) => (
    <svg viewBox="0 0 438.549 438.549" {...props}>
      <path
        fill="currentColor"
        d="M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 01-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 1.995 44.163-14.653 80.185-41.062 108.068-79.226 27.88-38.161 41.825-81.126 41.825-128.906-.01-39.771-9.818-76.454-29.414-110.049z"
      ></path>
    </svg>
  )
};
const PreviewDock = ({
  sidePanelCollapsed,
  editPanelCollapsed,
  previewPanelCollapsed,
  toggleSidePanel,
  toggleEditPanel,
  togglePreviewPanel,
  resumeContentRef
}: PreviewDockProps) => {
  const router = useRouter();
  const t = useTranslations("previewDock");
  const tPdf = useTranslations("pdfExport");
  const { checkGrammar, isChecking } = useGrammarCheck();
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);

  const {
    selectedModel,
    doubaoApiKey,
    doubaoModelId,
    deepseekApiKey,
    deepseekModelId,
    openaiApiKey,
    openaiModelId,
    openaiApiEndpoint
  } = useAIConfigStore();

  const { duplicateResume, setActiveResume, activeResumeId, activeResume } = useResumeStore();
  const { globalSettings = {}, title } = activeResume || {};

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

  const handleExportPdf = async () => {
    const exportStartTime = performance.now();
    setIsExporting(true);

    try {
      const pdfElement = document.querySelector<HTMLElement>("#resume-preview");
      if (!pdfElement) {
        throw new Error("PDF element not found");
      }

      const clonedElement = pdfElement.cloneNode(true) as HTMLElement;
      const pagePadding = globalSettings?.pagePadding || 0;
      clonedElement.style.setProperty(
        "width",
        `calc(210mm - ${2 * pagePadding}px)`,
        "important"
      );
      clonedElement.style.setProperty("padding", "0", "important");
      clonedElement.style.setProperty("box-sizing", "border-box");

      const pageBreakLines =
        clonedElement.querySelectorAll<HTMLElement>(".page-break-line");
      pageBreakLines.forEach((line) => {
        line.style.display = "none";
      });

      const [styles] = await Promise.all([
        getOptimizedStyles(),
        optimizeImages(clonedElement)
      ]);

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
      toast.success(tPdf("toast.success"));
    } catch (error) {
      console.error("Export error:", error);
      toast.error(tPdf("toast.error"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
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
      toast.success(tPdf("toast.jsonSuccess"));
    } catch (error) {
      console.error("JSON export error:", error);
      toast.error(tPdf("toast.jsonError"));
    } finally {
      setIsExportingJson(false);
    }
  };

  const handlePrint = () => {
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

    const printFrame = document.createElement("iframe");
    printFrame.style.position = "absolute";
    printFrame.style.width = "210mm";
    printFrame.style.height = "297mm";
    printFrame.style.visibility = "hidden";
    printFrame.style.zIndex = "-1";
    document.body.appendChild(printFrame);

    const pagePadding = globalSettings?.pagePadding;
    const iframeWindow = printFrame.contentWindow;
    if (!iframeWindow) {
      console.error("IFrame window not found");
      document.body.removeChild(printFrame);
      return;
    }

    try {
      iframeWindow.document.open();
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
                margin: ${pagePadding}px;
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
                padding: 0 !important;
                margin: 0 !important;
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
                transform: none !important;
                scale: 1 !important;
              }
              .scale-90 {
                transform: none !important;
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
              ${actualContent.innerHTML}
            </div>
          </body>
        </html>
      `;

      iframeWindow.document.write(htmlContent);
      iframeWindow.document.close();

      setTimeout(() => {
        try {
          iframeWindow.focus();
          iframeWindow.print();
          // 打印完成后清理iframe
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame);
            }
          }, 1000);
        } catch (error) {
          console.error("Error print:", error);
          document.body.removeChild(printFrame);
        }
      }, 1000);
    } catch (error) {
      console.error("Error setting up print:", error);
      document.body.removeChild(printFrame);
    }
  };

  const { checkConfiguration } = useAIConfiguration();

  // ... (keep other hooks)

  const handleGrammarCheck = useCallback(async () => {
    if (!resumeContentRef.current) return;
    
    if (!checkConfiguration()) {
      return;
    }

    try {
      const text = resumeContentRef.current.innerText;
      await checkGrammar(text);
    } catch (error) {
      toast.error(t("grammarCheck.errorToast"));
    }
  }, [resumeContentRef, checkConfiguration, checkGrammar, t]);

  const handleGoGitHub = () => {
    window.open(GITHUB_REPO_URL, "_blank");
  };

  const handleCopyResume = useCallback(() => {
    if (!activeResumeId) return;
    try {
      const newId = duplicateResume(activeResumeId);
      const targetPath = `/app/workbench/${newId}`;
      setActiveResume(newId);
      toast.success(t("copyResume.success"));
      router.push(targetPath);

      requestAnimationFrame(() => {
        if (window.location.pathname !== targetPath) {
          window.location.assign(targetPath);
        }
      });
    } catch (error) {
      toast.error(t("copyResume.error"));
    }
  }, [activeResumeId, duplicateResume, router, setActiveResume, t]);

  const isLoading = isExporting || isExportingJson;

  return (
    <>
      <div className="hidden md:block fixed top-1/2 right-3 transform -translate-y-1/2">
        <TooltipProvider delayDuration={0}>
          <Dock className="bg-background/80 border border-border/40 shadow-xl">
            <div className="flex flex-col gap-2">
              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex cursor-pointer h-7 w-7 items-center justify-center rounded-lg",
                        "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50"
                      )}
                    >
                      <TemplateSheet />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={10}>
                    <p>{t("switchTemplate")}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex cursor-pointer h-7 w-7 items-center justify-center rounded-lg",
                        "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50",
                        "transition-all duration-200",
                        isChecking && "animate-pulse"
                      )}
                      onClick={handleGrammarCheck}
                    >
                      <SpellCheck2
                        className={cn("h-4 w-4", isChecking && "animate-spin")}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={10}>
                    <p>
                      {isChecking
                        ? t("grammarCheck.checking")
                        : t("grammarCheck.idle")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
              <DockIcon>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <div
                          className={cn(
                            "flex cursor-pointer h-7 w-7 items-center justify-center rounded-lg",
                            "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50",
                            "transition-all duration-200",
                            isLoading && "animate-pulse"
                          )}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </div>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="left" sideOffset={10}>
                      <p>{t("export.tooltip")}</p>
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" side="left">
                    <DropdownMenuItem
                      onClick={handleExportPdf}
                      disabled={isLoading}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t("export.pdf")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handlePrint}
                      disabled={isLoading}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      {t("export.print")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleExportJson}
                      disabled={isLoading}
                    >
                      <FileJson className="w-4 h-4 mr-2" />
                      {t("export.json")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DockIcon>
              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex cursor-pointer h-7 w-7 items-center justify-center rounded-lg",
                        "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50"
                      )}
                      onClick={handleCopyResume}
                    >
                      <Copy className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={10}>
                    <p>{t("copyResume.tooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
              <div className="w-full h-[1px] bg-gray-200" />
              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleSidePanel}
                      className={cn(
                        "flex h-[30px] w-[30px] items-center justify-center rounded-sm transition-all",
                        "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50",
                        "active:scale-95",
                        !sidePanelCollapsed && [
                          "bg-primary text-primary-foreground",
                          "hover:bg-primary/90 dark:hover:bg-primary/90",
                          "shadow-sm"
                        ]
                      )}
                    >
                      {sidePanelCollapsed && <PanelRightClose size={20} />}
                      {!sidePanelCollapsed && <PanelRightOpen size={20} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={10}>
                    <p>
                      {sidePanelCollapsed
                        ? t("sidePanel.expand")
                        : t("sidePanel.collapse")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={toggleEditPanel}
                      className={cn(
                        "flex h-[30px] w-[30px] items-center justify-center rounded-sm transition-all",
                        "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50",
                        "active:scale-95",
                        !editPanelCollapsed && [
                          "bg-primary text-primary-foreground",
                          "hover:bg-primary/90 dark:hover:bg-primary/90",
                          "shadow-sm"
                        ]
                      )}
                    >
                      <Edit2 size={20} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={10}>
                    {editPanelCollapsed
                      ? t("editPanel.expand")
                      : t("editPanel.collapse")}
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={togglePreviewPanel}
                      className={cn(
                        "flex h-[30px] w-[30px] items-center justify-center rounded-sm transition-all",
                        "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50",
                        "active:scale-95",
                        !previewPanelCollapsed && [
                          "bg-primary text-primary-foreground",
                          "hover:bg-primary/90 dark:hover:bg-primary/90",
                          "shadow-sm"
                        ]
                      )}
                    >
                      <Eye size={20} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={10}>
                    {previewPanelCollapsed
                      ? t("previewPanel.expand")
                      : t("previewPanel.collapse")}
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
              <div className="w-full h-[1px] bg-gray-200" />

              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex cursor-pointer h-7 w-7 items-center justify-center rounded-lg",
                        "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50"
                      )}
                      onClick={() => router.push("/app/dashboard")}
                    >
                      <Home className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={10}>
                    <p>{t("backToDashboard")}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
              <DockIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleGoGitHub}
                      className={cn(
                        "flex h-[20px] w-[20px] items-center justify-center rounded-lg transition-all",
                        "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50",
                        "active:scale-95"
                      )}
                    >
                      <Icons.gitHub />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={10}>
                    <p>{t("github")}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
            </div>
          </Dock>
        </TooltipProvider>
      </div>
    </>
  );
};

export default PreviewDock;
