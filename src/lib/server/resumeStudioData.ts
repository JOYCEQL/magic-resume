import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  isVacancySourceCompatible,
  vacancySourceFamily,
  vacancySourceIdCandidates,
  type VacancyLaunch,
} from "@/lib/resumeTailoring";

export type EvidenceStatus =
  | "подтверждено источником"
  | "подтверждено пользователем";

export interface EvidenceItem {
  id: string;
  claim: string;
  status: EvidenceStatus;
  employer?: string;
  source: {
    path: string;
    sha256?: string;
    locator: string;
    detail?: string;
  };
}

export interface ResumeHandoffSnapshotCatalog {
  career_sha256: string;
  catalog_sha256: string;
  evidence_refs: string[];
  evidence_catalog?: unknown;
  career_document: { path: string; content: string };
}

export interface EvidenceCatalog {
  items: EvidenceItem[];
  prompt: string;
  catalogSha256: string;
  sources: Array<{ path: string; sha256: string }>;
}

const employmentIdentity: Record<
  string,
  Record<"ru" | "en", { company: string; date: string }>
> = {
  "Московская Биржа": {
    ru: { company: "Московская Биржа", date: "октябрь 2025 — настоящее время" },
    en: { company: "Moscow Exchange", date: "October 2025 – Present" },
  },
  Entangle: {
    ru: { company: "Entangle", date: "июль 2024 — август 2025" },
    en: { company: "Entangle", date: "July 2024 – August 2025" },
  },
  "Газпром нефть — Цифровые Решения": {
    ru: {
      company: "Газпром нефть — Цифровые Решения",
      date: "ноябрь 2022 — июнь 2024",
    },
    en: { company: "Gazpromneft", date: "November 2022 – June 2024" },
  },
  "Rock'n'Block": {
    ru: { company: "Rock'n'Block", date: "январь 2022 — ноябрь 2022" },
    en: { company: "Rock'n'Block", date: "January 2022 – November 2022" },
  },
  SmartHead: {
    ru: { company: "SmartHead", date: "март 2020 — декабрь 2021" },
    en: { company: "SmartHead", date: "March 2020 – December 2021" },
  },
};

