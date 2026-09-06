import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "@/i18n/compat/client";
import { useRouter } from "@/lib/navigation";
import { Plus, Settings, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getConfig, getFileHandle } from "@/utils/fileSystem";
import { preloadFontFamily } from "@/utils/fonts";
import { useResumeStore } from "@/store/useResumeStore";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { DEFAULT_TEMPLATES } from "@/config";
import { CreateResumeModal } from "./CreateResumeModal";
import { ImportResumeDialog } from "./ImportResumeDialog";
import { ResumeCardItem } from "./ResumeCardItem";
import { AnimatedImportButton } from "./AnimatedImportButton";
import {
    createResumeFromAIResult,
    toStringArray
} from "./utils";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

import { MAX_PDF_IMPORT_PAGES, MAX_PDF_FILE_BYTES, MAX_PDF_REQUEST_BYTES, isPdfImportConfigured } from "@/config/pdf-import";
import { getTaskModel, toAIConnection } from "@/config/ai-models";
import { requestPdfImport, pdfImportErrorMessage } from "@/lib/pdf-import-client";
import { ResumeImportError } from "@/lib/resume-import-schema";
import { PdfImportPreview } from "./PdfImportPreview";
const PDF_IMAGE_QUALITY = 0.82;
const PDF_MAX_IMAGE_WIDTH = 1600;

