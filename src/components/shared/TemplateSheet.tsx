import { useEffect, useMemo, useRef, useState } from "react";
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
import ResumeTemplateComponent from "@/components/templates";
import {
  initialResumeState,
  initialResumeStateEn,
} from "@/config/initialResumeData";
import { normalizeFontFamily } from "@/utils/fonts";
import type { ResumeData } from "@/types/resume";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const SNAPSHOT_CAPTURE_SCALE = 0.6;

type TemplateItem = (typeof DEFAULT_TEMPLATES)[number];
type SnapshotState = Record<string, string | null>;

interface TemplatePreviewProps {
  template: TemplateItem;
  isActive: boolean;
  snapshotUrl?: string | null;
  onSelect: (templateId: string) => void;
}

const createPreviewData = (
  template: TemplateItem,
  baseData: typeof initialResumeState
): ResumeData =>
  ({
    ...baseData,
    id: `preview-mock-sheet-${template.id}`,
    templateId: template.id,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    globalSettings: {
      ...baseData.globalSettings,
      themeColor: template.colorScheme.primary,
      sectionSpacing: template.spacing.sectionGap,
      paragraphSpacing: template.spacing.itemGap,
      pagePadding: template.spacing.contentPadding,
    },
    basic: {
      ...baseData.basic,
      layout: template.basic.layout,
    },
  }) as ResumeData;

const waitForStableRender = async () => {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
};

const scheduleIdle = (callback: () => void) => {
  if ("requestIdleCallback" in window) {
    return window.requestIdleCallback(callback, { timeout: 1200 });
  }

  return window.setTimeout(callback, 180);
};

const cancelIdle = (handle: number) => {
  if ("cancelIdleCallback" in window) {
    window.cancelIdleCallback(handle);
    return;
  }

  window.clearTimeout(handle);
};

const TemplatePreview = ({
  template,
  isActive,
  snapshotUrl,
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
        {snapshotUrl ? (
          <img
            src={snapshotUrl}
            alt={template.name}
            className="h-full w-full object-cover object-top"
            loading="lazy"
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
  const [snapshotUrls, setSnapshotUrls] = useState<SnapshotState>({});
  const [capturingTemplateId, setCapturingTemplateId] = useState<string | null>(
    null
  );
  const captureRef = useRef<HTMLDivElement>(null);

  const currentTemplate =
    DEFAULT_TEMPLATES.find((template) => template.id === activeResume?.templateId) ||
    DEFAULT_TEMPLATES[0];

  const baseData = useMemo(
    () => (locale === "en" ? initialResumeStateEn : initialResumeState),
    [locale]
  );

  const previewDataMap = useMemo(
    () =>
      Object.fromEntries(
        DEFAULT_TEMPLATES.map((template) => [
          template.id,
          createPreviewData(template, baseData),
        ])
      ) as Record<string, ResumeData>,
    [baseData]
  );

  const capturingTemplate = useMemo(
    () =>
      DEFAULT_TEMPLATES.find((template) => template.id === capturingTemplateId) ??
      null,
    [capturingTemplateId]
  );

  useEffect(() => {
    setSnapshotUrls({});
    setCapturingTemplateId(null);
  }, [locale]);

  useEffect(() => {
    if (capturingTemplateId) return;

    const nextTemplate = DEFAULT_TEMPLATES.find(
      (template) => !(template.id in snapshotUrls)
    );

    if (!nextTemplate) return;

    let cancelled = false;
    const idleHandle = scheduleIdle(() => {
      if (!cancelled) {
        setCapturingTemplateId(nextTemplate.id);
      }
    });

    return () => {
      cancelled = true;
      cancelIdle(idleHandle);
    };
  }, [capturingTemplateId, snapshotUrls]);

  useEffect(() => {
    if (!capturingTemplateId || !capturingTemplate || !captureRef.current) return;

    let cancelled = false;

    const captureSnapshot = async () => {
      try {
        const { default: html2canvas } = await import("html2canvas");

        await waitForStableRender();

        if (cancelled || !captureRef.current) return;

        const canvas = await html2canvas(captureRef.current, {
          backgroundColor: "#ffffff",
          scale: SNAPSHOT_CAPTURE_SCALE,
          useCORS: true,
          logging: false,
          width: A4_WIDTH_PX,
          height: A4_HEIGHT_PX,
          cacheBust: true,
          windowWidth: A4_WIDTH_PX,
          windowHeight: A4_HEIGHT_PX,
        });

        if (cancelled) return;

        const snapshotUrl = canvas.toDataURL("image/png");
        setSnapshotUrls((prev) => ({
          ...prev,
          [capturingTemplateId]: snapshotUrl,
        }));
      } catch (error) {
        console.error("Template snapshot capture failed:", error);
        if (!cancelled) {
          setSnapshotUrls((prev) => ({
            ...prev,
            [capturingTemplateId]: null,
          }));
        }
      } finally {
        if (!cancelled) {
          setCapturingTemplateId(null);
        }
      }
    };

    void captureSnapshot();

    return () => {
      cancelled = true;
    };
  }, [capturingTemplate, capturingTemplateId]);

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <PanelsLeftBottom size={20} />
        </SheetTrigger>
        <SheetContent side="left" className="w-1/2 sm:max-w-1/2">
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
                    snapshotUrl={snapshotUrls[template.id]}
                    onSelect={setTemplate}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {capturingTemplate && (
        <div
          aria-hidden="true"
          className="fixed top-0 left-0 pointer-events-none"
          style={{
            width: `${A4_WIDTH_PX}px`,
            height: `${A4_HEIGHT_PX}px`,
            transform: "translate(-200vw, 0)",
            overflow: "hidden",
            background: "#ffffff",
          }}
        >
          <div
            ref={captureRef}
            style={{
              width: `${A4_WIDTH_PX}px`,
              height: `${A4_HEIGHT_PX}px`,
              boxSizing: "border-box",
              padding: `${capturingTemplate.spacing.contentPadding}px`,
              background: "#ffffff",
              fontFamily: normalizeFontFamily(
                previewDataMap[capturingTemplate.id].globalSettings?.fontFamily
              ),
            }}
          >
            <ResumeTemplateComponent
              data={previewDataMap[capturingTemplate.id]}
              template={capturingTemplate}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TemplateSheet;
