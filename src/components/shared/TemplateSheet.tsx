import { ImageIcon, Layout, PanelsLeftBottom } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "@/i18n/compat/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet-no-overlay";
import { cn } from "@/lib/utils";
import { DEFAULT_TEMPLATES } from "@/config";
import { useResumeStore } from "@/store/useResumeStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTemplateSnapshots } from "@/hooks/useTemplateSnapshots";

type TemplateItem = (typeof DEFAULT_TEMPLATES)[number];

interface TemplatePreviewProps {
  template: TemplateItem;
  isActive: boolean;
  snapshotSrc: string | null;
  onSelect: (templateId: string) => void;
}

const TemplatePreview = ({
  template,
  isActive,
  snapshotSrc,
  onSelect,
}: TemplatePreviewProps) => {
  return (
    <button
      onClick={() => onSelect(template.id)}
      className={cn(
        "relative group rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-[1.02] text-left",
        isActive
          ? "border-primary dark:border-primary shadow-lg dark:shadow-primary/30"
          : "border-gray-100 hover:border-gray-200 dark:border-neutral-800 dark:hover:border-neutral-700"
      )}
    >
      <div className="relative aspect-[210/297] w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
        {snapshotSrc ? (
          <img
            src={snapshotSrc}
            alt={template.name}
            className="h-full w-full object-cover object-top"
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500 dark:from-neutral-900 dark:to-neutral-950 dark:text-neutral-400">
            <ImageIcon className="h-8 w-8" />
            <span className="px-4 text-center text-sm font-medium">
              {template.name}
            </span>
          </div>
        )}
      </div>
      {isActive && (
        <motion.div
          layoutId="template-selected"
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 dark:bg-black/40 pointer-events-none"
        >
          <Layout className="h-8 w-8 text-primary shadow-sm" />
        </motion.div>
      )}
    </button>
  );
};

const TemplateSheet = () => {
  const t = useTranslations("templates");
  const locale = useLocale();
  const { activeResume, setTemplate } = useResumeStore();
  const { snapshotMap } = useTemplateSnapshots(locale);

  const currentTemplate =
    DEFAULT_TEMPLATES.find((template) => template.id === activeResume?.templateId) ||
    DEFAULT_TEMPLATES[0];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <PanelsLeftBottom size={20} />
      </SheetTrigger>
      <SheetContent side="left" forceMount className="w-1/2 sm:max-w-1/2">
        <SheetHeader>
          <SheetTitle>{t("switchTemplate")}</SheetTitle>
        </SheetHeader>
        <SheetDescription />

        <div className="mt-4 h-[calc(100vh-8rem)]">
          <ScrollArea className="h-full w-full pr-4">
            <div className="grid grid-cols-4 gap-4 pb-8">
              {DEFAULT_TEMPLATES.map((template) => (
                <TemplatePreview
                  key={template.id}
                  template={template}
                  isActive={template.id === currentTemplate.id}
                  snapshotSrc={snapshotMap[template.id]}
                  onSelect={setTemplate}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TemplateSheet;
