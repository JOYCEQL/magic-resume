import React, { useEffect } from "react";
import { useTranslations, useLocale } from "@/i18n/compat/client";
import { useRouter } from "@/lib/navigation";
import { Plus, Settings, AlertCircle, Upload, Braces } from "lucide-react";
import { PdfIcon } from "@/components/shared/icons/PdfIcon";
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
import { CreateResumeModal } from "./CreateResumeModal";
import { ImportResumeDialog } from "./ImportResumeDialog";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

const MAX_PDF_IMPORT_PAGES = 3;
const PDF_IMAGE_QUALITY = 0.82;
const PDF_MAX_IMAGE_WIDTH = 1600;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const toString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const toStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => toString(item))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
      .filter(Boolean);
  }

  return [] as string[];
};

const toListHtml = (value: unknown) => {
  const items = toStringArray(value);
  if (items.length === 0) return "";
  return `<ul class="custom-list">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
};

const extractJsonContent = (content: string) => {
  const direct = content.trim();
  try {
    return JSON.parse(direct);
  } catch (error) { }

  const fencedMatch = direct.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch (error) { }
  }

  const objectMatch = direct.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch (error) { }
  }

  throw new Error("Invalid AI JSON content");
};

const createResumeFromAIResult = (result: any, fileName: string) => {
  const now = new Date().toISOString();
  const id = generateUUID();

  const education = Array.isArray(result?.education) ? result.education : [];
  const experience = Array.isArray(result?.experience) ? result.experience : [];
  const projects = Array.isArray(result?.projects) ? result.projects : [];

  const skillSource = result?.skillContent ?? result?.skills;
  const skillContent = toListHtml(skillSource);

  return {
    ...initialResumeState,
    id,
    title: toString(result?.title) || fileName || `Imported Resume ${id.slice(0, 6)}`,
    createdAt: now,
    updatedAt: now,
    templateId: DEFAULT_TEMPLATES[0]?.id,
    basic: {
      ...initialResumeState.basic,
      name: toString(result?.basic?.name),
      title: toString(result?.basic?.title),
      email: toString(result?.basic?.email),
      phone: toString(result?.basic?.phone),
      location: toString(result?.basic?.location),
      employementStatus: toString(result?.basic?.employementStatus),
      birthDate: toString(result?.basic?.birthDate),
      customFields: [],
      photo: "",
      githubKey: "",
      githubUseName: "",
      githubContributionsVisible: false,
    },
    education: education
      .map((item: any) => ({
        id: generateUUID(),
        school: toString(item?.school),
        major: toString(item?.major),
        degree: toString(item?.degree),
        startDate: toString(item?.startDate),
        endDate: toString(item?.endDate),
        gpa: toString(item?.gpa),
        description: toListHtml(item?.description),
        visible: true,
      }))
      .filter((item: any) => item.school || item.major || item.degree),
    experience: experience
      .map((item: any) => ({
        id: generateUUID(),
        company: toString(item?.company),
        position: toString(item?.position),
        date: toString(item?.date),
        details: toListHtml(item?.details || item?.description),
        visible: true,
      }))
      .filter((item: any) => item.company || item.position || item.date || item.details),
    projects: projects
      .map((item: any) => ({
        id: generateUUID(),
        name: toString(item?.name),
        role: toString(item?.role),
        date: toString(item?.date),
        description: toListHtml(item?.description || item?.details),
        link: toString(item?.link),
        visible: true,
      }))
      .filter((item: any) => item.name || item.role || item.date || item.description),
    skillContent,
    customData: {},
  };
};

const ResumesList = () => {
  return <ResumeWorkbench />;
};

const ResumeCardItem = ({ id, resume, t, locale, setActiveResume, router, deleteResume, index }: any) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.24);
  const activeTemplate =
    DEFAULT_TEMPLATES.find((template) => template.id === resume.templateId) ??
    DEFAULT_TEMPLATES[0];
  const templateNameKey =
    activeTemplate.id === "left-right" ? "leftRight" : activeTemplate.id;

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
        <CardContent className="p-0 flex-1 relative bg-gray-50 dark:bg-gray-900 overflow-hidden cursor-pointer">
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
                <ResumeTemplateComponent data={resume as any} template={activeTemplate} />
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
                {t(`dashboard.templates.${templateNameKey}.name`)} · {new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(resume.updatedAt || resume.createdAt))}
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

const AnimatedImportButton = ({ onClick, t }: { onClick: () => void; t: any }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        onClick={onClick}
        variant="outline"
        className={cn(
          "relative h-10 overflow-hidden px-4 font-medium transition-all duration-300",
          "border-border/60 bg-background hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm",
          "dark:border-border/40 dark:hover:border-primary/40"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="relative h-5 w-5 overflow-hidden">
            <motion.div
              animate={{
                y: isHovered ? -20 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className="flex flex-col"
            >
              <div className="flex h-5 w-5 items-center justify-center">
                <Braces className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex h-5 w-5 items-center justify-center">
                <PdfIcon className="h-4 w-4 text-red-500" />
              </div>
            </motion.div>
          </div>
          <span className="relative z-10">{t("dashboard.resumes.import")}</span>
        </div>
      </Button>
    </motion.div>
  );
};

const ResumeWorkbench = () => {
  const t = useTranslations();
  const locale = useLocale();
  const {
    resumes,
    setActiveResume,
    updateResumeFromFile,
    addResume,
    deleteResume,
    createResume,
  } = useResumeStore();
  const {
    geminiApiKey,
    geminiModelId,
  } = useAIConfigStore();
  const router = useRouter();
  const [hasConfiguredFolder, setHasConfiguredFolder] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const jsonFileInputRef = React.useRef<HTMLInputElement>(null);
  const pdfFileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncResumesFromFiles = async () => {
      try {
        const handle = await getFileHandle("syncDirectory");
        if (!handle) return;

        const hasPermission = await verifyPermission(handle);
        if (!hasPermission) return;

        const dirHandle = handle as FileSystemDirectoryHandle;

        for await (const entry of (dirHandle as any).values()) {
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
  }, [resumes, updateResumeFromFile]);

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

  const handleCreateFromModal = (templateId: string | null) => {
    const isBlank = !templateId;
    const newId = createResume(templateId, isBlank);

    if (templateId) {
      const template = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        const { resumes, updateResume } = useResumeStore.getState();
        const resume = resumes[newId];
        if (resume) {
          updateResume(newId, {
            globalSettings: {
              ...resume.globalSettings,
              themeColor: template.colorScheme.primary,
              sectionSpacing: template.spacing.sectionGap,
              paragraphSpacing: template.spacing.itemGap,
              pagePadding: template.spacing.contentPadding,
            },
            basic: {
              ...resume.basic,
              layout: template.basic.layout,
            },
          });
        }
      }
    }

    setIsCreateModalOpen(false);
    setActiveResume(newId);
    router.push(`/app/workbench/${newId}`);
  };
  const importResumeFromJson = async (file: File) => {
    const content = await file.text();
    const config = JSON.parse(content);
    const now = new Date().toISOString();
    const newResume = {
      ...initialResumeState,
      ...config,
      id: generateUUID(),
      createdAt: now,
      updatedAt: now,
    };
    const resumeId = addResume(newResume);
    setActiveResume(resumeId);
    setIsImportDialogOpen(false);
    toast.success(t("dashboard.resumes.importSuccess"));
    router.push(`/app/workbench/${resumeId}`);
  };

  const extractImagesFromPdf = async (file: File) => {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const buffer = await file.arrayBuffer();
    const typedPdfjs = pdfjs as any;

    typedPdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

    const loadingTask = typedPdfjs.getDocument({
      data: new Uint8Array(buffer),
    });
    const pdf = await loadingTask.promise;
    const pageImages: string[] = [];
    const totalPages = Math.min(pdf.numPages, MAX_PDF_IMPORT_PAGES);

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 2 });
      const widthScale = Math.min(1, PDF_MAX_IMAGE_WIDTH / baseViewport.width);
      const viewport = page.getViewport({ scale: 2 * widthScale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { alpha: false });

      if (!context) {
        throw new Error("Unable to create canvas context");
      }

      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const imageDataUrl = canvas.toDataURL("image/jpeg", PDF_IMAGE_QUALITY);
      pageImages.push(imageDataUrl);

      canvas.width = 0;
      canvas.height = 0;
    }

    return pageImages;
  };

  const importResumeFromPdf = async (file: File) => {
    if (!geminiApiKey || !geminiModelId) {
      toast.error(t("dashboard.resumes.importDialog.geminiConfigRequired"));
      router.push("/app/dashboard/ai");
      return;
    }

    const pdfImages = await extractImagesFromPdf(file);
    if (pdfImages.length === 0) {
      throw new Error("No extractable PDF pages");
    }

    const response = await fetch("/api/resume-import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: pdfImages,
        apiKey: geminiApiKey,
        model: geminiModelId,
        locale,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.details
        ? `${data?.error || "Resume import failed"}\n${data.details}`
        : data?.error || "Resume import failed";
      throw new Error(message);
    }

    const aiResume = data?.resume
      ? data.resume
      : data?.choices?.[0]?.message?.content
        ? extractJsonContent(data.choices[0].message.content)
        : null;

    if (!aiResume) {
      throw new Error("Invalid AI response");
    }

    const nameWithoutExt = file.name.replace(/\.[^.]+$/, "").trim();
    const resume = createResumeFromAIResult(aiResume, nameWithoutExt);
    const resumeId = addResume(resume);
    setActiveResume(resumeId);
    setIsImportDialogOpen(false);
    toast.success(t("dashboard.resumes.importDialog.pdfSuccess"));
    router.push(`/app/workbench/${resumeId}`);
  };

  const handleJsonFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isImporting) return;

    try {
      setIsImporting(true);
      await importResumeFromJson(file);
    } catch (error) {
      console.error("Import JSON error:", error);
      toast.error(t("dashboard.resumes.importError"));
    } finally {
      setIsImporting(false);
    }
  };

  const handlePdfFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isImporting) return;

    try {
      setIsImporting(true);
      await importResumeFromPdf(file);
    } catch (error) {
      console.error("Import PDF error:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : t("dashboard.resumes.importDialog.pdfError");
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
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
            <AnimatedImportButton onClick={() => setIsImportDialogOpen(true)} t={t} />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                onClick={() => setIsCreateModalOpen(true)}
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
              onClick={() => setIsCreateModalOpen(true)}
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

        <CreateResumeModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onCreate={handleCreateFromModal}
        />

        <ImportResumeDialog
          open={isImportDialogOpen}
          isImporting={isImporting}
          onOpenChange={setIsImportDialogOpen}
          jsonFileInputRef={jsonFileInputRef}
          pdfFileInputRef={pdfFileInputRef}
          onJsonFileChange={handleJsonFileChange}
          onPdfFileChange={handlePdfFileChange}
        />
      </motion.div>
    </ScrollArea>
  );
};
export const runtime = "edge";

export default ResumesList;
