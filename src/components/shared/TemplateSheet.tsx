"use client";
import { Layout, PanelsLeftBottom } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "@/i18n/compat/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet-no-overlay";
import { cn } from "@/lib/utils";
import { DEFAULT_TEMPLATES } from "@/config";
import { useResumeStore } from "@/store/useResumeStore";
import { ScrollArea } from "@/components/ui/scroll-area";

const TemplateSheet = () => {
  const t = useTranslations("templates");
  const { activeResume, setTemplate } = useResumeStore();
  const currentTemplate =
    DEFAULT_TEMPLATES.find((t) => t.id === activeResume?.templateId) ||
    DEFAULT_TEMPLATES[0];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <PanelsLeftBottom size={20} />
      </SheetTrigger>
      <SheetContent side="left" className="w-1/2 sm:max-w-1/2">
        <SheetHeader>
          <SheetTitle>{t("switchTemplate")}</SheetTitle>
        </SheetHeader>

        {/* 解决警告问题 */}
        <SheetDescription></SheetDescription>

        <div className="h-[calc(100vh-8rem)] mt-4">
          <ScrollArea className="h-full w-full pr-4">
            <div className="grid grid-cols-4 gap-4 pb-8">
              {DEFAULT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setTemplate(template.id)}
                  className={cn(
                    "relative group rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-[1.02]",
                    template.id === currentTemplate.id
                      ? "border-primary dark:border-primary shadow-lg dark:shadow-primary/30"
                      : "dark:border-neutral-800 dark:hover:border-neutral-700 border-gray-100 hover:border-gray-200"
                  )}
                >
                  <div className="relative aspect-[210/297] w-full overflow-hidden bg-white pointer-events-none">
                    <svg viewBox="0 0 794 1123" className="absolute inset-0 w-full h-full pointer-events-none rounded-md">
                      <foreignObject x="0" y="0" width="794" height="1123">
                        <iframe
                          src={`/app/preview-template/${template.id}`}
                          className="w-[794px] h-[1123px] border-0 pointer-events-none"
                          scrolling="no"
                          tabIndex={-1}
                        />
                      </foreignObject>
                    </svg>
                  </div>
                  {template.id === currentTemplate.id && (
                    <motion.div
                      layoutId="template-selected"
                      className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-black/40 pointer-events-none z-20"
                    >
                      <Layout className="w-8 h-8 text-primary shadow-sm" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TemplateSheet;
