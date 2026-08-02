import type { ResearchSource } from "@/types/resume-agent";

/**
 * 通用 Web 搜索适配器。
 * 后端是自托管 SearXNG 的 JSON API：不需要商业 API Key，
 * 实例地址必须由部署方通过环境变量显式提供，不做任何自动发现。
 * 未配置时返回 configured:false，工作流据此把「未搜索」写入 limitations，而不是伪装成搜过。
 */

const SEARCH_TIMEOUT_MS = Number(process.env.RESUME_AGENT_SEARCH_TIMEOUT_MS || 12000);
const MAX_RESULTS = 8;

/** SearXNG 支持的时间窗，用于把结果限定在近期发布的页面 */
export type SearchTimeRange = "day" | "week" | "month" | "year";

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  engine?: string;
}

export interface WebSearchOutcome {
  configured: boolean;
  query: string;
  results: WebSearchResult[];
  sources: ResearchSource[];
  /** 搜索不可用或失败的原因，会进入 research.limitations */
  limitation?: string;
}

const endpoint = () => (process.env.RESUME_AGENT_SEARXNG_URL || "").trim().replace(/\/+$/, "");

/**
 * SearXNG 实例通常部署在内网或宿主机，所以这里不能套用 assertPublicHttpsUrl
 * （它明确拒绝私网地址）。安全性由「地址来自部署方环境变量、不接受用户输入」保证。
 */
const buildSearchUrl = (base: string, query: string, timeRange?: SearchTimeRange) => {
  const url = new URL(`${base}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("safesearch", "0");
  // 「JD 必须最新」：SearXNG 的 time_range 让搜索只返回该时间窗内的结果。
  // 精确调研阶段传 month，避免抓到早已关闭的历史岗位页。
  if (timeRange) url.searchParams.set("time_range", timeRange);
  return url;
};

const hostnameOf = (rawUrl: string) => {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return undefined;
  }
};

const toSource = (result: WebSearchResult): ResearchSource => ({
  id: crypto.randomUUID(),
  type: "web",
  title: result.title,
  url: result.url,
  publisher: hostnameOf(result.url),
  retrievedAt: new Date().toISOString(),
  // 0-100 标尺，与 career-ops.assessSourceTrust 一致（ATS 95 / 用户 70 / 一般 web 55）。
  // 搜索命中只是线索、未经页面读取验证，所以低于一般 web 来源。
  trustScore: 45,
  excerpt: result.snippet.slice(0, 500) || undefined,
});

export const searchWeb = async (
  query: string,
  signal?: AbortSignal,
  timeRange?: SearchTimeRange
): Promise<WebSearchOutcome> => {
  const base = endpoint();
  const trimmedQuery = query.trim().slice(0, 300);
  if (!base) {
    return {
      configured: false,
      query: trimmedQuery,
      results: [],
      sources: [],
      limitation: "未配置 RESUME_AGENT_SEARXNG_URL，本轮跳过通用 Web 搜索",
    };
  }
  if (!trimmedQuery) {
    return { configured: true, query: "", results: [], sources: [], limitation: "搜索关键词为空" };
  }
  try {
    const response = await fetch(buildSearchUrl(base, trimmedQuery, timeRange), {
      headers: { Accept: "application/json" },
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(SEARCH_TIMEOUT_MS)])
        : AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return {
        configured: true,
        query: trimmedQuery,
        results: [],
        sources: [],
        limitation: `搜索服务返回 ${response.status}`,
      };
    }
    const payload = (await response.json()) as {
      results?: Array<{ title?: string; url?: string; content?: string; engine?: string }>;
    };
    const seen = new Set<string>();
    const results: WebSearchResult[] = [];
    for (const item of payload.results || []) {
      const url = (item.url || "").trim();
      const title = (item.title || "").trim();
      // 只保留 HTTPS：后续 resume_fetch_job_posting 也只接受 HTTPS
      if (!url || !title || !/^https:\/\//i.test(url) || seen.has(url)) continue;
      seen.add(url);
      results.push({ title, url, snippet: (item.content || "").trim(), engine: item.engine });
      if (results.length >= MAX_RESULTS) break;
    }
    return {
      configured: true,
      query: trimmedQuery,
      results,
      sources: results.map(toSource),
      limitation: results.length ? undefined : "通用 Web 搜索没有返回可用结果",
    };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === "AbortError";
    return {
      configured: true,
      query: trimmedQuery,
      results: [],
      sources: [],
      limitation: aborted
        ? "通用 Web 搜索超时或被取消"
        : `通用 Web 搜索失败：${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
