"use client";
import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus, FileText, Settings, AlertCircle, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { getConfig, getFileHandle, verifyPermission } from "@/utils/fileSystem";
import { useResumeStore } from "@/store/useResumeStore";
import { initialResumeState } from "@/config/initialResumeData";

import { generateUUID } from "@/utils/uuid";
const ResumesList = () => {
  return <ResumeWorkbench />;
};

const ResumeWorkbench = () => {
  const t = useTranslations();
  const {
    resumes,
    setActiveResume,
    updateResume,
    updateResumeFromFile,
    addResume,
    deleteResume,
    createResume
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
          updatedAt: new Date().toISOString()
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 space-y-6"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={handleCreateResume}
          >
            <Card
              className={cn(
                "relative border border-dashed cursor-pointer h-[260px] transition-all duration-200",
                "hover:border-gray-400 hover:bg-gray-50",
                "dark:hover:border-primary dark:hover:bg-primary/10"
              )}
            >
              <CardContent className="flex-1 pt-6 text-center flex flex-col items-center justify-center">
                <motion.div
                  className="mb-4 p-4 rounded-full bg-gray-100 dark:bg-primary/10"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus className="h-8 w-8 text-gray-600 dark:text-primary" />
                </motion.div>
                <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
                  {t("dashboard.resumes.newResume")}
                </CardTitle>
                <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
                  {t("dashboard.resumes.newResumeDescription")}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence>
            {Object.entries(resumes).map(([id, resume], index) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    "group border transition-all duration-200 h-[260px] flex flex-col",
                    "hover:border-gray-400 hover:bg-gray-50",
                    "dark:hover:border-primary dark:hover:bg-primary/10"
                  )}
                >
                  <CardContent className="relative flex-1 pt-6 text-center flex flex-col items-center">
                    <motion.div
                      className="mb-4 p-4 rounded-full bg-gray-100 dark:bg-primary/10"
                      whileHover={{ rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FileText className="h-8 w-8 text-gray-600 dark:text-primary" />
                    </motion.div>
                    <CardTitle className="text-xl line-clamp-1 text-gray-900 dark:text-gray-100">
                      {resume.title || "未命名简历"}
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {t("dashboard.resumes.created")}
                      <span className="ml-2">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4 px-4">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 17
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
                          damping: 17
                        }}
                      >
                        <Button
                          variant="outline"
                          className="w-full text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteResume(resume);
                          }}
                        >
                          {t("common.delete")}
                        </Button>
                      </motion.div>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResumesList;
