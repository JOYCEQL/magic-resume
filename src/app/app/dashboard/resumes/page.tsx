"use client";
import React, { useEffect } from "react";
import { useTranslations, useLocale } from "@/i18n/compat/client";
import { useRouter } from "@/lib/navigation";
import { Plus, FileText, Settings, AlertCircle, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { getConfig, getFileHandle, verifyPermission } from "@/utils/fileSystem";
import { useResumeStore } from "@/store/useResumeStore";
import { initialResumeState } from "@/config/initialResumeData";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ResumeTemplateComponent from "@/components/templates";
import { DEFAULT_TEMPLATES } from "@/config";

import { generateUUID } from "@/utils/uuid";

const ResumesList = () => {
  return <ResumeWorkbench />;
};

const ResumeCardItem = ({ id, resume, t, locale, setActiveResume, router, deleteResume, index }: any) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.24);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) {
        setScale(width / 793.700787); // Exact 210mm in pixels at 96dpi
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          "group border transition-all duration-200 aspect-[210/297] flex flex-col overflow-hidden",
          "hover:border-primary/40 hover:shadow-lg",
          "dark:hover:border-primary/40"
        )}
      >
        <CardContent className="p-0 flex-1 relative bg-gray-50 dark:bg-gray-900 overflow-hidden cursor-pointer" onClick={() => { setActiveResume(id); router.push(`/app/workbench/${id}`); }}>
          <div className="absolute inset-0 pb-6 flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover:scale-[1.02] overflow-hidden" ref={containerRef}>
            <div className="w-full h-full relative origin-top bg-white">
              <div
                className="absolute top-0 left-0 bg-white"
                style={{
                  width: "210mm",
                  height: "297mm",
                  transform: `scale(${scale})`, 
                  transformOrigin: "top left",
                  padding: `${resume.globalSettings?.pagePadding || 32}px`,
                  fontFamily: resume.globalSettings?.fontFamily || "Alibaba PuHuiTi, sans-serif",
                }}
              >
                {(() => {
                  const template = DEFAULT_TEMPLATES.find(t => t.id === resume.templateId) || DEFAULT_TEMPLATES[0];
                  return <ResumeTemplateComponent data={resume as any} template={template} />;
                })()}
              </div>
            </div>
          </div>
          
          <div className="absolute inset-x-0 bottom-0 top-[60%] pointer-events-none bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-950 dark:via-gray-950/90 z-0"></div>
          <div className="absolute inset-x-0 bottom-0 pt-12 pb-3 px-4 flex justify-between items-end border-t border-transparent z-10 transition-colors group-hover:bg-white/50 dark:group-hover:bg-gray-950/50">
            <div className="flex flex-col w-full">
              <span className="text-[15px] font-semibold truncate text-gray-900 dark:text-gray-100 drop-shadow-sm w-[90%]">
                {resume.title || t("dashboard.resumes.untitled")}
              </span>
              <span className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 font-medium">
                {t(`dashboard.templates.${DEFAULT_TEMPLATES.find(t => t.id === resume.templateId)?.id === "left-right" ? "leftRight" : (DEFAULT_TEMPLATES.find(t => t.id === resume.templateId)?.id || "classic")}.name`)} · {new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(resume.updatedAt || resume.createdAt))}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 pb-2 px-2 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 z-10">
          <div className="grid grid-cols-2 gap-2 w-full">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 17,
              }}
            >
              <Button
                variant="outline"
                className="w-full text-sm hover:bg-gray-100 dark:border-primary/50 dark:hover:bg-primary/10"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveResume(id);
                  router.push(`/app/workbench/${id}`);
                }}
              >
                {t("common.edit")}
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 17,
              }}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {t("common.delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("dashboard.resumes.deleteConfirmTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("dashboard.resumes.deleteConfirmDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 border-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteResume(resume);
                        toast.success(t("common.deleteSuccess"));
                      }}
                    >
                      {t("common.confirm")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const ResumeWorkbench = () => {
  const t = useTranslations();
  const locale = useLocale();
  const {
    resumes,
    setActiveResume,
    updateResume,
    updateResumeFromFile,
    addResume,
    deleteResume,
    createResume,
  } = useResumeStore();
  const router = useRouter();
  const [hasConfiguredFolder, setHasConfiguredFolder] = React.useState(false);

  useEffect(() => {
    const syncResumesFromFiles = async () => {
      try {
        const handle = await getFileHandle("syncDirectory");
        if (!handle) return;

        const hasPermission = await verifyPermission(handle);
        if (!hasPermission) return;

        const dirHandle = handle as FileSystemDirectoryHandle;

        for await (const entry of dirHandle.values()) {
          if (entry.kind === "file" && entry.name.endsWith(".json")) {
            try {
              const file = await entry.getFile();
              const content = await file.text();
              const resumeData = JSON.parse(content);
              updateResumeFromFile(resumeData);
            } catch (error) {
              console.error("Error reading resume file:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error syncing resumes from files:", error);
      }
    };

    if (Object.keys(resumes).length === 0) {
      syncResumesFromFiles();
    }
  }, [resumes, updateResume]);

  useEffect(() => {
    const loadSavedConfig = async () => {
      try {
        const handle = await getFileHandle("syncDirectory");
        const path = await getConfig("syncDirectoryPath");
        if (handle && path) {
          setHasConfiguredFolder(true);
        }
      } catch (error) {
        console.error("Error loading saved config:", error);
      }
    };

    loadSavedConfig();
  }, []);

  const handleCreateResume = () => {
    const newId = createResume(null);
    setActiveResume(newId);
  };

  const handleImportJson = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        const config = JSON.parse(content);

        const newResume = {
          ...initialResumeState,
          ...config,
          id: generateUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        addResume(newResume);
        toast.success(t("dashboard.resumes.importSuccess"));
      } catch (error) {
        console.error("Import error:", error);
        toast.error(t("dashboard.resumes.importError"));
      }
    };

    input.click();
  };

  return (
    <ScrollArea className="h-[calc(100vh-2rem)] w-full">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 space-y-6 py-8"
      >
      <motion.div
        className="flex w-full items-center justify-center px-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {hasConfiguredFolder ? (
          <Alert className="mb-6 bg-green-50/50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
            <AlertDescription className="flex items-center justify-between">
              <span className="text-green-700 dark:text-green-400">
                {t("dashboard.resumes.synced")}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="ml-4 hover:bg-green-100 dark:hover:bg-green-900"
                onClick={() => {
                  router.push("/app/dashboard/settings");
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                {t("dashboard.resumes.view")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50/50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("dashboard.resumes.notice.title")}</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-red-700 dark:text-red-400">
                {t("dashboard.resumes.notice.description")}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="ml-4 hover:bg-red-100 dark:hover:bg-red-900"
                onClick={() => {
                  router.push("/app/dashboard/settings");
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                {t("dashboard.resumes.notice.goToSettings")}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </motion.div>

      <motion.div
        className="px-4 sm:px-6 flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {t("dashboard.resumes.myResume")}
        </h1>
        <div className="flex items-center space-x-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              onClick={handleImportJson}
              variant="outline"
              className="hover:bg-gray-100 dark:border-primary/50 dark:hover:bg-primary/10"
            >
              <Upload className="mr-2 h-4 w-4" />
              {t("dashboard.resumes.import")}
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              onClick={handleCreateResume}
              variant="default"
              className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("dashboard.resumes.create")}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="flex-1 w-full p-3 sm:p-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={handleCreateResume}
          >
            <Card
              className={cn(
                "relative border border-dashed cursor-pointer transition-all duration-200 aspect-[210/297] flex flex-col",
                "hover:border-gray-400 hover:bg-gray-50",
                "dark:hover:border-primary dark:hover:bg-primary/10"
              )}
            >
              <CardContent className="flex-1 p-0 text-center flex flex-col items-center justify-center">
                <motion.div
                  className="mb-4 p-4 rounded-full bg-gray-100 dark:bg-primary/10"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus className="h-8 w-8 text-gray-600 dark:text-primary" />
                </motion.div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100 px-4">
                  {t("dashboard.resumes.newResume")}
                </CardTitle>
                <CardDescription className="mt-2 text-gray-600 dark:text-gray-400 px-4">
                  {t("dashboard.resumes.newResumeDescription")}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence>
            {Object.entries(resumes).map(([id, resume], index) => (
              <ResumeCardItem 
                key={id}
                id={id}
                resume={resume}
                t={t}
                locale={locale}
                setActiveResume={setActiveResume}
                router={router}
                deleteResume={deleteResume}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
    </ScrollArea>
  );
};
export const runtime = "edge";

export default ResumesList;