export const ResumeWorkbench = () => {
    const t = useTranslations();
    const locale = useLocale();
    const {
        resumes,
        setActiveResume,
        addResume,
        deleteResume,
        createResume,
    } = useResumeStore();
    const aiConfig = useAIConfigStore();
    const pdfConnection = getTaskModel(aiConfig, "pdf");
    const [pendingPdfResume, setPendingPdfResume] = useState<ReturnType<typeof createResumeFromAIResult> | null>(null);
    const router = useRouter();
    const [hasConfiguredFolder, setHasConfiguredFolder] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const jsonFileInputRef = useRef<HTMLInputElement>(null);
    const pdfFileInputRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => {
        const fontFamilies = Array.from(
            new Set(
                Object.values(resumes)
                    .map((resume) => resume.globalSettings?.fontFamily)
                    .filter(Boolean)
            )
        );

        if (fontFamilies.length === 0) return;

        let cancelled = false;
        const warmFonts = () => {
            if (cancelled) return;
            fontFamilies.forEach((fontFamily) => {
                preloadFontFamily(fontFamily).catch((error) => {
                    console.warn("Failed to preload resume font:", error);
                });
            });
        };

        const supportsIdleCallback =
            typeof window !== "undefined" &&
            typeof window.requestIdleCallback === "function";
        const idleCallback = supportsIdleCallback
            ? window.requestIdleCallback(warmFonts, { timeout: 2500 })
            : globalThis.setTimeout(warmFonts, 1000);

        return () => {
            cancelled = true;
            if (
                supportsIdleCallback &&
                typeof window !== "undefined" &&
                typeof window.cancelIdleCallback === "function"
            ) {
                window.cancelIdleCallback(idleCallback as number);
            } else {
                globalThis.clearTimeout(idleCallback);
            }
        };
    }, [resumes]);

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
        router.push({ to: "/app/workbench/$id", params: { id: newId } });
    };

    const duplicateResume = async (resume: any) => {
        const { generateUUID } = await import("@/utils/uuid");
        const now = new Date().toISOString();
        
        const { id, ...rest } = resume;
        const newResume = {
            ...rest,
            id: generateUUID(),
            title: `${resume.title || t("dashboard.resumes.untitled")} - ${t("common.copy")}`,
            createdAt: now,
            updatedAt: now,
        };
        
        const resumeId = addResume(newResume);
        toast.success(t("previewDock.copyResume.success"));
    };

    const importResumeFromJson = async (file: File) => {
        const content = await file.text();
        const config = JSON.parse(content);
        const now = new Date().toISOString();
        const { generateUUID } = await import("@/utils/uuid");
        const { initialResumeState } = await import("@/config/initialResumeData");

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
        router.push({ to: "/app/workbench/$id", params: { id: resumeId } });
    };

    const extractImagesFromPdf = async (file: File) => {
        if (file.size > MAX_PDF_FILE_BYTES) throw new ResumeImportError("fileTooLarge");
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
        // Password-protected files must fail instead of waiting for an absent password UI.
        loadingTask.onPassword = () => { void loadingTask.destroy(); };
        try {
            const pdf = await loadingTask.promise;
            if (pdf.numPages > MAX_PDF_IMPORT_PAGES) throw new ResumeImportError("tooManyPages");
            const images: string[] = [];
            let imageBytes = 0;
            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
                const page = await pdf.getPage(pageNumber);
                const base = page.getViewport({ scale: 2 });
                const scale = Math.min(1, PDF_MAX_IMAGE_WIDTH / base.width, 3000 / base.height);
                const viewport = page.getViewport({ scale: 2 * scale });
                const canvas = document.createElement("canvas");
                try {
                    const context = canvas.getContext("2d", { alpha: false });
                    if (!context) throw new ResumeImportError("invalidPdf");
                    canvas.width = Math.max(1, Math.floor(viewport.width));
                    canvas.height = Math.max(1, Math.floor(viewport.height));
                    await page.render({ canvas, canvasContext: context, viewport }).promise;
                    const image = canvas.toDataURL("image/jpeg", PDF_IMAGE_QUALITY);
                    imageBytes += image.length;
                    if (imageBytes > MAX_PDF_REQUEST_BYTES) throw new ResumeImportError("requestTooLarge");
                    images.push(image);
                } finally {
                    canvas.width = 0;
                    canvas.height = 0;
                    page.cleanup();
                }
            }
            return images;
        } finally { await loadingTask.destroy(); }
    };

    const importResumeFromPdf = async (file: File) => {
        if (!isPdfImportConfigured(pdfConnection)) {
            toast.error(t("dashboard.resumes.importDialog.configRequired"));
            router.push("/app/dashboard/ai");
            return;
        }
        const images = await extractImagesFromPdf(file);
        const data = await requestPdfImport(toAIConnection(pdfConnection), images);
        if (!data.resume) throw new ResumeImportError("invalidOutput");
        const nameWithoutExt = file.name.replace(/\.[^.]+$/, "").trim();
        setPendingPdfResume(createResumeFromAIResult(data.resume, nameWithoutExt));
        setIsImportDialogOpen(false);
        if (data.warnings?.includes("missingName")) toast.warning(t("dashboard.resumes.importDialog.missingName"));
    };

    const confirmPdfImport = () => {
        if (!pendingPdfResume) return;
        const resumeId = addResume(pendingPdfResume);
        setActiveResume(resumeId);
        setPendingPdfResume(null);
        toast.success(t("dashboard.resumes.importDialog.pdfSuccess"));
        router.push({ to: "/app/workbench/$id", params: { id: resumeId } });
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
            toast.error(pdfImportErrorMessage(error, t));
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
                            {Object.entries(resumes)
                                .sort(([, a], [, b]) => {
                                    const dateA = new Date(a.createdAt || 0).getTime();
                                    const dateB = new Date(b.createdAt || 0).getTime();
                                    return dateB - dateA;
                                })
                                .map(([id, resume], index) => (
                                    <ResumeCardItem
                                        key={id}
                                        id={id}
                                        resume={resume}
                                        t={t}
                                        locale={locale}
                                        router={router}
                                        deleteResume={deleteResume}
                                        duplicateResume={duplicateResume}
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

                <PdfImportPreview resume={pendingPdfResume} onCancel={() => setPendingPdfResume(null)} onConfirm={confirmPdfImport} />
                <ImportResumeDialog
                    modelLabel={pdfConnection?.model || t("common.notConfigured")}
                    onConfigure={() => router.push("/app/dashboard/ai")}
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
