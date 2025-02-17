"use client";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useResumeStore } from "@/store/useResumeStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import classic from "@/assets/images/template-cover/classic.png";
import modern from "@/assets/images/template-cover/modern.png";
import leftRight from "@/assets/images/template-cover/left-right.png";
import timeline from "@/assets/images/template-cover/timeline.png";

import { cn } from "@/lib/utils";
import { DEFAULT_TEMPLATES } from "@/config";

const templateImages: { [key: string]: any } = {
  classic,
  modern,
  "left-right": leftRight,
  timeline
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function TemplatesPage() {
  const t = useTranslations("dashboard.templates");
  const router = useRouter();
  const createResume = useResumeStore((state) => state.createResume);

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
          themeColor: template.colorScheme.primary,
          sectionSpacing: template.spacing.sectionGap,
          paragraphSpacing: template.spacing.itemGap,
          pagePadding: template.spacing.contentPadding
        },
        basic: {
          ...resume.basic,
          layout: template.basic.layout
        }
      });
    }

    router.push(`/app/workbench/${resumeId}`);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {DEFAULT_TEMPLATES.map((template) => {
            const templateKey =
              template.id === "left-right" ? "leftRight" : template.id;
            return (
              <motion.div key={template.id} variants={item}>
                <Card
                  className={cn(
                    "group cursor-pointer overflow-hidden transition-all hover:shadow-lg max-w-[280px] mx-auto",
                    "border-2 hover:border-primary"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="relative aspect-[210/297] w-full overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={templateImages[template.id]}
                        alt={t(`${templateKey}.name`)}
                        fill
                        className="object-contain transition-transform duration-300 group-hover:scale-105 p-1"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                        <h3 className="text-lg font-semibold">
                          {t(`${templateKey}.name`)}
                        </h3>
                        <p className="text-sm text-gray-200 mt-1">
                          {t(`${templateKey}.description`)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        className="w-full"
                        onClick={() => handleCreateResume(template.id)}
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
      </div>
    </div>
  );
}