export const applyCanonicalEmploymentIdentity = (
  resume: Record<string, unknown>,
  evidenceItems: EvidenceItem[],
  language: "ru" | "en",
) => {
  const experience = Array.isArray(resume.experience) ? resume.experience : [];
  const mapping = resume.evidenceMap && typeof resume.evidenceMap === "object" &&
    !Array.isArray(resume.evidenceMap)
    ? resume.evidenceMap as Record<string, string[]>
    : {};
  const evidenceById = new Map(evidenceItems.map((item) => [item.id, item]));
  const canonicalEmployerByAlias = new Map(
    Object.entries(employmentIdentity).flatMap(([employer, identity]) => [
      [employer, employer],
      [identity.ru.company, employer],
      [identity.en.company, employer],
    ]),
  );
  const transferRefs = (before: string, after: string, canonicalRefs: string[]) => {
    const refs = [...(mapping[before] || []), ...canonicalRefs];
    if (refs.length > 0) {
      mapping[after] = Array.from(new Set([...(mapping[after] || []), ...refs]));
    }
  };

  for (const value of experience) {
    if (!value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    const claims = [item.company, item.position, item.date,
      ...(Array.isArray(item.details) ? item.details : [])]
      .filter((claim): claim is string => typeof claim === "string");
    const company = typeof item.company === "string" ? item.company : "";
    const employer = canonicalEmployerByAlias.get(company) ||
      (mapping[company] || [])
      .map((ref) => evidenceById.get(ref)?.employer)
      .find((scope): scope is string => Boolean(scope && employmentIdentity[scope])) ||
      claims
        .flatMap((claim) => mapping[claim] || [])
        .map((ref) => evidenceById.get(ref)?.employer)
        .find((scope): scope is string => Boolean(scope && employmentIdentity[scope]));
    if (!employer) continue;

    const identity = employmentIdentity[employer][language];
    const oldCompany = typeof item.company === "string" ? item.company : "";
    const oldDate = typeof item.date === "string" ? item.date : "";
    const employerRefs = evidenceItems
      .filter((fact) => fact.employer === employer && fact.claim.startsWith("Работодатель:"))
      .map((fact) => fact.id);
    const dateRefs = evidenceItems
      .filter((fact) => fact.employer === employer && fact.claim.startsWith("Период:"))
      .map((fact) => fact.id);
    transferRefs(oldCompany, identity.company, employerRefs);
    transferRefs(oldDate, identity.date, dateRefs);
    item.company = identity.company;
    item.date = identity.date;
    if (Array.isArray(item.details)) {
      item.details = item.details.filter((detail) =>
        typeof detail === "string" && (mapping[detail] || []).some((ref) =>
          evidenceById.get(ref)?.employer === employer));
    }
  }
  return resume;
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const DEFAULT_WORKSPACE_ROOT = "/Users/ryand/dev/Job_seeker";
const MIN_FULL_DESCRIPTION_LENGTH = 500;

export const resolveResumeStudioPaths = (
  env: Record<string, string | undefined>,
) => {
  const workspaceRoot = env.RESUME_STUDIO_WORKSPACE_ROOT || DEFAULT_WORKSPACE_ROOT;
  return {
    workspaceRoot,
    careerMasterPath: env.RESUME_STUDIO_MASTER_PROFILE || join(workspaceRoot, "01_profile", "career-master.md"),
  };
};

const normalizedStatus = (value: string): EvidenceStatus | null => {
  const status = value.trim().toLowerCase();
  if (status === "подтверждено источником") return "подтверждено источником";
  if (status === "подтверждено пользователем") return "подтверждено пользователем";
  return null;
};

const forbiddenHeading = (value: string) =>
  /не позиционировать без новых доказательств|claims, которые нельзя усиливать без подтверждения/i.test(value);

const CONFIRMED_STATUSES = new Set<EvidenceStatus>([
  "подтверждено источником",
  "подтверждено пользователем",
]);

export const evidenceCatalogPrompt = (items: EvidenceItem[]) =>
  items
    .map((item) => `[${item.id}]${item.employer ? ` [Работодатель: ${item.employer}]` : ""} (${item.status}) ${item.claim}`)
    .join("\n");

const isFrozenEvidenceItem = (value: unknown): value is EvidenceItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  const source = item.source;
  const status = item.status;
  return typeof item.id === "string" &&
    /^E-[a-f0-9]{16}$/.test(item.id) &&
    typeof item.claim === "string" &&
    item.claim.trim().length > 0 &&
    (status === "подтверждено источником" || status === "подтверждено пользователем") &&
    CONFIRMED_STATUSES.has(status) &&
    (item.employer === undefined || typeof item.employer === "string") &&
    !!source &&
    typeof source === "object" &&
    typeof (source as { path?: unknown }).path === "string" &&
    typeof (source as { locator?: unknown }).locator === "string";
};

export const catalogFromHandoffSnapshot = (
  snapshot: ResumeHandoffSnapshotCatalog,
): EvidenceCatalog => {
  const contentHash = sha256(snapshot.career_document.content);
  if (contentHash !== snapshot.career_sha256) {
    throw new Error("RESUME_HANDOFF_CATALOG_MISMATCH");
  }
  const frozen = Array.isArray(snapshot.evidence_catalog) ? snapshot.evidence_catalog : [];
  const items = frozen.filter(isFrozenEvidenceItem);
  if (items.length === 0 || items.length !== frozen.length) {
    throw new Error("RESUME_HANDOFF_CATALOG_MISMATCH");
  }
  const frozenIds = items.map((item) => item.id);
  const refs = new Set(snapshot.evidence_refs);
  if (frozenIds.length !== refs.size || frozenIds.some((id) => !refs.has(id))) {
    throw new Error("RESUME_HANDOFF_CATALOG_MISMATCH");
  }
  return {
    items,
    prompt: evidenceCatalogPrompt(items),
    catalogSha256: snapshot.catalog_sha256,
    sources: [{ path: snapshot.career_document.path, sha256: contentHash }],
  };
};

export const catalogFromJobSeeker = (value: unknown): EvidenceCatalog => {
  if (!value || typeof value !== "object") throw new Error("CAREER_CATALOG_INVALID");
  const payload = value as { catalog_sha256?: unknown; claims?: unknown };
  if (typeof payload.catalog_sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(payload.catalog_sha256) ||
      !Array.isArray(payload.claims)) {
    throw new Error("CAREER_CATALOG_INVALID");
  }
  const items = payload.claims.filter(isFrozenEvidenceItem);
  if (items.length === 0 || items.length !== payload.claims.length) {
    throw new Error("CAREER_CATALOG_INVALID");
  }
  const sources = Array.from(new Map(items.flatMap((item) => {
    const sourceHash = item.source.sha256;
    return typeof sourceHash === "string" && /^[a-f0-9]{64}$/.test(sourceHash)
      ? [[
        `${item.source.path}\n${sourceHash}`,
        { path: item.source.path, sha256: sourceHash },
      ] as const]
      : [];
  })).values());
  return {
    items,
    prompt: evidenceCatalogPrompt(items),
    catalogSha256: payload.catalog_sha256,
    sources,
  };
};

export const buildEvidenceCatalog = (
  documents: Array<{ path: string; content: string }>,
): EvidenceCatalog => {
  const items: EvidenceItem[] = [];
  const sources = documents.map(({ path, content }) => ({ path, sha256: sha256(content) }));

  for (const document of documents) {
    const sourceHash = sha256(document.content);
    const lines = document.content.split(/\r?\n/);
    let forbiddenLevel: number | null = null;
    let inCareerChronology = false;
    let currentEmployer: string | undefined;

    lines.forEach((rawLine, index) => {
      const line = rawLine.trim();
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        if (forbiddenLevel !== null && level <= forbiddenLevel) forbiddenLevel = null;
        if (forbiddenHeading(heading[2])) forbiddenLevel = level;
        if (level === 1) {
          inCareerChronology = /^карьерная хронология$/i.test(heading[2].trim());
          currentEmployer = undefined;
        } else if (inCareerChronology && level === 2) {
          currentEmployer = heading[2].trim();
          addItem(
            `Работодатель: ${currentEmployer}`,
            "подтверждено источником",
            `line:${index + 1}`,
            undefined,
            currentEmployer,
          );
        }
        return;
      }
      if (forbiddenHeading(line.replace(/:\s*$/, ""))) {
        forbiddenLevel = 7;
        return;
      }
      if (!line || forbiddenLevel !== null) return;

      const table = line.match(/^\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|$/);
      if (table && !/^[-: ]+$/.test(table[1])) {
        const status = normalizedStatus(table[2]);
        if (!status) return;
        const employer = table[3].match(/(?:^|;\s*)работодатель:\s*([^;]+)/i)?.[1].trim();
        addItem(table[1], status, `line:${index + 1}`, table[3], employer);
        return;
      }

      const bullet = line.match(/^[-*+]\s+(.+)$/);
      if (!bullet) return;
      if (currentEmployer && /^(?:Период|Официальная должность):\s*.+/i.test(bullet[1])) {
        addItem(
          bullet[1].trim(),
          "подтверждено источником",
          `line:${index + 1}`,
          undefined,
          currentEmployer,
        );
        return;
      }
      const statusMatch = bullet[1].match(/`(подтверждено источником|подтверждено пользователем)`/i);
      const status = statusMatch ? normalizedStatus(statusMatch[1]) : null;
      if (!status) return;
      const claim = bullet[1]
        .replace(/\s*`(?:подтверждено источником|подтверждено пользователем)`[.;]?/ig, "")
        .trim();
      addItem(claim, status, `line:${index + 1}`, undefined, currentEmployer);

      function addItem(
        claim: string,
        status: EvidenceStatus,
        locator: string,
        detail?: string,
        employer?: string,
      ) {
        const normalizedClaim = claim.replace(/\s+/g, " ").trim();
        if (!normalizedClaim) return;
        const id = `E-${sha256(`${document.path}\n${employer || ""}\n${normalizedClaim}\n${status}`).slice(0, 16)}`;
        items.push({
          id,
          claim: normalizedClaim,
          status,
          ...(employer ? { employer } : {}),
          source: {
            path: document.path,
            sha256: sourceHash,
            locator,
            ...(detail?.trim() ? { detail: detail.trim() } : {}),
          },
        });
      }
    });
  }

  const uniqueItems = Array.from(new Map(items.map((item) => [item.id, item])).values());
  return {
    items: uniqueItems,
    prompt: evidenceCatalogPrompt(uniqueItems),
    catalogSha256: sha256(JSON.stringify(uniqueItems)),
    sources,
  };
};

