import type {
  RequirementEvidenceArtifact,
  ResumeSelectionPlan,
  VacancyAnalysis,
} from "@/lib/server/vacancyRelevance";

export type ArtifactLanguage = "ru" | "en";

export interface ResumeStudioProvenance {
  handoffId: string;
  careerProjectionRevision: number;
  vacancy: {
    id: string;
    source: string;
    sha256: string;
    date: string;
    path: string;
  };
  evidenceSources: Array<{ path: string; sha256: string }>;
  careerSha256: string;
  evidenceSha256: string;
  catalogSha256: string;
  generator: string;
  verifier: string;
  generatedAt: string;
  artifactLanguage: ArtifactLanguage;
}

export interface ResumeStudioMetadata extends ResumeStudioProvenance {
  evidenceMap: Record<string, string[]>;
  requirementMap: Record<string, string[]>;
  excludedClaims: string[];
  vacancyAnalysis?: VacancyAnalysis;
  evidenceMatching?: RequirementEvidenceArtifact;
  selectionPlan?: ResumeSelectionPlan;
}

export const assertResumeStudioProvenance = (
  value: unknown,
  artifactLanguage: ArtifactLanguage,
): ResumeStudioProvenance => {
  const provenance = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const vacancy = provenance.vacancy && typeof provenance.vacancy === "object" &&
    !Array.isArray(provenance.vacancy)
    ? provenance.vacancy as Record<string, unknown>
    : {};
  const isSha256 = (candidate: unknown) =>
    typeof candidate === "string" && /^[a-f0-9]{64}$/i.test(candidate);
  const evidenceSources = provenance.evidenceSources;
  const validSources = Array.isArray(evidenceSources) && evidenceSources.length > 0 &&
    evidenceSources.every((source) => source && typeof source === "object" && !Array.isArray(source) &&
      typeof (source as Record<string, unknown>).path === "string" &&
      isSha256((source as Record<string, unknown>).sha256));
  if (
    provenance.artifactLanguage !== artifactLanguage ||
    typeof provenance.handoffId !== "string" ||
    typeof provenance.careerProjectionRevision !== "number" ||
    typeof vacancy.id !== "string" ||
    typeof vacancy.source !== "string" ||
    typeof vacancy.date !== "string" ||
    typeof vacancy.path !== "string" ||
    !isSha256(vacancy.sha256) ||
    !validSources ||
    !isSha256(provenance.careerSha256) ||
    !isSha256(provenance.evidenceSha256) ||
    !isSha256(provenance.catalogSha256) ||
    typeof provenance.generator !== "string" ||
    typeof provenance.verifier !== "string" ||
    typeof provenance.generatedAt !== "string"
  ) {
    throw new Error("Resume tailoring response is missing trusted provenance");
  }
  return value as ResumeStudioProvenance;
};

export const buildResumeStudioMetadata = ({
  evidenceMap,
  requirementMap,
  excludedClaims,
  vacancyAnalysis,
  evidenceMatching,
  selectionPlan,
  provenance,
}: {
  evidenceMap: Record<string, string[]>;
  requirementMap: Record<string, string[]>;
  excludedClaims: string[];
  vacancyAnalysis: VacancyAnalysis;
  evidenceMatching: RequirementEvidenceArtifact;
  selectionPlan: ResumeSelectionPlan;
  provenance: ResumeStudioProvenance;
}): ResumeStudioMetadata => ({
  evidenceMap,
  requirementMap,
  excludedClaims,
  vacancyAnalysis,
  evidenceMatching,
  selectionPlan,
  ...provenance,
});

const labels = {
  en: {
    contact: "Contact",
    profile: "Profile",
    experience: "Experience",
    skills: "Core skills",
    projects: "Selected projects",
    education: "Education",
    created: "CV created",
    syncFailed: "CV saved, but database sync failed",
  },
  ru: {
    contact: "Контакты",
    profile: "Профиль",
    experience: "Опыт",
    skills: "Ключевые компетенции",
    projects: "Избранные проекты",
    education: "Образование",
    created: "CV создано",
    syncFailed: "CV сохранено, но синхронизация с БД не удалась",
  },
} as const;

export const artifactLabels = (language: ArtifactLanguage) => labels[language];

