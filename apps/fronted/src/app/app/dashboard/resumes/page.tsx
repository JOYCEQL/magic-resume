"use client";
import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus, FileText, Settings, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getConfig, getFileHandle, verifyPermission } from "@/utils/fileSystem";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";

const ResumesList = () => {
  return <ResumeWorkbench />;
};

const ResumeWorkbench = () => {
  const {
    resumes,
    createResume,
    deleteResume,
    setActiveResume,
    updateResume,
    updateResumeFromFile,
  } = useResumeStore();
  const router = useRouter();
  const [hasConfiguredFolder, setHasConfiguredFolder] = React.useState(false);
  const t = useTranslations();

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
          <Alert className="mb-6" variant="default">
            <AlertDescription className="flex items-center justify-between">
              <span className="text-green-600">
                {t("dashboard.resumes.synced")}
              </span>
              <Button
                size="sm"
                className="ml-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
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
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("dashboard.resumes.notice.title")}</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{t("dashboard.resumes.notice.description")}</span>
              <Button
                variant="destructive"
                size="sm"
                className="ml-4"
                onClick={() => {
                  router.push("/dashboard/settings");
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
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
          {t("dashboard.resumes.myResume")}
        </h1>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleCreateResume}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("dashboard.resumes.create")}
          </Button>
        </motion.div>
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
                "relative border-2 border-dashed cursor-pointer h-[260px] transition-all duration-200",
                "hover:border-indigo-500/20 hover:shadow-lg dark:bg-neutral-900"
              )}
            >
              <CardContent className="flex-1 pt-6 text-center flex flex-col items-center justify-center">
                <motion.div
                  className="mb-4 p-4 rounded-full bg-indigo-50 dark:bg-indigo-950"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus className="h-8 w-8 text-indigo-500" />
                </motion.div>
                <CardTitle className="text-xl">
                  {t("dashboard.resumes.newResume")}
                </CardTitle>
                <CardDescription className="mt-2">
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
                  delay: index * 0.1,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    "group border-2 transition-all duration-200 h-[260px] flex flex-col",
                    "hover:border-purple-500/20 hover:shadow-lg dark:bg-neutral-900"
                  )}
                >
                  <CardContent className="relative flex-1 pt-6 text-center flex flex-col items-center">
                    <motion.div
                      className="mb-4 p-4 rounded-full bg-purple-50 dark:bg-purple-950"
                      whileHover={{ rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FileText className="h-8 w-8 text-purple-500" />
                    </motion.div>
                    <CardTitle className="text-xl line-clamp-1">
                      {resume.title || "未命名简历"}
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm">
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
                      >
                        <Button
                          variant="outline"
                          className="w-full text-sm hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950"
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
                      >
                        <Button
                          variant="outline"
                          className="w-full text-sm hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
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
