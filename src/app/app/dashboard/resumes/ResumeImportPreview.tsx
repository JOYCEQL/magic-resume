import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/compat/client";
import type { ImportedResumeContent } from "@/lib/resume-import-schema";

type Props = {
  content: ImportedResumeContent | null;
  source?: "pdf" | "markdown";
  warnings?: string[];
  onCancel: () => void;
  onConfirm: () => void;
};

function Lines({ items }: { items: string[] }) {
  return items.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-relaxed text-muted-foreground">{items.map((text, i) => <li className="whitespace-pre-wrap break-words" key={i}>{text}</li>)}</ul> : null;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-3 border-t pt-4"><h3 className="text-sm font-semibold">{title}</h3>{children}</section>;
}

export function ResumeImportPreview({ content, source, warnings = [], onCancel, onConfirm }: Props) {
  const t = useTranslations("dashboard.resumes.importDialog");
  return <Dialog open={!!content} onOpenChange={open => { if (!open) onCancel(); }}>
    <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{t("previewTitle")}</DialogTitle>
        <DialogDescription>{t(source === "markdown" ? "markdownPreviewDescription" : "previewDescription")}</DialogDescription>
      </DialogHeader>
      {content && <div className="min-h-0 space-y-5 overflow-y-auto py-2 pr-2">
        {warnings.includes("missingName") && <p role="status" className="rounded-md bg-muted p-3 text-sm">{t("missingName")}</p>}
        <div className="space-y-2 break-words">
          <p className="text-xl font-semibold">{content.basic.name || content.title}</p>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{[content.basic.title, content.basic.email, content.basic.phone, content.basic.location, content.basic.employementStatus, content.basic.birthDate].filter(Boolean).join(" · ")}</p>
          {content.basic.customFields.map((field, i) => <p className="text-sm text-muted-foreground" key={i}>{[field.label, field.value].filter(Boolean).join(": ")}</p>)}
        </div>
        {!!content.skills.length && <Section title={t("skills")}><Lines items={content.skills} /></Section>}
        {!!content.selfEvaluation.length && <Section title={t("selfEvaluation")}><Lines items={content.selfEvaluation} /></Section>}
        {!!content.education.length && <Section title={t("education")}>{content.education.map((item, i) => <article className="break-words" key={i}>
          <p className="text-sm font-medium">{[item.school, item.major, item.degree].filter(Boolean).join(" · ")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{[item.startDate, item.endDate, item.gpa && `GPA: ${item.gpa}`].filter(Boolean).join(" · ")}</p><Lines items={item.description} />
        </article>)}</Section>}
        {!!content.experience.length && <Section title={t("experience")}>{content.experience.map((item, i) => <article className="break-words" key={i}>
          <p className="text-sm font-medium">{[item.company, item.position, item.date].filter(Boolean).join(" · ")}</p><Lines items={item.details} />
        </article>)}</Section>}
        {!!content.projects.length && <Section title={t("projects")}>{content.projects.map((item, i) => <article className="break-words" key={i}>
          <p className="text-sm font-medium">{[item.name, item.role, item.date].filter(Boolean).join(" · ")}</p>
          {item.link && <p className="mt-1 text-xs text-muted-foreground">{[item.linkLabel, item.link].filter(Boolean).join(": ")}</p>}<Lines items={item.description} />
        </article>)}</Section>}
        {!!content.publications.length && <Section title={t("publications")}>{content.publications.map((item, i) => <article className="break-words" key={i}>
          <p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{[item.authors, item.venue, item.date, item.status, item.link].filter(Boolean).join(" · ")}</p><Lines items={item.description} />
        </article>)}</Section>}
        {content.customSections.map((section, i) => <Section key={i} title={section.title || t("additionalInformation")}>{section.items.map((item, j) => <article className="break-words" key={j}>
          <p className="text-sm font-medium">{[item.title, item.subtitle, item.dateRange].filter(Boolean).join(" · ")}</p><Lines items={item.description} />
        </article>)}</Section>)}
      </div>}
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>{t(source === "markdown" ? "backToMarkdown" : "cancelImport")}</Button>
        <Button onClick={onConfirm}>{t("confirmImport")}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
