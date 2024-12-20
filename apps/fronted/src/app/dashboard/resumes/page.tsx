"use client";
import React, { useEffect } from "react";
import { Plus, FileText, Settings, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getConfig, getFileHandle, verifyPermission } from "@/utils/fileSystem";
import { useResumeStore } from "@/store/useResumeStore";

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
              <span className="text-green-600">已设置备份文件夹</span>
              <Button
                size="sm"
                className="ml-4 bg-green-500 hover:bg-green-600"
                onClick={() => {
                  router.push("/dashboard/settings");
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                去查看
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>注意</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>
                建议在设置里中配置简历历史文件夹，否则将无法备份和恢复数据,您的数据可能会在浏览器清除缓存后丢失
              </span>
              <Button
                variant="destructive"
                size="sm"
                className="ml-4"
                onClick={() => {
                  router.push("/dashboard/settings");
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                前往设置
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </motion.div>

      <motion.div
        className="h-[60px] border-b px-4 sm:px-6 flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-lg sm:text-xl font-semibold">我的简历</h1>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={handleCreateResume} size="sm" className="sm:size-md">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">新建简历</span>
            <span className="sm:hidden">新建</span>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        className="flex-1 w-full p-3 sm:p-6 overflow-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={handleCreateResume}
          >
            <Card className="relative border-dashed hover:border-primary/50 cursor-pointer h-[260px] sm:h-[300px] flex flex-col dark:bg-neutral-900">
              <CardContent className="flex-1 pt-6 text-center flex flex-col items-center justify-center">
                <motion.div
                  className="mb-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 dark:bg-primary/5 mx-auto flex items-center justify-center"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
                </motion.div>
                <CardTitle className="text-base sm:text-lg text-foreground dark:text-neutral-200">
                  创建新简历
                </CardTitle>
                <CardDescription className="mt-2 text-sm text-muted-foreground dark:text-neutral-400">
                  从头开始创建
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
                <Card className=" border-dashed hover:border-primary/50 cursor-pointer h-[260px] sm:h-[300px] flex flex-col dark:bg-neutral-900">
                  <CardContent className="group relative flex-1 pt-6 text-center flex flex-col items-center justify-center">
                    <motion.div
                      className="mb-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center"
                      whileHover={{ rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    </motion.div>
                    <CardTitle className="text-base sm:text-lg">
                      {resume.title || "未命名简历"}
                    </CardTitle>
                    <CardDescription className="mt-2 text-xs sm:text-sm">
                      {new Date(resume.createdAt).toLocaleDateString()}
                    </CardDescription>
                    <CardFooter className="absolute w-full bottom-2 pt-0 pb-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="outline"
                            className="w-full text-sm"
                            size="sm"
                            onClick={() => {
                              setActiveResume(id);
                              router.push(`/workbench/${id}`);
                            }}
                          >
                            编辑
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="outline"
                            className="w-full text-sm"
                            size="sm"
                            onClick={() => deleteResume(resume)}
                          >
                            删除
                          </Button>
                        </motion.div>
                      </div>
                    </CardFooter>
                  </CardContent>
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
