import type { JobPosting, ResearchSource } from "@/types/resume-agent";
import { fingerprintText, roleSimilarity } from "./career-ops";

const slugify = (company: string) =>
  company
    .toLowerCase()
    .replace(/\([^)]*\)|（[^）]*）/g, "")
    .replace(/\b(inc|llc|ltd|limited|corp|corporation|company|technologies|technology)\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 50);

const fetchJson = async <T>(url: string, signal: AbortSignal): Promise<T | null> => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, {
      redirect: "error",
      headers: { Accept: "application/json", "User-Agent": "MagicResumeResearchBot/1.0" },
      signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
    }).catch(() => null);
    if (!response) return null;
    if (response.status === 404) return null;
    if ((response.status === 429 || response.status >= 500) && attempt === 0) continue;
    if (!response.ok) return null;
    try {
      return await response.json() as T;
    } catch {
      return null;
    }
  }
  return null;
};

const text = (value: unknown) => typeof value === "string" ? value : "";
const htmlToText = (value: string) =>
  value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();

interface DiscoveredJobs {
  postings: JobPosting[];
  sources: ResearchSource[];
  attempted: string[];
}

export const discoverPublicAtsJobs = async (
  company: string,
  targetRole: string,
  signal: AbortSignal
): Promise<DiscoveredJobs> => {
  const slug = slugify(company);
  if (!slug || slug.length < 2) return { postings: [], sources: [], attempted: [] };
  const attempted = ["Greenhouse", "Lever", "Ashby"];
  const [greenhouse, lever, ashby] = await Promise.all([
    fetchJson<{ jobs?: Array<{ id?: number; title?: string; location?: { name?: string }; absolute_url?: string; content?: string; updated_at?: string }> }>(
      `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`,
      signal
    ),
    fetchJson<Array<{ id?: string; text?: string; hostedUrl?: string; categories?: { location?: string }; descriptionPlain?: string; additionalPlain?: string; createdAt?: number }>>(
      `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`,
      signal
    ),
    fetchJson<{ jobs?: Array<{ id?: string; title?: string; location?: string; jobUrl?: string; descriptionPlain?: string; publishedAt?: string }> }>(
      `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`,
      signal
    ),
  ]);

  const candidates: Array<Omit<JobPosting, "id" | "sourceIds" | "fingerprint"> & { provider: string }> = [];
  for (const job of greenhouse?.jobs || []) {
    candidates.push({
      provider: "Greenhouse",
      company,
      title: text(job.title),
      location: text(job.location?.name),
      url: text(job.absolute_url),
      description: htmlToText(text(job.content)),
      status: "active",
      publishedAt: text(job.updated_at),
    });
  }
  for (const job of lever || []) {
    candidates.push({
      provider: "Lever",
      company,
      title: text(job.text),
      location: text(job.categories?.location),
      url: text(job.hostedUrl),
      description: [text(job.descriptionPlain), text(job.additionalPlain)].filter(Boolean).join("\n"),
      status: "active",
      publishedAt: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
    });
  }
  for (const job of ashby?.jobs || []) {
    candidates.push({
      provider: "Ashby",
      company,
      title: text(job.title),
      location: text(job.location),
      url: text(job.jobUrl),
      description: text(job.descriptionPlain),
      status: "active",
      publishedAt: text(job.publishedAt),
    });
  }

  const filtered = candidates
    .filter((job) => job.title && (!targetRole || roleSimilarity(job.title, targetRole) >= 0.2 || job.title.toLowerCase().includes(targetRole.toLowerCase())))
    .slice(0, 20);
  const sourceByProvider = new Map<string, ResearchSource>();
  for (const candidate of filtered) {
    if (!sourceByProvider.has(candidate.provider)) {
      sourceByProvider.set(candidate.provider, {
        id: crypto.randomUUID(),
        type: "ats",
        title: `${company} ${candidate.provider} 公共招聘源`,
        url: candidate.url,
        publisher: candidate.provider,
        retrievedAt: new Date().toISOString(),
        trustScore: 95,
        excerpt: `通过 ${candidate.provider} 公共招聘接口发现目标岗位`,
      });
    }
  }
  const postings = filtered.map(({ provider, ...candidate }) => {
    const description = candidate.description.slice(0, 60_000);
    return {
      ...candidate,
      id: crypto.randomUUID(),
      sourceIds: [sourceByProvider.get(provider)!.id],
      fingerprint: fingerprintText(`${candidate.title}\n${description}`),
      description,
    } satisfies JobPosting;
  });
  return {
    postings: postings.filter((posting, index, all) =>
      all.findIndex((candidate) => candidate.fingerprint === posting.fingerprint) === index
    ),
    sources: [...sourceByProvider.values()],
    attempted,
  };
};
