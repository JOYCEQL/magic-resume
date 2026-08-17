import { useEffect, useState } from "react";
import { BriefcaseBusiness, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/lib/navigation";
import {
  assertTailoredResume,
  parseVacancyLaunch,
  type VacancyLaunch,
} from "@/lib/resumeTailoring";
import {
  artifactLabels,
  assertResumeStudioProvenance,
  buildResumeStudioMetadata,
  completeResumeHandoff,
  handoffTokenFromFragment,
  type ResumeStudioProvenance,
} from "@/lib/resumeStudioIntegration";
import type {
  RequirementEvidenceArtifact,
  ResumeSelectionPlan,
  VacancyAnalysis,
} from "@/lib/server/vacancyRelevance";
import { useResumeStore } from "@/store/useResumeStore";
import { generateUUID } from "@/utils/uuid";
import { createResumeFromAIResult, escapeHtml } from "./utils";

export function ResumeStudioPanel() {
  const router = useRouter();
  const { addResume, setActiveResume } = useResumeStore();
  const [launch, setLaunch] = useState<VacancyLaunch | null>(null);
  const [sessionState, setSessionState] = useState<"loading" | "ready" | "error">("loading");
  const [tailoring, setTailoring] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackReady, setFeedbackReady] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [handoffToken] = useState(() => handoffTokenFromFragment(window.location.hash));

  useEffect(() => {
    setLaunch(parseVacancyLaunch(window.location.search));
    setFeedbackMode(new URLSearchParams(window.location.search).get("mode") === "feedback");
    if (window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    const controller = new AbortController();
    void fetch("/api/resume-tailor", {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Resume Studio session unavailable");
        return response.json() as Promise<{ ready?: boolean }>;
      })
      .then(({ ready }) => setSessionState(ready ? "ready" : "error"))
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSessionState("error");
        }
      });
    return () => controller.abort();
  }, []);

  const createVacancyFeedback = async (vacancy: VacancyLaunch) => {
    if (sessionState !== "ready") {
      toast.error("Локальная сессия Resume Studio не готова");
      return;
    }
    setFeedbackLoading(true);
    try {
      const response = await fetch("/api/resume-tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        signal: AbortSignal.timeout(500_000),
        body: JSON.stringify({
          apiKey: "codex-oauth",
          model: "",
          modelType: "codex",
          mode: "analysis",
          launch: vacancy,
        }),
      });
      const payload = await response.json().catch(() => null) as {
        analysis?: VacancyAnalysis;
        matching?: RequirementEvidenceArtifact;
        error?: string;
      } | null;
      if (!response.ok || !payload?.analysis || !payload.matching) {
        throw new Error(payload?.error || `Evidence analysis failed (${response.status})`);
      }
      setFeedbackReady(true);
      toast.success("Evidence-feedback сохранён в вакансии");
    } catch (error) {
      console.error("Vacancy evidence analysis failed:", error);
      toast.error(error instanceof Error ? error.message : "Не удалось сформировать feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const createVacancyVersion = async (vacancy: VacancyLaunch) => {
    if (sessionState !== "ready") {
      toast.error("Локальная сессия Resume Studio не готова");
      return;
    }
    if (!handoffToken) {
      toast.error("Одноразовый CV handoff отсутствует или уже удалён из URL");
      return;
    }
    setTailoring(true);
    try {
      const response = await fetch("/api/resume-tailor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        signal: AbortSignal.timeout(500_000),
        body: JSON.stringify({
          apiKey: "",
          model: "",
          modelType: "codex",
          launch: vacancy,
          handoffToken,
        }),
      });
      const payload = await response.json().catch(() => null) as {
        resume?: unknown;
        provenance?: ResumeStudioProvenance;
        analysis?: VacancyAnalysis;
        matching?: RequirementEvidenceArtifact;
        selectionPlan?: ResumeSelectionPlan;
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error || `Resume tailoring failed (${response.status})`);
      }
      const result = assertTailoredResume(payload?.resume, vacancy.language);
      if (!payload?.provenance || !payload.analysis || !payload.matching || !payload.selectionPlan) {
        throw new Error("Resume tailoring response is missing trusted relevance artifacts");
      }
      const provenance = assertResumeStudioProvenance(payload.provenance, result.language);
      const labels = artifactLabels(result.language);
      const studioMetadata = buildResumeStudioMetadata({
        evidenceMap: result.evidenceMap,
        requirementMap: result.requirementMap,
        excludedClaims: result.audit.excludedClaims,
        vacancyAnalysis: payload.analysis,
        evidenceMatching: payload.matching,
        selectionPlan: payload.selectionPlan,
        provenance,
      });
      const baseResume = createResumeFromAIResult(result, result.title);
      const safeTitle = result.title.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-");
      const resume = {
        ...baseResume,
        title: `${safeTitle} · ${baseResume.id.slice(0, 6)}`,
        basic: { ...baseResume.basic, ...result.basic, title: result.targetRole },
        selfEvaluationContent: `<p>${escapeHtml(result.summary)}</p>`,
        menuSections: [
          { id: "basic", title: labels.contact, icon: "👤", enabled: true, order: 0 },
          { id: "selfEvaluation", title: labels.profile, icon: "◎", enabled: true, order: 1 },
          { id: "experience", title: labels.experience, icon: "💼", enabled: true, order: 2 },
          { id: "skills", title: labels.skills, icon: "⚡", enabled: result.skills.length > 0, order: 3 },
          { id: "projects", title: labels.projects, icon: "◇", enabled: result.projects.length > 0, order: 4 },
          { id: "education", title: labels.education, icon: "🎓", enabled: result.education.length > 0, order: 5 },
        ],
        customData: {
          ...baseResume.customData,
          resumeStudioAudit: [{
            id: generateUUID(),
            title: result.audit.summary,
            subtitle: `${result.audit.score}/100`,
            dateRange: vacancy.id,
            description: `<ul>${result.audit.gaps.map((gap) => `<li>${escapeHtml(gap)}</li>`).join("")}</ul>`,
            visible: false,
          }],
        },
        metadata: {
          resumeStudio: studioMetadata,
        },
      };
      const id = addResume(resume);
      setActiveResume(id);
      const sync = await completeResumeHandoff(
        import.meta.env.VITE_JOB_SEEKER_API_URL || "http://127.0.0.1:8765",
        handoffToken,
        {
          vacancy_id: vacancy.id,
          resume_id: id,
          language: result.language,
          title: resume.title,
          resume,
          provenance: studioMetadata,
          status: "created",
        },
        fetch,
      );
      if (sync.ok) {
        toast.success(`${labels.created}: fit ${result.audit.score}/100`);
      } else {
        toast.warning(labels.syncFailed);
      }
      router.push(`/app/workbench/${id}`);
    } catch (error) {
      console.error("Vacancy-specific resume creation failed:", error);
      toast.error(error instanceof Error ? error.message : "Не удалось создать CV под вакансию");
    } finally {
      setTailoring(false);
    }
  };

  return (
    <section className="px-4 sm:px-6" aria-labelledby="resume-studio-title">
      <div className="rounded-2xl border border-stone-200 bg-[#f4f1e8] p-5 text-stone-950 shadow-sm dark:border-stone-800 dark:bg-stone-950 dark:text-stone-50 sm:p-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          <ShieldCheck className="h-4 w-4" /> Authenticated, evidence-gated workflow
        </div>
        <h2 id="resume-studio-title" className="mt-3 text-3xl font-semibold tracking-tight">
          Resume Studio
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 dark:text-stone-300">
          Персональные факты не встроены в клиентский bundle. Студия создаёт только версию под
          выбранную вакансию после серверной авторизации, проверки evidence refs и независимого
          semantic-entailment gate.
        </p>

        {launch ? (
          <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-300">
                  <BriefcaseBusiness className="h-4 w-4" />
                  Вакансия из трекера · {launch.language.toUpperCase()}
                </div>
                <div className="mt-2 font-semibold">{launch.role}</div>
                <div className="text-sm text-stone-600 dark:text-stone-300">
                  {launch.company} · {launch.id}
                </div>
                <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  Local Codex OAuth · deterministic evidence gate
                </div>
              </div>
              <div className="flex min-w-64 flex-col gap-2">
                <div className="text-xs text-emerald-800 dark:text-emerald-300" role="status">
                  {sessionState === "ready"
                    ? "Локальная сессия готова"
                    : sessionState === "loading"
                      ? "Подключаю локальную сессию…"
                      : "Локальная сессия недоступна"}
                </div>
                <Button
                  type="button"
                  onClick={() => void createVacancyFeedback(launch)}
                  disabled={feedbackLoading || tailoring || sessionState !== "ready"}
                  className={feedbackMode ? "bg-emerald-900 text-white hover:bg-emerald-800" : ""}
                  variant={feedbackMode ? "default" : "outline"}
                >
                  {feedbackLoading
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Сопоставляю требования и evidence…</>
                    : feedbackReady
                      ? <><ShieldCheck className="mr-2 h-4 w-4" />Feedback готов — вернись в вакансии</>
                      : <><Sparkles className="mr-2 h-4 w-4" />Сформировать feedback без создания CV</>}
                </Button>
                <Button
                  type="button"
                  onClick={() => void createVacancyVersion(launch)}
                  disabled={tailoring || feedbackLoading || sessionState !== "ready"}
                  className={feedbackMode ? "" : "bg-emerald-900 text-white hover:bg-emerald-800"}
                  variant={feedbackMode ? "outline" : "default"}
                >
                  {tailoring
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Проверяю и собираю CV…</>
                    : <><Sparkles className="mr-2 h-4 w-4" />Создать CV под вакансию</>}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-stone-300 bg-white/70 p-4 text-sm dark:border-stone-700 dark:bg-stone-900/70">
            Открой вакансию в трекере и выбери «Создать резюме».
          </div>
        )}
      </div>
    </section>
  );
}