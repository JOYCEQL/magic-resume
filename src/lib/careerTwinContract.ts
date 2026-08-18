export type VacancyRequirementCategory =
  | "platform"
  | "portfolio"
  | "governance"
  | "delivery"
  | "domain"
  | "language"
  | "location";

export type VacancyRequirementPriority = "must" | "important" | "optional";
export type EvidenceExpectation = "direct" | "adjacent-acceptable";
export type EvidenceSupport = "direct" | "adjacent" | "unsupported";

export interface VacancyRequirement {
  id: string;
  category: VacancyRequirementCategory;
  text: string;
  sourceText: string;
  priority: VacancyRequirementPriority;
  weight: number;
  evidenceExpected: EvidenceExpectation;
}

export interface VacancyAnalysis {
  vacancyId: string;
  requirements: VacancyRequirement[];
  outcomes: string[];
  context: string[];
  risks: string[];
  provenance: {
    vacancyId: string;
    sha256: string;
    path: string;
    collectedAt: string;
  };
}

export interface RequirementEvidenceMatch {
  evidenceId?: string;
  employer?: string;
  support: EvidenceSupport;
  relevanceScore: number;
  reason: string;
}

export interface RequirementEvidenceArtifact {
  vacancyId: string;
  mappings: Array<{
    requirementId: string;
    matches: RequirementEvidenceMatch[];
    gap?: string;
  }>;
  employerRanking: Array<{
    employer: string;
    score: number;
    evidenceIds: string[];
  }>;
  uncoveredMustHaveRequirementIds: string[];
}

export interface ResumeSelectionPlan {
  requirementIds: string[];
  excludedRequirementIds: string[];
  evidenceIds: string[];
  employers: string[];
  evidenceRequirementIds: Record<string, string[]>;
  requirementReasons: Record<string, string>;
  evidenceReasons: Record<string, string>;
  employerReasons: Record<string, string>;
}
