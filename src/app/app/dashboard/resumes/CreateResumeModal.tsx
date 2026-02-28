import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "@/i18n/compat/client";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEFAULT_TEMPLATES } from "@/config";
import { initialResumeState } from "@/config/initialResumeData";
import ResumeTemplateComponent from "@/components/templates";
import type { Translator } from "@/i18n/compat/utils";
import type { ResumeData } from "@/types/resume";
import type { ResumeTemplate } from "@/types/template";
import { ChevronLeft, FilePlus, Sparkles, X } from "lucide-react";

interface CreateResumeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (templateId: string | null) => void;
}

const A4_WIDTH_PX = 793.700787;
const A4_HEIGHT_PX = 1122.519685;

type BlankTemplate = {
    id: null;
    isBlank: true;
    nameKey: "blankTitle";
};

type NormalTemplate = ResumeTemplate & { isBlank: false; nameKey: string };
type TemplateOption = NormalTemplate | BlankTemplate;

const toTemplateNameKey = (templateId: string) =>
    templateId === "left-right" ? "leftRight" : templateId;

const BLANK_TEMPLATE: BlankTemplate = { id: null, isBlank: true, nameKey: "blankTitle" };
const NORMAL_TEMPLATES: NormalTemplate[] = DEFAULT_TEMPLATES.map((template) => ({
    ...template,
    isBlank: false,
    nameKey: toTemplateNameKey(template.id),
}));