export const employerCoverageErrors = (
  resume: Record<string, unknown>,
  evidenceItems: EvidenceItem[],
) => {
  const experience = Array.isArray(resume.experience) ? resume.experience : [];
  const evidenceMap = resume.evidenceMap && typeof resume.evidenceMap === "object" &&
    !Array.isArray(resume.evidenceMap)
    ? resume.evidenceMap as Record<string, unknown>
    : {};
  const evidenceById = new Map(evidenceItems.map((item) => [item.id, item]));
  const errors: string[] = [];

  for (const value of experience) {
    if (!value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    const company = typeof item.company === "string" ? item.company.trim() : "";
    const companyRefs = Array.isArray(evidenceMap[company])
      ? evidenceMap[company] as unknown[]
      : [];
    const scopedCompanyEvidence = companyRefs
      .map((ref) => typeof ref === "string" ? evidenceById.get(ref) : undefined)
      .filter((fact): fact is EvidenceItem => Boolean(fact?.employer));
    const employer = scopedCompanyEvidence.find((fact) =>
      fact.claim.startsWith("Работодатель:"))?.employer;
    if (!employer) {
      errors.push(`unsupported employer identity: ${company || "<empty>"}`);
      continue;
    }
    const claims = [item.company, item.position, item.date,
      ...(Array.isArray(item.details) ? item.details : [])]
      .filter((claim): claim is string => typeof claim === "string" && Boolean(claim.trim()));
    for (const claim of claims) {
      const refs = Array.isArray(evidenceMap[claim]) ? evidenceMap[claim] as unknown[] : [];
      const scopedEmployers = new Set(refs
        .map((ref) => typeof ref === "string" ? evidenceById.get(ref)?.employer : undefined)
        .filter((scope): scope is string => Boolean(scope)));
      const hasEmployerEvidence = scopedEmployers.has(employer);
      if (!hasEmployerEvidence) {
        errors.push(`claim lacks ${employer} evidence: ${claim.slice(0, 80)}`);
      }
      if (!hasEmployerEvidence && Array.from(scopedEmployers).some((scope) => scope !== employer)) {
        errors.push(`cross-employer evidence for ${employer}: ${claim.slice(0, 80)}`);
      }
    }
  }

  return errors;
};

const collectJsonFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectJsonFiles(path);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".json") ? [path] : [];
  }));
  return files.flat();
};

