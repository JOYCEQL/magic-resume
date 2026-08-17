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

export const normalizeRequirementMap = (value: unknown) => {
  const normalized: Record<string, string[]> = {};
  if (!Array.isArray(value)) return normalized;
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const { claim, requirementIds } = item as {
      claim?: unknown;
      requirementIds?: unknown;
    };
    if (typeof claim !== "string" || !claim.trim() || !Array.isArray(requirementIds)) {
      continue;
    }
    const ids = requirementIds
      .filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
      .map((id) => id.trim());
    if (ids.length === 0) continue;
    const key = claim.trim();
    normalized[key] = Array.from(new Set([...(normalized[key] || []), ...ids]));
  }
  return normalized;
};

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

export const vacancySourceIdCandidates = (id: string) => {
  const values = new Set([id]);
  const tail = id.match(
    /(?:(?:RU|AUTO)-(?:HH|GETMATCH|HIRIFY)-|EU-LI-|AUTO-LINKEDIN-)(.+)$/i,
  )?.[1];
  if (tail) values.add(tail);
  const indeedTail = id.match(/^(?:EU-IN-|AUTO-INDEED-)(.+)$/i)?.[1];
  if (indeedTail) {
    values.add(indeedTail);
    if (indeedTail.toLowerCase().startsWith("in-")) {
      values.add(indeedTail.slice(3));
    } else {
      values.add(`in-${indeedTail}`);
    }
  }
  return Array.from(values);
};

export type VacancySourceFamily =
  | "hh"
  | "getmatch"
  | "linkedin"
  | "indeed"
  | "hirify";

export const vacancySourceFamily = (id: string): VacancySourceFamily | null => {
  if (/^(?:RU|AUTO)-HH-/i.test(id)) return "hh";
  if (/^(?:RU|AUTO)-GETMATCH-/i.test(id)) return "getmatch";
  if (/^(?:EU-LI-|AUTO-LINKEDIN-)/i.test(id)) return "linkedin";
  if (/^(?:EU-IN-|AUTO-INDEED-)/i.test(id)) return "indeed";
  if (/^(?:RU|AUTO)-HIRIFY-/i.test(id)) return "hirify";
  return null;
};

export const isVacancySourceCompatible = (id: string, source: string) => {
  const family = vacancySourceFamily(id);
  if (!family) return false;
  const normalized = source.trim().toLowerCase().replace(/^www\./, "");
  const allowed: Record<VacancySourceFamily, string[]> = {
    hh: ["hh", "hh.ru"],
    getmatch: ["getmatch", "getmatch.ru"],
    linkedin: ["linkedin", "linkedin.com"],
    indeed: ["indeed", "indeed.com"],
    hirify: ["hirify", "hirify.me", "hirify.com"],
  };
  return allowed[family].includes(normalized);
};

const unsafeCareerLine = /требу(?:ет|ют) подтверждения|requires? confirmation|гипотез|hypothes|не использовать|не доказан|не создавать|нельзя |не называть|не позиционировать|не зафиксирован|желательно проверить|проверить актуальность|ожидаем/i;

export const buildAllowedCareerFacts = (markdown: string) => {
  const facts = new Map<string, string>();
  const promptLines: string[] = [];
  let skipLevel: number | null = null;
  let index = 0;

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      if (skipLevel !== null && level <= skipLevel) skipLevel = null;
      if (/claims, которые нельзя/i.test(heading[2])) {
        skipLevel = level;
        continue;
      }
    }
    if (skipLevel !== null || unsafeCareerLine.test(line)) continue;
    const id = `F${String(++index).padStart(4, "0")}`;
    facts.set(id, line);
    promptLines.push(`[${id}] ${line}`);
  }

  return { facts, prompt: promptLines.join("\n") };
};

export const semanticVerdictsPass = (
  expectedIds: string[],
  value: unknown,
) => {
  if (!value || typeof value !== "object") return false;
  const verdicts = (value as { verdicts?: unknown }).verdicts;
  if (!Array.isArray(verdicts) || verdicts.length !== expectedIds.length) return false;
  const verified = new Set(
    verdicts
      .filter((item) => item && typeof item === "object" &&
        typeof item.id === "string" && item.supported === true)
      .map((item) => item.id as string),
  );
  return verified.size === expectedIds.length &&
    expectedIds.every((id) => verified.has(id));
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

export const applyTrustedVacancyIdentity = (
  value: Record<string, unknown>,
  vacancy: { title: string; company: string },
  language: "ru" | "en",
) => {
  const role = vacancy.title.trim();
  if (!role) throw new Error("Trusted vacancy does not contain a role title");
  value.targetRole = role;
  value.title = `${vacancy.company.trim() || "Vacancy"} — ${role} — ${language.toUpperCase()}`;
  if (!value.basic || typeof value.basic !== "object" || Array.isArray(value.basic)) {
    value.basic = {};
  }
  (value.basic as Record<string, unknown>).title = role;
  return value;
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