const TemplateThumbnail = ({
    template,
    t,
    scaleModifier = 1,
    quality = "low" // low for grid, high for preview
}: {
    template: TemplateOption,
    t: Translator,
    scaleModifier?: number,
    quality?: "low" | "high"
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.2);

    useEffect(() => {
        if (!containerRef.current || template.isBlank) return;
        const observer = new ResizeObserver((entries) => {
            const { width } = entries[0].contentRect;
            if (width > 0) {
                setScale((width / A4_WIDTH_PX) * scaleModifier); // Exact 210mm in pixels at 96dpi
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [template.isBlank, scaleModifier]);

    if (template.isBlank) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-6 text-gray-400 group-hover:text-primary transition-colors">
                    <FilePlus className="w-12 h-12" />
                </div>
                <span className="text-2xl font-bold text-gray-700 dark:text-gray-200 group-hover:text-primary transition-colors">
                    {t("dashboard.resumes.createDialog.blankTitle")}
                </span>
                <p className="text-gray-500 mt-4 text-base px-8 text-center leading-relaxed">
                    {t("dashboard.resumes.createDialog.blankThumbnailDescription")}
                </p>
            </div>
        );
    }

    const sampleExperience = quality === "high"
        ? [
            {
                id: "1",
                company: t("dashboard.resumes.createDialog.sample.company"),
                position: t("dashboard.resumes.createDialog.sample.position"),
                date: `2020-01 - ${t("dashboard.resumes.createDialog.sample.present")}`,
                details: t("dashboard.resumes.createDialog.sample.workDescription"),
                visible: true,
            },
        ]
        : [];

    const previewData: ResumeData = {
        ...initialResumeState,
        id: "preview-mock",
        templateId: template.id,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
        globalSettings: {
            ...initialResumeState.globalSettings,
            themeColor: template.colorScheme?.primary || "#000",
            sectionSpacing: template.spacing?.sectionGap || 16,
            paragraphSpacing: template.spacing?.itemGap || 8,
            pagePadding: template.spacing?.contentPadding || 32,
        },
        basic: {
            ...initialResumeState.basic,
            layout: template.basic?.layout || "classic",
        },
        // Feed richer mock content in large preview.
        experience: sampleExperience,
    };

    return (
        <div className="w-full h-full overflow-hidden bg-white flex items-center justify-center" ref={containerRef}>
            {/* Wrapper to hold the exact scaled dimensions so flexbox layout is preserved without absolute positioning */}
            <div
                style={{
                    width: scale * A4_WIDTH_PX,
                    height: scale * A4_HEIGHT_PX
                }}
                className="flex-shrink-0"
            >
                <div
                    className="bg-white origin-top-left pointer-events-none"
                    style={{
                        width: "210mm",
                        height: "297mm",
                        transform: `scale(${scale})`,
                        padding: `${template.spacing?.contentPadding || 32}px`,
                        fontFamily: "Alibaba PuHuiTi, sans-serif",
                    }}
                >
                    <ResumeTemplateComponent
                        data={previewData}
                        template={template}
                    />
                </div>
            </div>
        </div>
    );
};

export const CreateResumeModal = ({
    open,
    onOpenChange,
    onCreate,
}: CreateResumeModalProps) => {
    const t = useTranslations();
    const [previewTarget, setPreviewTarget] = useState<TemplateOption | null>(null);

    const handleCreate = (template: TemplateOption) => {
        onCreate(template.id);
        setPreviewTarget(null);
    };

    // Close preview when dialog closes
    useEffect(() => {
        if (!open) {
            const timeoutId = window.setTimeout(() => setPreviewTarget(null), 300);
            return () => window.clearTimeout(timeoutId);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideClose className="max-w-[1100px] w-[95vw] h-[90vh] sm:h-[85vh] p-0 overflow-hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-white/20 dark:border-white/10 shadow-2xl rounded-[2rem] flex flex-col">
                {/* We keep an empty DialogTitle to satisfy accessibility requirements without taking up space */}
                <DialogTitle className="sr-only">{t("dashboard.resumes.createDialog.title")}</DialogTitle>

                <div className="relative w-full h-full min-h-0 flex flex-col">
                    {/* HEADER BAR */}
                    <div className="flex-none px-8 py-6 flex items-center justify-between z-10">
                        <div className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 flex items-center">
                            {t("dashboard.resumes.createDialog.title")}
                        </div>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            aria-label={t("common.cancel")}
                            className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 relative w-full">
                        <ScrollArea className="h-full w-full">
                            <div className="px-8 pb-12 max-w-7xl mx-auto space-y-12">
                                {/* SECTION 1: BLANK TEMPLATE */}
                                <section>
                                    <div className="flex items-center mb-6">
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {t("dashboard.resumes.createDialog.startFromBlank")}
                                        </h4>
                                        <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1 ml-6" />
                                    </div>
                                    <motion.div
                                        layoutId={`card-container-blank`}
                                        whileHover={{ y: -4, scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => handleCreate(BLANK_TEMPLATE)}
                                        className="group cursor-pointer rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm bg-gray-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-900 hover:shadow-xl hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 p-6 flex flex-col sm:flex-row items-center gap-6"
                                    >
                                        {/* Small visual icon area */}
                                        <motion.div
                                            layoutId={`card-image-blank`}
                                            className="h-28 w-28 sm:h-32 sm:w-32 flex-shrink-0 rounded-2xl bg-white dark:bg-gray-800 shadow-inner flex items-center justify-center border border-gray-100 dark:border-gray-700"
                                        >
                                            <FilePlus className="w-10 h-10 text-gray-400 group-hover:text-primary transition-colors" />
                                        </motion.div>

                                        <div className="flex-1 text-center sm:text-left">
                                            <motion.div layoutId={`card-title-blank`} className="inline-block">
                                                <h5 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                                                    {t("dashboard.resumes.createDialog.blankTitle")}
                                                </h5>
                                            </motion.div>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-lg leading-relaxed">
                                                {t("dashboard.resumes.createDialog.blankCardDescription")}
                                            </p>
                                        </div>

                                        <div className="hidden sm:flex text-primary font-medium items-center text-sm   group-hover:translate-x-0 duration-300">
                                            {t("dashboard.resumes.createDialog.createNow")} <ChevronLeft className="w-4 h-4 ml-1 rotate-180" />
                                        </div>
                                    </motion.div>
                                </section>

                                {/* SECTION 2: NORMAL TEMPLATES */}
                                <section>
                                    <div className="flex items-center mb-6">
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {t("dashboard.resumes.createDialog.startFromTemplate")}
                                        </h4>
                                        <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1 ml-6" />
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 hover:!shadow-none">
                                        {NORMAL_TEMPLATES.map((template) => {
                                            const templateName = t(`dashboard.templates.${template.nameKey}.name`);

                                            return (
                                                <motion.div
                                                    key={template.id}
                                                    layoutId={`card-container-${template.id}`}
                                                    whileHover={{ y: 0, scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setPreviewTarget(template)}
                                                    className="group cursor-pointer flex flex-col"
                                                >
                                                    {/* The Thumbnail Card */}
                                                    <motion.div
                                                        layoutId={`card-image-${template.id}`}
                                                        className="aspect-[210/297] rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-800/60 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/50 dark:group-hover:border-primary/50 bg-white dark:bg-gray-900 relative"
                                                    >
                                                        <TemplateThumbnail template={template} t={t} quality="low" />
                                                        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 rounded-2xl pointer-events-none" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    </motion.div>

                                                    {/* Minimalist Title below */}
                                                    <motion.div
                                                        layoutId={`card-title-${template.id}`}
                                                        className="mt-4 flex items-center justify-center"
                                                    >
                                                        <span className="text-[15px] font-semibold text-gray-700 dark:text-gray-200 group-hover:text-primary transition-colors">
                                                            {templateName}
                                                        </span>
                                                    </motion.div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </section>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* OVERLAY LARGE PREVIEW (Shared Layout Animation) */}
                    <AnimatePresence>
                        {previewTarget && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="fixed inset-0 z-50 bg-white dark:bg-gray-950 flex flex-col sm:flex-row overflow-hidden rounded-[2rem]"
                            >
                                {/* Left: Huge Preview Area */}
                                <div className="flex-1 relative bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center p-8 sm:p-12 h-full overflow-hidden">
                                    <div className="p-6 flex justify-start w-full absolute top-0 left-0 z-20">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewTarget(null)}
                                            className="rounded-full p-2 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
                                            aria-label={t("dashboard.resumes.createDialog.backToGrid")}
                                        >
                                            <ChevronLeft className="w-5 h-5 text-gray-500 hover:text-primary dark:text-gray-400" />
                                        </button>
                                    </div>

                                    <motion.div
                                        layoutId={`card-container-${previewTarget.id || 'blank'}`}
                                        className="w-full flex-1 flex flex-col items-center justify-center p-2 min-h-0"
                                    >
                                        <motion.div
                                            layoutId={`card-image-${previewTarget.id || 'blank'}`}
                                            className="aspect-[210/297] rounded-xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/10 bg-white"
                                            style={{
                                                maxHeight: "100%",
                                                maxWidth: "100%",
                                                height: "100%",
                                                width: "auto"
                                            }}
                                        >
                                            <TemplateThumbnail template={previewTarget} t={t} quality="high" scaleModifier={1} />
                                        </motion.div>
                                    </motion.div>
                                </div>

                                {/* Right: Info Sidebar */}
                                <div className="w-full sm:w-[400px] bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-gray-800 flex flex-col h-full shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] relative z-10">
                                    <div className="flex-1 p-10 flex flex-col justify-center">
                                        <motion.div
                                            layoutId={`card-title-${previewTarget.id || 'blank'}`}
                                            className="inline-block"
                                        >
                                            <h3 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
                                                {previewTarget.isBlank
                                                    ? t("dashboard.resumes.createDialog.blankTitle")
                                                    : t(`dashboard.templates.${previewTarget.nameKey}.name`)}
                                            </h3>
                                        </motion.div>

                                        <div className="w-12 h-1.5 bg-primary rounded-full mb-6" />

                                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-10 font-medium">
                                            {previewTarget.isBlank
                                                ? t("dashboard.resumes.createDialog.blankPreviewDescription")
                                                : t(`dashboard.templates.${previewTarget.nameKey}.description`)}
                                        </p>

                                        <div className="space-y-4">
                                            <Button
                                                size="lg"
                                                className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                onClick={() => handleCreate(previewTarget)}
                                            >
                                                {t("dashboard.resumes.createDialog.useThisTemplate")}
                                                <Sparkles className="w-5 h-5 ml-2 opacity-70" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
};