const collectObjects = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) return value.flatMap(collectObjects);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  return [record, ...Object.values(record).flatMap(collectObjects)];
};

const stringValue = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const dateValue = (record: Record<string, unknown>, fileName: string) => {
  const direct = stringValue(record.collected_at || record.scraped_at || record.updated_at);
  const parsed = Date.parse(direct);
  if (Number.isFinite(parsed)) return { timestamp: parsed, collectedAt: direct };
  const dated = fileName.match(/20\d{2}-\d{2}-\d{2}/)?.[0] || "";
  const timestamp = Date.parse(dated);
  return { timestamp: Number.isFinite(timestamp) ? timestamp : 0, collectedAt: dated };
};

export interface TrustedVacancy {
  source_id: string;
  title: string;
  company: string;
  location: string;
  employment_type: string;
  workplace_type: string;
  salary: string;
  published_date: string;
  url: string;
  description: string;
  description_quality: "full";
  tracker_id: string;
  tracker_language: "ru" | "en";
  tracker_source: string;
  semantic_fingerprint: string;
  provenance: {
    path: string;
    sha256: string;
    collectedAt: string;
  };
}

const resolveOperationalVacancy = async (
  workspaceRoot: string,
  launch: VacancyLaunch,
  fetchImpl: typeof fetch,
  capabilityToken: string,
): Promise<TrustedVacancy | null> => {
  if (!/^(?:AUTO-|MANUAL-)/i.test(launch.id)) return null;
  const endpoint = `http://127.0.0.1:8765/api/v1/vacancies/${encodeURIComponent(launch.id)}`;
  const response = await fetchImpl(endpoint, {
    headers: capabilityToken
      ? { Authorization: `Bearer ${capabilityToken}` }
      : undefined,
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`OPERATIONAL_VACANCY_${response.status}`);
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > 250_000) throw new Error("OPERATIONAL_VACANCY_TOO_LARGE");
  const rawPayload = await response.text();
  if (Buffer.byteLength(rawPayload) > 250_000) throw new Error("OPERATIONAL_VACANCY_TOO_LARGE");
  const payload = JSON.parse(rawPayload) as Record<string, unknown>;
  const payloadSource = stringValue(payload.source);
  const family = vacancySourceFamily(launch.id);
  const sourceOk = family
    ? isVacancySourceCompatible(launch.id, payloadSource)
    : payloadSource.trim().toLowerCase().replace(/^www\./, "") ===
      launch.source.trim().toLowerCase().replace(/^www\./, "");
  if (stringValue(payload.id) !== launch.id || !sourceOk) {
    throw new Error("OPERATIONAL_VACANCY_IDENTITY_MISMATCH");
  }
  const sourcePayloadRaw = stringValue(payload.source_payload);
  const sourcePayload = sourcePayloadRaw
    ? JSON.parse(sourcePayloadRaw) as Record<string, unknown>
    : {};
  const rawDescription = stringValue(sourcePayload.description);
  const description = rawDescription.trim();
  if (description.length < MIN_FULL_DESCRIPTION_LENGTH) return null;
  const descriptionHash = sha256(rawDescription);
  if (stringValue(payload.description_hash) !== descriptionHash) {
    throw new Error("OPERATIONAL_VACANCY_HASH_MISMATCH");
  }
  const collectedAt = stringValue(
    payload.last_checked_at || payload.last_seen_at || payload.date_found,
  );
  if (!Number.isFinite(Date.parse(collectedAt))) {
    throw new Error("VACANCY_PROVENANCE_DATE_MISSING");
  }
  const sourceId = stringValue(sourcePayload.id) ||
    vacancySourceIdCandidates(launch.id).find((value) => value !== launch.id) || launch.id;
  return {
    source_id: sourceId,
    title: stringValue(payload.role || sourcePayload.title),
    company: stringValue(payload.company || sourcePayload.company),
    location: stringValue(payload.location || sourcePayload.location),
    employment_type: stringValue(sourcePayload.employment_type),
    workplace_type: stringValue(payload.work_format || sourcePayload.workplace_type),
    salary: stringValue(sourcePayload.salary),
    published_date: stringValue(sourcePayload.date_posted || sourcePayload.datePosted),
    url: stringValue(payload.url || sourcePayload.url) || launch.url,
    description: description.slice(0, 24_000),
    description_quality: "full",
    tracker_id: launch.id,
    tracker_language: launch.language,
    tracker_source: launch.source,
    semantic_fingerprint: stringValue(payload.fit_input_vacancy_fingerprint),
    provenance: {
      path: join(workspaceRoot, "04_vacancies", `job-seeker.sqlite3#vacancies/${launch.id}`),
      sha256: sha256(sourcePayloadRaw),
      collectedAt,
    },
  };
};

