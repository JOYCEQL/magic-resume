import type { AIModelType } from "@/config/ai";

export type ResumeAgentConfidence = "high" | "medium" | "low";
export type ResumeAgentMessageRole = "user" | "assistant";
export type ResumeAgentIssueType =
  | "missing"
  | "conflict"
  | "assumption"
  | "low-confidence"
  | "unsupported";
export type ResumeAgentIssueSeverity = "error" | "warning" | "info";

export interface ResumeAgentMessage {
  id: string;
  role: ResumeAgentMessageRole;
  content: string;
  createdAt: string;
}

export interface ResumeDraftBasicInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  employmentStatus: string;
  birthDate: string;
  website: string;
  github: string;
  linkedin: string;
}

export interface ResumeDraftEducation {
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa: string;
  details: string[];
}

export interface ResumeDraftExperience {
  company: string;
  position: string;
  date: string;
  details: string[];
}

export interface ResumeDraftProject {
  name: string;
  role: string;
  date: string;
  details: string[];
  link: string;
}

export interface ResumeDraftTargetJob {
  title: string;
  company: string;
  jobDescription: string;
  matchedKeywords: string[];
  missingSkills: string[];
}

export interface ResumeDraftEvidence {
  field: string;
  source: string;
  confidence: ResumeAgentConfidence;
}

export interface ResumeDraft {
  version: 1;
  title: string;
  language: "zh" | "en";
  targetJob: ResumeDraftTargetJob;
  basic: ResumeDraftBasicInfo;
  summary: string;
  education: ResumeDraftEducation[];
  experience: ResumeDraftExperience[];
  projects: ResumeDraftProject[];
  skills: string[];
  certifications: string[];
  missingFields: string[];
  assumptions: string[];
  conflicts: string[];
  evidence: ResumeDraftEvidence[];
  followUpQuestions: string[];
}

export interface ResumeAgentValidationIssue {
  id: string;
  type: ResumeAgentIssueType;
  severity: ResumeAgentIssueSeverity;
  field: string;
  message: string;
}

export interface ResumeAgentValidationResult {
  issues: ResumeAgentValidationIssue[];
  errorCount: number;
  warningCount: number;
  canSave: boolean;
}

export interface ResumeAgentProviderPayload {
  modelType: AIModelType;
  apiKey: string;
  model: string;
  apiEndpoint?: string;
}

export interface ResumeAgentRequest extends ResumeAgentProviderPayload {
  locale: string;
  messages: Array<Pick<ResumeAgentMessage, "role" | "content">>;
  currentDraft?: ResumeDraft | null;
}

export interface ResumeAgentResponse {
  assistantMessage: string;
  draft: ResumeDraft;
}
