"use client";
import { Layout, PanelsLeftBottom } from "lucide-react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet-no-overlay";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_TEMPLATES } from "@/config";
import { useResumeStore } from "@/store/useResumeStore";
import classic from "@/assets/images/template-cover/classic.png";
import modern from "@/assets/images/template-cover/modern.png";
import leftRight from "@/assets/images/template-cover/left-right.png";

const templateImages: { [key: string]: any } = {
  classic,
  modern,
  "left-right": leftRight,
};

const TemplateSheet = () => {
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
          <SheetTitle>选择模版</SheetTitle>
        </SheetHeader>

        {/* 解决警告问题 */}
        <SheetDescription></SheetDescription>

        <div className="grid grid-cols-4 gap-4 mt-4">
          {DEFAULT_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={cn(
                "relative group rounded-lg overflow-hidden border-2 transition-all duration-200 aspect-[210/297]",
                t.id === currentTemplate.id
                  ? "border-black dark:border-white"
                  : "dark:border-neutral-800 dark:hover:border-neutral-700 border-gray-100 hover:border-gray-200"
              )}
            >
              <div className="absolute inset-0">
                <img
                  src={templateImages[t.id].src}
                  alt={t.name}
                  className="w-full  object-cover"
                />
              </div>
              {t.id === currentTemplate.id && (
                <motion.div
                  layoutId="template-selected"
                  className="absolute inset-0 flex items-center justify-center bg-black/20 dark:bg-white/20"
                >
                  <Layout className="w-6 h-6 text-white" />
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
