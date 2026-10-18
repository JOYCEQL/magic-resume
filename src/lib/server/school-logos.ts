import { combineAbortSignals } from "../abort-signal";
import { fetchPublicResource } from "./public-fetch";
import { SCHOOL_RESULTS_PER_REQUEST, type SchoolLogo, type SchoolLogoPage } from "../../utils/schoolLogoSearch";

const ORIGIN = "https://universitylogos.top";
const CACHE_TTL = 10 * 60 * 1000;
const CACHE_LIMIT = 64;
const MAX_IN_FLIGHT = 16;
const text = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 200) : "";
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

function parseSchool(value: unknown): SchoolLogo | undefined {
  const item = record(value);
  const name = text(item.zh_name);
  const nameEn = text(item.en_name);
  const id = typeof item.id === "number" && Number.isSafeInteger(item.id) ? String(item.id) : text(item.id);
  const path = text(item.dir).replace(/\\/g, "/").replace(/^\/+/, "");
  if (!id || (!name && !nameEn) || !/^uni_logo\/[a-z0-9_./-]+\.(png|jpe?g|webp|svg)$/i.test(path) || path.split("/").includes("..")) return;
  return {
    id, name: name || nameEn, nameEn: nameEn || name, country: text(item.cn_country),
    src: `${ORIGIN}/${path}`,
    source: `${ORIGIN}/?${new URLSearchParams({ q: name || nameEn })}`,
  };
}

async function readUpstream(response: Response): Promise<unknown> {
  if (!response.body) throw new Error("Empty response");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 128 * 1024) {
        await reader.cancel();
        throw new Error("Response too large");
      }
      body += decoder.decode(value, { stream: true });
    }
    return JSON.parse(body + decoder.decode());
  } finally { reader.releaseLock(); }
}

type Pending = { controller: AbortController; users: number; promise: Promise<SchoolLogoPage> };

/** Bounded cache/deduplication per server instance; errors are never cached. */
export function createSchoolLogoHandler(
  fetcher: (url: string, options: RequestInit) => Promise<Response> = fetchPublicResource,
  now = Date.now,
  timeoutMs = 8000,
) {
  const cache = new Map<string, { result: SchoolLogoPage; expires: number }>();
  const pending = new Map<string, Pending>();

  return async (request: Request): Promise<Response> => {
    const params = new URL(request.url).searchParams;
    const query = (params.get("q") || "").normalize("NFKC").trim().replace(/\s+/g, " ");
    const page = Number(params.get("page") || 1);
    if (query.length < 2 || query.length > 100 || !Number.isSafeInteger(page) || page < 1 || page > 10000)
      return Response.json({ error: "invalidSearch" }, { status: 400 });
    const key = JSON.stringify([query.toLowerCase(), page]);
    const cached = cache.get(key);
    const success = (result: SchoolLogoPage) => Response.json(result, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=600" },
    });
    if (cached && cached.expires > now()) {
      cache.delete(key);
      cache.set(key, cached);
      return success(cached.result);
    }
    cache.delete(key);
    if (request.signal.aborted) return new Response(null, { status: 499 });
    // Workers bind asynchronous I/O to its originating request. Share only
    // completed data there; Node can also share an in-flight upstream request.
    const pendingKey = "WebSocketPair" in globalThis ? `${key}:${crypto.randomUUID()}` : key;
    let task = pending.get(pendingKey);
    if (task?.controller.signal.aborted) { pending.delete(pendingKey); task = undefined; }
    if (!task) {
      if (pending.size >= MAX_IN_FLIGHT) return Response.json({ error: "searchBusy" }, { status: 503, headers: { "Retry-After": "2" } });
      const controller = new AbortController();
      const signal = combineAbortSignals([controller.signal, AbortSignal.timeout(timeoutMs)]);
      const newTask: Pending = { controller, users: 0, promise: undefined! };
      newTask.promise = (async () => {
        const response = await fetcher(`${ORIGIN}/superone/uni_logos`, {
          method: "POST", signal,
          headers: {
            "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", "Access-Control-Allow-Origin": "*",
            Origin: ORIGIN, Referer: `${ORIGIN}/`,
            "User-Agent": "MagicResume/2.0 (https://github.com/JOYCEQL/magic-resume)",
          },
          body: JSON.stringify({
            input_text: query, page_now: page, total_page: ["搜索校徽"],
            page_size: SCHOOL_RESULTS_PER_REQUEST, timestp: now(),
            // Parameters used by the source site's current search script.
            sec: query.length * 99 + SCHOOL_RESULTS_PER_REQUEST * 99 * 50 * 68,
          }),
        });
        if (!response.ok) {
          await response.body?.cancel();
          throw new Error("Upstream unavailable");
        }
        const data = record(await readUpstream(response));
        if (!Array.isArray(data.result_list) || !Array.isArray(data.total_page) || data.total_page.length > 10000)
          throw new Error("Invalid upstream response");
        const seen = new Set<string>();
        const schools = data.result_list.slice(0, SCHOOL_RESULTS_PER_REQUEST).flatMap(value => {
          const school = parseSchool(value);
          if (!school || seen.has(school.id)) return [];
          seen.add(school.id);
          return [school];
        });
        const result = { schools, page, hasNext: page < data.total_page.length };
        if (!signal.aborted) {
          cache.set(key, { result, expires: now() + CACHE_TTL });
          if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
        }
        return result;
      })().finally(() => { if (pending.get(pendingKey) === newTask) pending.delete(pendingKey); });
      task = newTask;
      pending.set(pendingKey, task);
    }
    task.users += 1;
    let abort: () => void = () => {};
    try {
      const result = await Promise.race([
        task.promise,
        new Promise<never>((_, reject) => {
          abort = () => reject(request.signal.reason);
          request.signal.addEventListener("abort", abort, { once: true });
          if (request.signal.aborted) abort();
        }),
      ]);
      return success(result);
    } catch (error) {
      return Response.json({ error: "schoolSearchUnavailable" }, {
        status: request.signal.aborted ? 499 : error instanceof Error && error.name === "TimeoutError" ? 504 : 502,
        headers: { "Cache-Control": "no-store" },
      });
    } finally {
      request.signal.removeEventListener("abort", abort);
      task.users -= 1;
      if (task.users === 0) task.controller.abort();
    }
  };
}

export const handleSchoolLogoSearch = createSchoolLogoHandler();