export const resolveTrustedVacancy = async (
  workspaceRoot: string,
  launch: VacancyLaunch,
  fetchImpl: typeof fetch = fetch,
  capabilityToken = "",
): Promise<TrustedVacancy> => {
  const family = vacancySourceFamily(launch.id);
  if (!family || !isVacancySourceCompatible(launch.id, launch.source)) {
    const operational = await resolveOperationalVacancy(
      workspaceRoot,
      launch,
      fetchImpl,
      capabilityToken,
    );
    if (operational) return operational;
    throw new Error("INVALID_VACANCY_SOURCE");
  }
  const ids = new Set(vacancySourceIdCandidates(launch.id));
  const marketRoot = join(workspaceRoot, "07_market");
  const files = await collectJsonFiles(marketRoot);
  const matches: Array<{
    record: Record<string, unknown>;
    description: string;
    path: string;
    contentHash: string;
    timestamp: number;
    collectedAt: string;
  }> = [];

  for (const path of files) {
    const relativePath = relative(marketRoot, path).replaceAll("\\", "/");
    if (!relativePath.toLowerCase().includes(family)) continue;
    let content: string;
    let parsed: unknown;
    try {
      content = await readFile(path, "utf8");
      parsed = JSON.parse(content);
    } catch {
      continue;
    }
    const envelope = parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
    const envelopeDate = dateValue(envelope, relativePath);
    for (const record of collectObjects(parsed)) {
      const recordIds = [record.id, record.linkedin_id, record.vacancy_id, (record.identifier as Record<string, unknown> | undefined)?.value]
        .map(stringValue)
        .filter(Boolean);
      if (!recordIds.some((id) => ids.has(id))) continue;
      const description = stringValue(record.description || record.full_description || record.offer_description).trim();
      if (description.length < MIN_FULL_DESCRIPTION_LENGTH) continue;
      const recordDate = dateValue(record, relativePath);
      const snapshotDate = recordDate.timestamp >= envelopeDate.timestamp
        ? recordDate
        : envelopeDate;
      matches.push({
        record,
        description,
        path,
        contentHash: sha256(content),
        timestamp: snapshotDate.timestamp,
        collectedAt: snapshotDate.collectedAt,
      });
    }
  }

  if (matches.length === 0) {
    const operational = await resolveOperationalVacancy(
      workspaceRoot,
      launch,
      fetchImpl,
      capabilityToken,
    );
    if (operational) return operational;
    throw new Error("VACANCY_FULL_DESCRIPTION_NOT_FOUND");
  }
  const datedMatches = matches.filter((match) => match.timestamp > 0 && match.collectedAt);
  if (datedMatches.length === 0) throw new Error("VACANCY_PROVENANCE_DATE_MISSING");
  datedMatches.sort((left, right) =>
    right.timestamp - left.timestamp || right.description.length - left.description.length,
  );
  const match = datedMatches[0];
  const record = match.record;
  return {
    source_id: stringValue(record.id || record.linkedin_id || record.vacancy_id || (record.identifier as Record<string, unknown> | undefined)?.value),
    title: stringValue(record.title || record.name || record.role),
    company: stringValue(record.company || record.company_name || record.employer || (record.hiringOrganization as Record<string, unknown> | undefined)?.name),
    location: stringValue(record.location || record.area || record.city),
    employment_type: stringValue(record.employment_type || record.schedule),
    workplace_type: stringValue(record.workplace_type || record.work_format),
    salary: stringValue(record.salary || record.compensation),
    published_date: stringValue(record.published_date || record.created_at || record.datePosted),
    url: stringValue(record.url) || launch.url,
    description: match.description.slice(0, 24_000),
    description_quality: "full",
    tracker_id: launch.id,
    tracker_language: launch.language,
    tracker_source: launch.source,
    semantic_fingerprint: "",
    provenance: {
      path: match.path,
      sha256: match.contentHash,
      collectedAt: match.collectedAt,
    },
  };
};
