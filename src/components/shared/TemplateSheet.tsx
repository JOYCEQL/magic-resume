"use client";
import { Layout, PanelsLeftBottom } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
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
import classic from "@/assets/images/template-cover/classic.png";
import modern from "@/assets/images/template-cover/modern.png";
import leftRight from "@/assets/images/template-cover/left-right.png";
import timeline from "@/assets/images/template-cover/timeline.png";

const templateImages: { [key: string]: any } = {
  classic,
  modern,
  "left-right": leftRight,
  timeline
};

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

        <div className="grid grid-cols-3 gap-4 mt-4">
          {DEFAULT_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={cn(
                "relative group rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-[1.02]",
                t.id === currentTemplate.id
                  ? "border-primary dark:border-primary shadow-lg dark:shadow-primary/30"
                  : "dark:border-neutral-800 dark:hover:border-neutral-700 border-gray-100 hover:border-gray-200"
              )}
            >
              <img
                src={templateImages[t.id].src}
                alt={t.name}
                className="w-full h-auto"
              />
              {t.id === currentTemplate.id && (
                <motion.div
                  layoutId="template-selected"
                  className="absolute inset-0 flex items-center justify-center bg-black/20 dark:bg-white/30"
                >
                  <Layout className="w-6 h-6 text-white dark:text-primary" />
                </motion.div>
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TemplateSheet;
