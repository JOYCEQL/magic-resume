"use client";
import { useState, useRef } from "react";
import { useTranslations } from "@/i18n/compat/client";
import { motion } from "framer-motion";
import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { DEFAULT_TEMPLATES } from "@/config";
import { useResumeStore } from "@/store/useResumeStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ResumeTemplateComponent from "@/components/templates";
import { initialResumeState, initialResumeStateEn } from "@/config/initialResumeData";
import { useLocale } from "@/i18n/compat/client";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const TemplatesPage = () => {
  const t = useTranslations("dashboard.templates");
  const locale = useLocale();
  const router = useRouter();
  const createResume = useResumeStore((state) => state.createResume);
  const [previewTemplate, setPreviewTemplate] = useState<{
    id: string;
    open: boolean;
  } | null>(null);
  
  const PRESET_COLORS = [
    { name: "default", value: "" },
    { name: "blue", value: "#3b82f6" },
    { name: "green", value: "#10b981" },
    { name: "purple", value: "#8b5cf6" },
    { name: "orange", value: "#f97316" },
    { name: "red", value: "#ef4444" },
    { name: "slate", value: "#475569" },
    { name: "black", value: "#000000" },
  ];
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_COLORS[0].value);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-cycle colors every 3 seconds
  useState(() => {
    // Only run on client
    if (typeof window !== "undefined") {
      let currentIndex = 0;
      autoPlayRef.current = setInterval(() => {
        currentIndex = (currentIndex + 1) % PRESET_COLORS.length;
        setSelectedColor(PRESET_COLORS[currentIndex].value);
      }, 3000);
    }
  });

  const handleColorSelect = (value: string) => {
    setSelectedColor(value);
    // Stop autoplay when user manually selects a color
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  };

  const baseData = locale === "en" ? initialResumeStateEn : initialResumeState;

  const handleCreateResume = (templateId: string) => {
    const template = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    const resumeId = createResume(templateId);
    const { resumes, updateResume } = useResumeStore.getState();
    const resume = resumes[resumeId];

    if (resume) {
      updateResume(resumeId, {
        globalSettings: {
          ...resume.globalSettings,
          themeColor: selectedColor || template.colorScheme.primary,
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

    router.push(`/app/workbench/${resumeId}`);
  };

  return (
    <ScrollArea className="h-[calc(100vh-2rem)] w-full">
      <div className="w-full max-w-[1600px] mx-auto py-8 px-6 lg:px-8">
        <div className="flex flex-col space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          
          <div className="flex items-center space-x-2 bg-gray-50/50 dark:bg-gray-900/50 p-2 rounded-full border border-gray-100 dark:border-gray-800 backdrop-blur-sm self-start sm:self-auto overflow-x-auto">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => handleColorSelect(color.value)}
                className={cn(
                  "relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-110",
                  selectedColor === color.value ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-950 scale-110" : ""
                )}
                title={color.name === "default" ? "Default" : color.name}
              >
                {color.value ? (
                  <div
                    className="w-full h-full rounded-full border border-black/10 dark:border-white/10 shadow-sm"
                    style={{ backgroundColor: color.value }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-gray-300 dark:border-gray-700 shadow-sm flex items-center justify-center">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-tighter">Tpl</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
        >
          {DEFAULT_TEMPLATES.map((template) => {
            const templateKey =
              template.id === "left-right" ? "leftRight" : template.id;
            return (
              <motion.div key={template.id} variants={item}>
                <Card
                  className={cn(
                    "group cursor-pointer overflow-hidden transition-all hover:shadow-lg",
                    "border border-gray-200 hover:border-primary/40 dark:border-gray-800 rounded-xl"
                  )}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-[210/297] w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
                      <div className="absolute top-0 right-0 z-10">
                        <div className="flex items-center px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-l border-b border-gray-200 dark:border-gray-700 rounded-bl-md">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                            {t(`${templateKey}.name`)}
                          </span>
                        </div>
                      </div>

                      <div className="h-full w-full py-6 transition-all duration-300 group-hover:scale-[1.02] flex items-center justify-center pointer-events-none">
                        <div 
                          className="relative overflow-hidden bg-white shadow-sm ring-1 ring-gray-200/50 rounded-sm"
                          style={{
                            width: "210px",
                            height: "297px",
                          }}
                        >
                          <div
                            className="absolute top-0 left-0 bg-white"
                            style={{
                              width: "210mm",
                              height: "297mm",
                              transform: "scale(0.264583333)", // (210px / 210mm) approximation
                              transformOrigin: "top left",
                              padding: `${template.spacing.contentPadding}px`,
                              fontFamily: "Alibaba PuHuiTi, sans-serif",
                            }}
                          >
                            <ResumeTemplateComponent
                              data={{
                                ...baseData,
                                id: "preview-mock-id",
                                templateId: template.id,
                                globalSettings: {
                                  ...baseData.globalSettings,
                                  themeColor: selectedColor || template.colorScheme.primary,
                                  sectionSpacing: template.spacing.sectionGap,
                                  paragraphSpacing: template.spacing.itemGap,
                                  pagePadding: template.spacing.contentPadding,
                                },
                                basic: {
                                  ...baseData.basic,
                                  layout: template.basic.layout,
                                },
                              } as any}
                              template={template}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                        <p className="text-sm text-gray-100 leading-snug">
                          {t(`${templateKey}.description`)}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-gray-950 flex space-x-2 border-t border-gray-100 dark:border-gray-800">
                      <Button
                        variant="outline"
                        className="flex-1 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate({ id: template.id, open: true });
                        }}
                      >
                        {t("preview")}
                      </Button>
                      <Button
                        className="flex-1 text-sm font-medium shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateResume(template.id);
                        }}
                      >
                        {t("useTemplate")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <Dialog
          open={previewTemplate?.open || false}
          onOpenChange={(open) => {
            if (!open) setPreviewTemplate(null);
          }}
        >
          {previewTemplate && (
            <DialogContent className="max-w-[680px] p-0 overflow-hidden border-0 shadow-lg rounded-xl bg-white dark:bg-gray-900">
              <div className="flex flex-col">
                <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-4">
                  <DialogTitle className="text-lg font-medium">
                    {t(
                      `${
                        previewTemplate.id === "left-right"
                          ? "leftRight"
                          : previewTemplate.id
                      }.name`
                    )}
                  </DialogTitle>
                </div>
                <div className="overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-8 pointer-events-none">
                  <div 
                    className="relative bg-white shadow-md ring-1 ring-gray-200/50 overflow-hidden"
                    style={{
                      width: "420px",
                      height: "594px",
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 bg-white"
                      style={{
                        width: "210mm",
                        height: "297mm",
                        transform: "scale(0.529166667)", // (420px / 210mm) approximation
                        transformOrigin: "top left",
                        padding: `${DEFAULT_TEMPLATES.find(t => t.id === previewTemplate.id)?.spacing.contentPadding || 32}px`,
                        fontFamily: "Alibaba PuHuiTi, sans-serif",
                      }}
                    >
                      {(() => {
                        const tpl = DEFAULT_TEMPLATES.find(t => t.id === previewTemplate.id) || DEFAULT_TEMPLATES[0];
                        return (
                          <ResumeTemplateComponent
                            data={{
                              ...baseData,
                              id: "preview-mock-id-large",
                              templateId: tpl.id,
                              globalSettings: {
                                ...baseData.globalSettings,
                                themeColor: selectedColor || tpl.colorScheme.primary,
                                sectionSpacing: tpl.spacing.sectionGap,
                                paragraphSpacing: tpl.spacing.itemGap,
                                pagePadding: tpl.spacing.contentPadding,
                              },
                              basic: {
                                ...baseData.basic,
                                layout: tpl.basic.layout,
                              },
                            } as any}
                            template={tpl}
                          />
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="p-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                  <Button
                    className="w-full"
                    onClick={() => {
                      setPreviewTemplate(null);
                      handleCreateResume(previewTemplate.id);
                    }}
                  >
                    {t("useTemplate")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>
      </div>
    </ScrollArea>
  );
};

export const runtime = "edge";

export default TemplatesPage;
