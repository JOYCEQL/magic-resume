import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Translator } from "@/i18n/compat/utils";
import type { ResumeAgentValidationResult, ResumeDraft } from "@/types/resume-agent";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {title}
    </h3>
    {children}
  </section>
);

const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{children}</p>
);

interface AgentDraftPanelProps {
  t: Translator;
  draft: ResumeDraft;
  validation: ResumeAgentValidationResult;
}

/** 原 page.tsx 右栏内容整体搬迁，渲染行为不变；抽出以便侧栏 Tab 化 */
export const AgentDraftPanel = ({ t, draft, validation }: AgentDraftPanelProps) => (
  <div className="space-y-6 p-5">
    <Section title={t("draft.profile")}>
      {draft.basic.name ? (
        <div className="rounded-xl border p-4">
          <p className="text-lg font-bold">{draft.basic.name}</p>
          <p className="text-sm text-muted-foreground">
            {draft.basic.title || draft.targetJob.title}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {[draft.basic.email, draft.basic.phone, draft.basic.location]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      ) : (
        <EmptyState>{t("draft.empty")}</EmptyState>
      )}
    </Section>

    {draft.summary && (
      <Section title={t("draft.summary")}>
        <p className="rounded-xl bg-muted/30 p-4 text-sm leading-6">{draft.summary}</p>
      </Section>
    )}

    <Section title={t("draft.skills")}>
      {draft.skills.length ? (
        <div className="flex flex-wrap gap-2">
          {draft.skills.map((skill, index) => (
            <Badge key={`${skill}-${index}`} variant="outline">
              {skill}
            </Badge>
          ))}
        </div>
      ) : (
        <EmptyState>{t("draft.empty")}</EmptyState>
      )}
    </Section>

    <Section title={t("draft.experience")}>
      {draft.experience.length ? (
        <div className="space-y-3">
          {draft.experience.map((item, index) => (
            <div key={`${item.company}-${index}`} className="rounded-xl border p-4">
              <div className="flex justify-between gap-3">
                <strong>{item.position || item.company}</strong>
                <span className="text-xs text-muted-foreground">{item.date}</span>
              </div>
              <p className="text-sm text-muted-foreground">{item.company}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {item.details.map((detail, index) => (
                  <li key={`${detail}-${index}`}>{detail}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>{t("draft.empty")}</EmptyState>
      )}
    </Section>

    <Section title={t("draft.projects")}>
      {draft.projects.length ? (
        <div className="space-y-3">
          {draft.projects.map((item, index) => (
            <div key={`${item.name}-${index}`} className="rounded-xl border p-4">
              <strong>{item.name}</strong>
              <p className="text-sm text-muted-foreground">
                {[item.role, item.date].filter(Boolean).join(" · ")}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState>{t("draft.empty")}</EmptyState>
      )}
    </Section>

    <Section title={t("validation.title")}>
      {validation.issues.length ? (
        <div className="space-y-2">
          {validation.issues.map((item) => (
            <div
              key={item.id}
              className={`flex gap-3 rounded-xl border p-3 text-sm ${
                item.severity === "error"
                  ? "border-destructive/40 bg-destructive/5"
                  : "bg-muted/20"
              }`}
            >
              {item.severity === "error" ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              )}
              <span>{item.message}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {t("validation.noIssues")}
        </div>
      )}
    </Section>
  </div>
);
