import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const isPrivateIpv4 = (address: string) => {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
};

const isPrivateIpv6 = (address: string) => {
  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  );
};

const isPrivateAddress = (address: string) =>
  isIP(address) === 4 ? isPrivateIpv4(address) : isIP(address) === 6 ? isPrivateIpv6(address) : true;

export const assertPublicHttpsUrl = async (rawUrl: string) => {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error("岗位来源仅允许 HTTPS 地址");
  if (url.username || url.password) throw new Error("岗位地址不能包含用户名或密码");
  if (url.port && url.port !== "443") throw new Error("岗位地址不能使用自定义端口");
  const hostname = url.hostname.replace(/\.$/, "").toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("岗位地址不能指向本机或局域网");
  }
  if (isIP(hostname) && isPrivateAddress(hostname)) throw new Error("岗位地址不能指向私有网络");
  const records = await lookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => isPrivateAddress(record.address))) {
    throw new Error("岗位域名解析到了不允许的网络地址");
  }
  return url;
};

export const fetchPublicText = async (rawUrl: string, signal?: AbortSignal) => {
  const url = await assertPublicHttpsUrl(rawUrl);
  const response = await fetch(url, {
    redirect: "manual",
    headers: {
      "User-Agent": "MagicResumeResearchBot/1.0 (+local resume research)",
      Accept: "text/html,application/xhtml+xml,text/plain,application/json",
    },
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
      : AbortSignal.timeout(15000),
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error("岗位页面发生重定向；为防止 SSRF，本次未自动跟随");
  }
  const contentType = response.headers.get("content-type") || "";
  if (!/(text\/html|application\/xhtml\+xml|text\/plain|application\/json)/i.test(contentType)) {
    throw new Error("岗位页面返回了不支持的内容类型");
  }
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > 2_000_000) throw new Error("岗位页面内容过大");
  const text = (await response.text()).slice(0, 2_000_000);
  return { response, text, finalUrl: response.url || url.toString() };
};

export const htmlToText = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, "\"")
    .replace(/\s+/g, " ")
    .trim();
