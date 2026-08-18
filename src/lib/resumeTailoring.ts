export interface VacancyLaunch {
  id: string;
  source: string;
  language: "ru" | "en";
  company: string;
  role: string;
  url: string;
}

export interface TailoringAudit {
  score: number;
  summary: string;
  directEvidence: string[];
  adjacentEvidence: string[];
  gaps: string[];
  excludedClaims: string[];
}

export interface TailoredResumeResult {
  title: string;
  language: "ru" | "en";
  targetRole: string;
  basic: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    employementStatus?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    position: string;
    date: string;
    details: string[];
  }>;
  projects: Array<{
    name: string;
    role: string;
    date: string;
    description: string[];
    link?: string;
  }>;
  education: Array<{
    school: string;
    major: string;
    degree: string;
    startDate: string;
    endDate: string;
    description?: string[];
  }>;
  skills: string[];
  evidenceMap: Record<string, string[]>;
  requirementMap: Record<string, string[]>;
  audit: TailoringAudit;
}

const text = (params: URLSearchParams, key: string) =>
  (params.get(key) || "").trim();

export const parseVacancyLaunch = (search: string): VacancyLaunch | null => {
  const params = new URLSearchParams(search);
  if (params.get("studio") !== "vacancy") return null;

  const id = text(params, "id");
  const role = text(params, "role");
  if (!id || !role) return null;

  return {
    id,
    source: text(params, "source"),
    language: text(params, "language").toLowerCase() === "en" ? "en" : "ru",
    company: text(params, "company"),
    role,
    url: text(params, "url"),
  };
};


export const isAggregateYearsClaim = (value: string) => {
  const count = "(?:\\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|один|одна|два|две|три|четыре|пять|шесть|семь|восемь|девять|десять)";
  const years = "(?:лет|года?|years?|yrs?\\.?)";
  return [
    `${count}\\s*\\+\\s*${years}`,
    `${count}\\s*${years}(?:\\s+of)?\\s+(?:опыт[а-яё]*|experience)`,
    `(?:опыт[а-яё]*|experience)\\s*(?::|[-–—])?\\s*(?:of\\s+|более\\s+|over\\s+)?${count}\\s*${years}`,
    `${count}\\s*[-‑]\\s*(?:летн[а-яё]*|year)\\s+(?:опыт[а-яё]*|experience)`,
  ].some((pattern) => new RegExp(`(?:^|[^A-Za-zА-Яа-яЁё\\d])${pattern}(?:$|[^A-Za-zА-Яа-яЁё])`, "i").test(value));
};


export const assertTailoredResume = (
  value: unknown,
  expectedLanguage?: "ru" | "en",
): TailoredResumeResult => {
  if (!value || typeof value !== "object") {
    throw new Error("AI returned an empty resume");
  }

  const result = value as Partial<TailoredResumeResult>;
  if ((result.language !== "ru" && result.language !== "en") ||
      !result.title?.trim() ||
      !result.targetRole?.trim() ||
      !result.summary?.trim()) {
    throw new Error("AI response is missing the target role or summary");
  }
  if (expectedLanguage && result.language !== expectedLanguage) {
    throw new Error("AI response uses the wrong language");
  }
  const validText = (item: unknown, max = 4_000) =>
    typeof item === "string" && item.trim().length > 0 && item.length <= max;
  const stringList = (items: unknown) =>
    Array.isArray(items) && items.length <= 20 && items.every((item) => validText(item));
  if (!result.basic ||
      [result.basic.name, result.basic.title, result.basic.email,
        result.basic.phone, result.basic.location].some((item) => typeof item !== "string")) {
    throw new Error("AI response contains invalid contact data");
  }
  const resumeFacing = JSON.stringify({
    basic: result.basic,
    summary: result.summary,
    experience: result.experience,
    projects: result.projects,
    education: result.education,
    skills: result.skills,
  });
  if (isAggregateYearsClaim(resumeFacing)) {
    throw new Error("AI response contains a prohibited aggregate total-years claim");
  }
  if (!Array.isArray(result.experience) || result.experience.length === 0 ||
      result.experience.some((item) =>
        !item || !validText(item.company, 300) ||
        !validText(item.position, 300) || !validText(item.date, 100) ||
        !stringList(item.details) || item.details.length === 0) ||
      result.experience.length > 8) {
    throw new Error("AI response does not contain relevant experience");
  }
  if (!stringList(result.skills)) {
    throw new Error("AI response does not contain relevant skills");
  }
  if (!Array.isArray(result.projects) || result.projects.some((item) =>
    !item || !validText(item.name, 300) || !validText(item.role, 300) ||
    !validText(item.date, 100) || !stringList(item.description)) ||
    result.projects.length > 5) {
    throw new Error("AI response contains invalid project data");
  }
  if (!Array.isArray(result.education) || result.education.some((item) =>
    !item || !validText(item.school, 300) || !validText(item.major, 300) ||
    typeof item.degree !== "string" || !validText(item.startDate, 100) ||
    !validText(item.endDate, 100) ||
    (item.description !== undefined && !stringList(item.description)))) {
    throw new Error("AI response contains invalid education data");
  }
  if (!result.audit || typeof result.audit.summary !== "string" ||
      !stringList(result.audit.gaps) || !stringList(result.audit.directEvidence) ||
      !stringList(result.audit.adjacentEvidence) ||
      !stringList(result.audit.excludedClaims)) {
    throw new Error("AI response does not contain an evidence audit");
  }
  if (!result.evidenceMap || typeof result.evidenceMap !== "object" ||
      Array.isArray(result.evidenceMap) ||
      Object.values(result.evidenceMap).some((refs) => !stringList(refs))) {
    throw new Error("AI response does not contain claim-level evidence references");
  }
  if (!result.requirementMap || typeof result.requirementMap !== "object" ||
      Array.isArray(result.requirementMap) ||
      Object.values(result.requirementMap).some((refs) =>
        !stringList(refs) || refs.some((ref) => !/^R\d{3}$/.test(ref)))) {
    throw new Error("AI response does not contain claim-level requirement provenance");
  }

  const rawScore = Number(result.audit.score);
  if (!Number.isInteger(rawScore) || rawScore < 0 || rawScore > 100) {
    throw new Error("AI response contains an invalid fit score");
  }
  result.audit.score = rawScore;

  return result as TailoredResumeResult;
};