export interface ResumeVariantPayload {
  vacancy_id: string;
  resume_id: string;
  language: ArtifactLanguage;
  title: string;
  resume: Record<string, unknown>;
  provenance: ResumeStudioMetadata;
  status: "created";
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const handoffTokenFromFragment = (fragment: string) => {
  const token = new URLSearchParams(fragment.replace(/^#/, "")).get("handoff_token") || "";
  return /^[A-Za-z0-9_-]{32,128}$/.test(token) ? token : "";
};

export const resumeVariantFromStoredResume = (
  value: unknown,
): ResumeVariantPayload | null => {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.title !== "string") {
    return null;
  }
  const metadata = isRecord(value.metadata) ? value.metadata : null;
  const studio = metadata && isRecord(metadata.resumeStudio) ? metadata.resumeStudio : null;
  const vacancy = studio && isRecord(studio.vacancy) ? studio.vacancy : null;
  const language = studio?.artifactLanguage;
  if (
    !studio ||
    !vacancy ||
    typeof vacancy.id !== "string" ||
    (language !== "ru" && language !== "en") ||
    !isRecord(studio.evidenceMap) ||
    !Array.isArray(studio.excludedClaims) ||
    typeof studio.generator !== "string" ||
    typeof studio.verifier !== "string" ||
    typeof studio.handoffId !== "string" ||
    typeof studio.careerProjectionRevision !== "number"
  ) {
    return null;
  }
  return {
    vacancy_id: vacancy.id,
    resume_id: value.id,
    language,
    title: value.title,
    resume: value,
    provenance: studio as unknown as ResumeStudioMetadata,
    status: "created",
  };
};

export const syncResumeVariant = async (
  baseUrl: string,
  payload: ResumeVariantPayload,
  fetchImpl: typeof fetch = fetch,
  capabilityToken = "",
): Promise<{ ok: boolean; error?: string }> => {
  try {
    const parsed = new URL(baseUrl);
    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    const loopback = hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    if (parsed.protocol !== "http:" || !loopback || parsed.port !== "8765" ||
        parsed.username || parsed.password || parsed.search || parsed.hash ||
        (path !== "/" && path !== "/api/v1/resume-variants")) {
      throw new Error("Job Seeker callback must use loopback HTTP port 8765");
    }
    const url = `${parsed.origin}/api/v1/resume-variants`;
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(capabilityToken ? { Authorization: `Bearer ${capabilityToken}` } : {}),
      },
      body: JSON.stringify(payload),
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown database sync error",
    };
  }
};

export const completeResumeHandoff = async (
  baseUrl: string,
  handoffToken: string,
  payload: ResumeVariantPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; error?: string }> => {
  try {
    const parsed = new URL(baseUrl);
    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    const loopback = hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    if (parsed.protocol !== "http:" || !loopback || parsed.port !== "8765" ||
        parsed.username || parsed.password || parsed.search || parsed.hash || path !== "/" ||
        !/^[A-Za-z0-9_-]{32,128}$/.test(handoffToken)) {
      throw new Error("Job Seeker handoff must use loopback HTTP port 8765");
    }
    const response = await fetchImpl(
      `${parsed.origin}/api/v1/resume-handoffs/${encodeURIComponent(handoffToken)}/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema_version: 1, ...payload }),
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown handoff completion error",
    };
  }
};

export const syncVacancyFeedback = async (
  baseUrl: string,
  vacancyId: string,
  analysis: VacancyAnalysis,
  matching: RequirementEvidenceArtifact,
  fetchImpl: typeof fetch = fetch,
  capabilityToken = "",
): Promise<{ ok: boolean; error?: string }> => {
  try {
    const parsed = new URL(baseUrl);
    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
    const loopback = hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
    if (parsed.protocol !== "http:" || !loopback || parsed.port !== "8765" ||
        parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error("Job Seeker callback must use loopback HTTP port 8765");
    }
    const response = await fetchImpl(
      `${parsed.origin}/api/v1/vacancies/${encodeURIComponent(vacancyId)}/evidence-feedback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(capabilityToken ? { Authorization: `Bearer ${capabilityToken}` } : {}),
        },
        body: JSON.stringify({ analysis, matching }),
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown feedback sync error",
    };
  }
};
