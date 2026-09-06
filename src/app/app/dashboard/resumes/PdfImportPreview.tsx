import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/compat/client";
import type { createResumeFromAIResult } from "./utils";

type Props = {
  resume: ReturnType<typeof createResumeFromAIResult> | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PdfImportPreview({ resume, onCancel, onConfirm }: Props) {
  const t = useTranslations("dashboard.resumes.importDialog");
  return <Dialog open={!!resume} onOpenChange={(open) => { if (!open) onCancel(); }}>
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{t("previewTitle")}</DialogTitle>
        <DialogDescription>{t("previewDescription")}</DialogDescription>
      </DialogHeader>
      {resume && <div className="space-y-5 py-2">
        <div>
          <p className="text-xl font-semibold">{resume.basic.name || resume.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{[resume.basic.title, resume.basic.email, resume.basic.phone, resume.basic.location].filter(Boolean).join(" · ")}</p>
        </div>
        {([
          ["education", resume.education.map((item: { school: string; major: string; degree: string }) => [item.school, item.major, item.degree].filter(Boolean).join(" · "))],
          ["experience", resume.experience.map((item: { company: string; position: string; date: string }) => [item.company, item.position, item.date].filter(Boolean).join(" · "))],
          ["projects", resume.projects.map((item: { name: string; role: string; date: string }) => [item.name, item.role, item.date].filter(Boolean).join(" · "))],
        ] as [string, string[]][]).map(([label, items]) => <div key={label}>
          <h3 className="text-sm font-medium">{t(label)} <span className="text-muted-foreground">({items.length})</span></h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{items.map((item, index) => <li key={index}>{item}</li>)}</ul>
        </div>)}
      </div>}
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>{t("cancelImport")}</Button>
        <Button onClick={onConfirm}>{t("confirmImport")}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
