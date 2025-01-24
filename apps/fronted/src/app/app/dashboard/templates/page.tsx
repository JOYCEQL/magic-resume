"use client";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useResumeStore } from "@/store/useResumeStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEFAULT_TEMPLATES } from "@/config";
import classic from "@/assets/images/template-cover/classic.png";
import modern from "@/assets/images/template-cover/modern.png";
import leftRight from "@/assets/images/template-cover/left-right.png";
import { cn } from "@/lib/utils";

const templateImages: { [key: string]: any } = {
  classic,
  modern,
  "left-right": leftRight,
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
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {DEFAULT_TEMPLATES.map((template) => {
          const templateKey =
            template.id === "left-right" ? "leftRight" : template.id;
          return (
            <Card
              key={template.id}
              className="group overflow-hidden hover:shadow-lg transition-all duration-300 relative aspect-[3/4] max-w-[280px]"
            >
              <div className="absolute inset-0">
                <Image
                  src={templateImages[template.id]}
                  alt={t(`${templateKey}.name`)}
                  fill
                  className="object-cover"
                />
                {/* 渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
              </div>

              {/* 内容区域 */}
              <div className="absolute inset-x-0 bottom-0 p-4 text-white z-10">
                <h3 className="text-lg font-semibold mb-1">
                  {t(`${templateKey}.name`)}
                </h3>
                <p className="text-sm text-gray-200 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2">
                  {t(`${templateKey}.description`)}
                </p>
                <div className="relative overflow-hidden rounded-md">
                  <Button
                    className={cn(
                      "w-full bg-white/20 backdrop-blur-sm transition-colors duration-300 relative z-10",
                      "before:absolute before:inset-0 before:bg-white/30 before:translate-x-[-100%] before:group-hover:translate-x-0 before:transition-transform before:duration-300 before:z-[-1]"
                    )}
                    onClick={() => handleCreateResume(template.id)}
                  >
                    {t("useTemplate")}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
