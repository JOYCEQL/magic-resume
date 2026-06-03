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
  Eye,
  FileText
} from "lucide-react";
import { RiMarkdownLine } from "@remixicon/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
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
import TemplateSheet from "@/components/shared/TemplateSheet";
import { PDF_EXPORT_CONFIG } from "@/config";
import { cn } from "@/lib/utils";
import { useGrammarCheck } from "@/hooks/useGrammarCheck";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { AI_MODEL_CONFIGS } from "@/config/ai";
import { useResumeStore } from "@/store/useResumeStore";
import { useAIConfiguration } from "@/hooks/useAIConfiguration";
import { FAQDialog } from "./FAQDialog";
import PdfExport from "@/components/shared/PdfExport";

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

const MagicThread = ({ height = 40 }: { height?: number }) => (
  <div className="relative flex flex-col items-center" style={{ height }}>
    {/* Base dashed line */}
    <div className="absolute inset-y-0 w-[1px] border-l border-dashed border-primary/30" />
    
    {/* Traveling pulse */}
    <motion.div
      className="absolute top-0 w-[1px] h-4 bg-gradient-to-b from-transparent via-primary to-transparent"
      animate={{
        top: ["0%", "100%"],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  </div>
);
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
  const { checkGrammar, isChecking } = useGrammarCheck();

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

  const { duplicateResume, setActiveResume, activeResumeId, activeResume, updateGlobalSettings } = useResumeStore();
  const { globalSettings = {} } = activeResume || {};

  const { checkConfiguration } = useAIConfiguration();

  // ... (keep other hooks)

  const handleGrammarCheck = useCallback(async () => {
    if (!checkConfiguration()) {
      return;
    }

    try {
      const previewContent =
        resumeContentRef.current || document.getElementById("resume-preview");
      if (!previewContent) {
        toast.error(t("grammarCheck.errorToast"));
        return;
      }

      const text = previewContent.innerText?.trim();
      if (!text) {
        toast.error(t("grammarCheck.errorToast"));
        return;
      }

      await checkGrammar(text);
    } catch (error) {
      toast.error(t("grammarCheck.errorToast"));
    }
  }, [resumeContentRef, checkConfiguration, checkGrammar, t]);

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

  return (
    <>
      <div className="hidden md:flex flex-col items-center fixed top-1/2 right-3 transform -translate-y-1/2 z-[50]">
        <TooltipProvider delayDuration={0}>
          <Dock className="bg-background/80 border border-border/40 shadow-xl mb-0">
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex cursor-pointer h-7 w-7 items-center justify-center rounded-lg",
                        "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50",
                        "transition-all duration-200",
                        globalSettings?.autoOnePage && [
                          "bg-primary text-primary-foreground",
                          "hover:bg-primary/90 dark:hover:bg-primary/90",
                          "shadow-sm"
                        ]
                      )}
                      onClick={() => {
                        updateGlobalSettings({ autoOnePage: !globalSettings?.autoOnePage });
                        toast.success(
                          globalSettings?.autoOnePage
                            ? t("autoOnePage.disabled")
                            : t("autoOnePage.enabled")
                        );
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={10}>
                    <p>{t("autoOnePage.tooltip")}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
              <DockIcon>
                <Tooltip>
                  <PdfExport>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          "flex cursor-pointer h-7 w-7 items-center justify-center rounded-lg",
                          "hover:bg-gray-100/50 dark:hover:bg-neutral-800/50",
                          "transition-all duration-200"
                        )}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                  </PdfExport>
                  <TooltipContent side="left" sideOffset={10}>
                    <p>{t("export.tooltip")}</p>
                  </TooltipContent>
                </Tooltip>
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
            </div>
          </Dock>
        </TooltipProvider>

        <MagicThread height={60} />
        
        <div className="w-[56px] flex justify-center">
          <FAQDialog />
        </div>
      </div>
    </>
  );
};

export default PreviewDock;
