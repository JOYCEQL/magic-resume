export interface SchoolLogo {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  src: string;
  source: string;
}

export interface SchoolLogoPage {
  schools: SchoolLogo[];
  page: number;
  hasNext: boolean;
}

export const SCHOOL_SEARCH_DELAY = 300;
export const SCHOOL_RESULTS_PER_VIEW = 6;
export const SCHOOL_RESULTS_PER_REQUEST = 12;
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_LIMIT = 40;

/** Memory-only cache survives drawer reopening without storing an entire catalog. */
export function createSchoolLogoSearch(fetcher: typeof fetch = fetch, now = Date.now) {
  const cache = new Map<string, { expires: number; result: SchoolLogoPage }>();
  return async (query: string, page: number, signal: AbortSignal): Promise<SchoolLogoPage> => {
    const term = query.normalize("NFKC").trim().replace(/\s+/g, " ");
    if (signal.aborted) throw signal.reason;
    if (term.length < 2) return { schools: [], page: 1, hasNext: false };
    const key = JSON.stringify([term.toLowerCase(), page]);
    const cached = cache.get(key);
    if (cached && cached.expires > now()) {
      cache.delete(key);
      cache.set(key, cached);
      return cached.result;
    }
    cache.delete(key);
    const response = await fetcher(`/api/school-logos?${new URLSearchParams({ q: term, page: String(page) })}`, { signal });
    if (!response.ok) throw new Error("School search unavailable");
    const result: SchoolLogoPage = await response.json();
    if (!Array.isArray(result.schools) || result.schools.length > SCHOOL_RESULTS_PER_REQUEST || result.page !== page)
      throw new Error("Invalid school search response");
    if (signal.aborted) throw signal.reason;
    cache.set(key, { result, expires: now() + CACHE_TTL });
    if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
    return result;
  };
}

export const searchSchoolLogos = createSchoolLogoSearch();
