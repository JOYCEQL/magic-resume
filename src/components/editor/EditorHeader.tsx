import { useEffect, useState } from "react";
import { useTranslations } from "@/i18n/compat/client";
import { AlertCircle, ShieldCheck, ShieldAlert, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "@/lib/navigation";
import { Input } from "@/components/ui/input";
import PdfExport from "../shared/PdfExport";
import ThemeToggle from "../shared/ThemeToggle";
import { useResumeStore } from "@/store/useResumeStore";
import { getThemeConfig } from "@/theme/themeConfig";
import { useGrammarCheck } from "@/hooks/useGrammarCheck";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { GrammarCheckDrawer } from "./grammar/GrammarCheckDrawer";
import { getFileHandle, getConfig } from "@/utils/fileSystem";

interface EditorHeaderProps {
  isMobile?: boolean;
}

export function EditorHeader({ isMobile }: EditorHeaderProps) {
  const { activeResume, setActiveSection, updateResumeTitle } =
    useResumeStore();
  const { menuSections = [], activeSection } = activeResume || {};
  const themeConfig = getThemeConfig();
  const { errors, selectError } = useGrammarCheck();
  const router = useRouter();
  const t = useTranslations();
  const visibleSections = menuSections
    ?.filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order);

  const [backupConfigured, setBackupConfigured] = useState<boolean | null>(null);
  const [backupPath, setBackupPath] = useState<string>("");

  useEffect(() => {
    const checkBackup = async () => {
      try {
        const handle = await getFileHandle("syncDirectory");
        const path = await getConfig("syncDirectoryPath");
        setBackupConfigured(!!handle);
        setBackupPath(path || "");
      } catch {
        setBackupConfigured(false);
      }
    };
    checkBackup();
  }, []);

  return (
    <motion.header
      className={`h-16 border-b sticky top-0 z-10`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
    >
      <div className="flex items-center justify-between px-6 h-full pr-2">
        <div className="flex items-center space-x-4 scrollbar-hide">
          <motion.div
            className="flex items-center space-x-2 shrink-0 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              router.push("/app/dashboard");
            }}
          >
            <span className="text-lg font-semibold">{t("common.title")}</span>
          </motion.div>

          <span className="text-muted-foreground/30 hidden md:inline-block font-light">/</span>

          <div className="relative hidden md:flex items-center group">
            <Input
              key={activeResume?.id || "resume-title"}
              defaultValue={activeResume?.title || ""}
              onBlur={(e) => {
                updateResumeTitle(e.target.value || "未命名简历");
              }}
              className="w-56 text-sm h-8 bg-muted/30 border-transparent hover:bg-muted/60 focus:bg-background transition-colors px-2.5 py-1 pr-8 shadow-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-border rounded-md font-medium text-foreground/90 hover:text-foreground"
              placeholder="简历名称"
            />
            <Edit2 className="w-3.5 h-3.5 absolute right-2.5 text-muted-foreground/40 pointer-events-none transition-colors group-hover:text-muted-foreground/80" />
          </div>

          {/* Backup Status Badge */}
          {backupConfigured !== null && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className={`
                      hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer
                      text-xs font-medium transition-colors ml-2
                      ${backupConfigured
                        ? "text-emerald-600/80 hover:bg-emerald-100/50 dark:text-emerald-500/80 dark:hover:bg-emerald-900/30"
                        : "text-amber-600/80 hover:bg-amber-100/50 dark:text-amber-500/80 dark:hover:bg-amber-900/30"
                      }
                    `}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    onClick={() => router.push("/app/dashboard/settings")}
                  >
                    {backupConfigured ? (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{t("previewDock.backup.configured")}</span>
                      </>
                    ) : (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="relative"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                        </motion.div>
                        <span>{t("previewDock.backup.notConfigured")}</span>
                      </>
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="max-w-[240px]">
                  {backupConfigured ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium">{t("previewDock.backup.configured")}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{backupPath}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium">{t("previewDock.backup.notConfigured")}</span>
                      <span className="text-[10px] text-muted-foreground">{t("previewDock.backup.clickToConfigure")}</span>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <GrammarCheckDrawer />
          {errors.length > 0 && (
             <div 
                className="flex items-center space-x-1 cursor-pointer animate-pulse"
                onClick={() => document.dispatchEvent(new CustomEvent('open-grammar-drawer'))}
             >
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500">
                    {t("grammarCheck.found_issues", { count: errors.length })}
                  </span>
             </div>
          )}

          <ThemeToggle></ThemeToggle>
          <div className="md:flex items-center ">
            <PdfExport />
          </div>
        </div>
      </div>
    </motion.header>
  );
}

