import type {
  RequirementEvidenceArtifact,
  ResumeSelectionPlan,
  VacancyAnalysis,
} from "@/lib/careerTwinContract";
import type { VacancyLaunch } from "@/lib/resumeTailoring";

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
  selectionPlan?: ResumeSelectionPlan;
  provenance: ResumeStudioProvenance;
}): ResumeStudioMetadata => ({
  evidenceMap,
  requirementMap,
  excludedClaims,
  vacancyAnalysis,
  evidenceMatching,
  ...(selectionPlan ? { selectionPlan } : {}),
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

export interface FinalizedResumeRequest {
  handoffToken: string;
  launch: VacancyLaunch;
}

export const parseFinalizedResumeRequest = (value: unknown): FinalizedResumeRequest => {
  if (!isRecord(value)) throw new Error("A finalized Career Twin handoff is required");
  const allowedKeys = new Set(["handoffToken", "launch"]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new Error("Magic Resume is renderer-only and rejects semantic generation fields");
  }
  const handoffToken = value.handoffToken;
  const launch = value.launch;
  if (typeof handoffToken !== "string" || !/^[A-Za-z0-9_-]{32,128}$/.test(handoffToken)) {
    throw new Error("A finalized Career Twin handoff is required");
  }
  if (!isRecord(launch) || typeof launch.id !== "string" || !launch.id.trim() ||
      typeof launch.source !== "string" ||
      (launch.language !== "ru" && launch.language !== "en") ||
      typeof launch.company !== "string" || typeof launch.role !== "string" ||
      !launch.role.trim() || typeof launch.url !== "string") {
    throw new Error("A valid vacancy launch is required for the finalized handoff");
  }
  return { handoffToken, launch: launch as unknown as VacancyLaunch };
};

export const handoffTokenFromFragment = (fragment: string) => {
  const token = new URLSearchParams(fragment.replace(/^#/, "")).get("handoff_token") || "";
  return /^[A-Za-z0-9_-]{32,128}$/.test(token) ? token : "";
};

export interface FinalizedResumeHandoff {
  resume: Record<string, unknown>;
  analysis: VacancyAnalysis;
  matching: RequirementEvidenceArtifact;
  provenance: ResumeStudioProvenance;
}

export const finalizedResumeFromHandoff = (value: unknown): FinalizedResumeHandoff => {
  const handoff = isRecord(value) ? value : null;
  const snapshot = handoff && isRecord(handoff.snapshot) ? handoff.snapshot : null;
  const resume = snapshot && isRecord(snapshot.resume_content) ? snapshot.resume_content : null;
  const analysis = snapshot && isRecord(snapshot.vacancy_analysis) ? snapshot.vacancy_analysis : null;
  const matching = snapshot && isRecord(snapshot.evidence_matching) ? snapshot.evidence_matching : null;
  const provenance = snapshot && isRecord(snapshot.resume_provenance) ? snapshot.resume_provenance : null;
  if (!resume || !analysis || !matching || !provenance) {
    throw new Error("Handoff does not contain finalized Career Twin CV content");
  }
  return {
    resume,
    analysis: analysis as unknown as VacancyAnalysis,
    matching: matching as unknown as RequirementEvidenceArtifact,
    provenance: provenance as unknown as ResumeStudioProvenance,
  };
};

export const fetchFinalizedResumeHandoff = async (
  baseUrl: string,
  handoffToken: string,
  fetchImpl: typeof fetch = fetch,
  capabilityToken = "",
): Promise<FinalizedResumeHandoff> => {
  const parsed = new URL(baseUrl);
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  const loopback = hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1";
  if (parsed.protocol !== "http:" || !loopback || parsed.port !== "8765" ||
      parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("Job Seeker handoff must use loopback HTTP port 8765");
  }
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(handoffToken)) {
    throw new Error("A finalized Career Twin handoff is required");
  }
  const response = await fetchImpl(
    `${parsed.origin}/api/v1/resume-handoffs/${encodeURIComponent(handoffToken)}`,
    {
      headers: capabilityToken ? { Authorization: `Bearer ${capabilityToken}` } : {},
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) throw new Error(`RESUME_HANDOFF_${response.status}`);
  return finalizedResumeFromHandoff(await response.json());
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

export const isCareerTwinManagedResume = (value: unknown) =>
  resumeVariantFromStoredResume(value) !== null;

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
