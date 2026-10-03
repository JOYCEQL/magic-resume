import { useState } from "react";
import { ArrowUpRight, Expand } from "lucide-react";
import { useLocale, useTranslations } from "@/i18n/compat/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "@/lib/link";

const templates = ["classic", "minimalist", "editorial", "swiss"] as const;
type Template = (typeof templates)[number];
export default function TemplateShowcase() {
  const locale = useLocale();
  const t = useTranslations("home.redesign");
  const [selected, setSelected] = useState<Template>("editorial");
  const [preview, setPreview] = useState(false);
  return (
    <section
      className="landing-templates landing-section"
      id="templates"
      aria-labelledby="templates-title"
    >
      <div className="landing-shell">
        <div className="landing-section-heading">
          <h2 id="templates-title">{t("templates.title")}</h2>
          <p>{t("templates.description")}</p>
        </div>
        <div className="landing-template-grid">
          {templates.map((name) => (
            <button
              key={name}
              type="button"
              className="landing-template-card"
              onClick={() => {
                setSelected(name);
                setPreview(true);
              }}
              aria-haspopup="dialog"
              aria-label={t("templates.preview", {
                name: t(`templates.${name}`),
              })}
            >
              <span className="landing-template-mount">
                <img
                  src={`/landing/${locale}-${name}.webp`}
                  alt={t("templates.alt", { name: t(`templates.${name}`) })}
                  width={800}
                  height={1132}
                  loading="lazy"
                />
                <span className="landing-template-expand" aria-hidden="true">
                  <Expand size={16} />
                </span>
              </span>
              <span className="landing-template-caption">
                {t(`templates.${name}`)}
              </span>
            </button>
          ))}
        </div>
        <div className="landing-template-actions">
          <Link href="/app/dashboard/templates" className="landing-button landing-button-secondary">
            {t("templates.all")}
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[90dvh] max-w-[560px] overflow-y-auto">
          <DialogTitle>{t(`templates.${selected}`)}</DialogTitle>
          <DialogDescription>
            {t("templates.previewDescription")}
          </DialogDescription>
          <img
            src={`/landing/${locale}-${selected}.webp`}
            alt={t("templates.alt", { name: t(`templates.${selected}`) })}
            width={800}
            height={1132}
            className="w-full"
          />
          <Link
            href="/app/dashboard/templates"
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            {t("templates.all")}
            <ArrowUpRight size={16} />
          </Link>
        </DialogContent>
      </Dialog>
    </section>
  );
}
