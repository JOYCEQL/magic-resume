import React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { normalizeFontFamily } from "@/utils/fonts";
import { Edit2, Copy, Trash2 } from "lucide-react";

interface ResumeCardItemProps {
    id: string;
    resume: any;
    t: any;
    locale: string;
    setActiveResume: (id: string) => void;
    router: any;
    deleteResume: (resume: any) => void;
    duplicateResume: (resume: any) => void;
    index: number;
}

export const ResumeCardItem = ({
    id,
    resume,
    t,
    locale,
    setActiveResume,
    router,
    deleteResume,
    duplicateResume,
    index,
}: ResumeCardItemProps) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [scale, setScale] = React.useState(0.24);
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
    
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
                <CardContent 
                    className="p-0 flex-1 relative bg-gray-50 dark:bg-gray-900 overflow-hidden cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveResume(id);
                        router.push({ to: "/app/workbench/$id", params: { id } });
                    }}
                >
                    <div className="absolute inset-0 pb-6 flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover:scale-[1.02] overflow-hidden" ref={containerRef}>
                        <div className="w-full h-full relative origin-top bg-white">
                            <div
                                className="resume-preview absolute top-0 left-0 bg-white"
                                style={{
                                    width: "210mm",
                                    height: "297mm",
                                    transform: `scale(${scale})`,
                                    transformOrigin: "top left",
                                    padding: `${resume.globalSettings?.pagePadding || 32}px`,
                                    fontFamily: normalizeFontFamily(resume.globalSettings?.fontFamily),
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
                                {t(`dashboard.templates.${templateNameKey}.name`)} · {new Intl.DateTimeFormat(locale, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                }).format(new Date(resume.createdAt))}
                            </span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="p-0 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 overflow-hidden">
                    <div className="flex w-full h-11 divide-x divide-gray-100 dark:divide-gray-800">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveResume(id);
                                router.push({ to: "/app/workbench/$id", params: { id } });
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 hover:bg-white dark:hover:bg-gray-800/80 transition-all duration-200 text-gray-700 dark:text-gray-200 hover:text-primary font-medium text-sm group"
                        >
                            <Edit2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100" />
                            <span>{t("common.edit")}</span>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                duplicateResume(resume);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 hover:bg-white dark:hover:bg-gray-800/80 transition-all duration-200 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm group"
                        >
                            <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100" />
                            <span>{t("common.copy")}</span>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteDialog(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200 text-red-600 dark:text-red-400 font-medium text-sm group"
                        >
                            <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform opacity-80 group-hover:opacity-100" />
                            <span>{t("common.delete")}</span>
                        </button>
                    </div>
                </CardFooter>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("dashboard.resumes.deleteConfirmTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("dashboard.resumes.deleteConfirmDescription")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(false); }}>
                            {t("common.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 border-none"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteResume(resume);
                                setShowDeleteDialog(false);
                                toast.success(t("common.deleteSuccess"));
                            }}
                        >
                            {t("common.confirm")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
};
