import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SESSION_COOKIE = "resume_studio_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

const normalizeHostname = (hostname: string) =>
  hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");

const isLoopback = (hostname: string) => {
  const value = normalizeHostname(hostname);
  return value === "localhost" || value === "127.0.0.1" || value === "::1";
};

const originAllowed = (origin: string | null, ownOrigin: string, allowedOrigins: string[]) =>
  origin === ownOrigin || (origin !== null && allowedOrigins.includes(origin));

export const resumeStudioCorsHeaders = (
  request: Request,
  allowedOrigins: string[] = [],
): Record<string, string> => {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins.includes(origin)) return {};
  return {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
};

export const resumeStudioCrossOriginModeStatus = (
  request: Request,
  mode: "analysis" | "resume",
  allowedOrigins: string[] = [],
) => {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin === url.origin) return 0;
  return origin !== null && allowedOrigins.includes(origin) && mode === "analysis" ? 0 : 403;
};

const tokenMatches = (actual: string, expected: string) => {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer);
};

const sessionSignature = (payload: string, token: string) =>
  createHmac("sha256", token).update(payload).digest("base64url");

const sessionMatches = (request: Request, token: string, now: number) => {
  const rawCookie = request.headers.get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (!rawCookie) return false;
  const [timestampText, nonce, signature] = rawCookie.split(".");
  const timestamp = Number(timestampText);
  if (!timestampText || !nonce || !signature || !Number.isInteger(timestamp)) return false;
  const age = Math.floor(now / 1_000) - timestamp;
  if (age < 0 || age > SESSION_MAX_AGE_SECONDS) return false;
  return tokenMatches(signature, sessionSignature(`${timestampText}.${nonce}`, token));
};

export const createResumeStudioSession = (
  request: Request,
  expectedToken: string | undefined,
  now = Date.now(),
  nonce = randomBytes(18).toString("base64url"),
  allowedOrigins: string[] = [],
) => {
  if (!expectedToken || expectedToken.length < 32) return { status: 503 };
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!isLoopback(url.hostname) ||
      (origin ? !originAllowed(origin, url.origin, allowedOrigins) : fetchSite !== "same-origin")) {
    return { status: 403 };
  }
  const timestamp = String(Math.floor(now / 1_000));
  const payload = `${timestamp}.${nonce}`;
  const value = `${payload}.${sessionSignature(payload, expectedToken)}`;
  return {
    status: 0,
    cookie: `${SESSION_COOKIE}=${value}; Max-Age=${SESSION_MAX_AGE_SECONDS}; Path=/api/resume-tailor; HttpOnly; SameSite=Strict`,
  };
};

export const resumeStudioRequestStatus = (
  request: Request,
  expectedToken: string | undefined,
  now = Date.now(),
  allowedOrigins: string[] = [],
) => {
  if (!expectedToken || expectedToken.length < 32) return 503;

  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (!isLoopback(url.hostname) || !origin || !originAllowed(origin, url.origin, allowedOrigins)) {
    return 403;
  }
  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return 415;
  }

  const authorization = request.headers.get("authorization") || "";
  const bearerMatches = authorization.startsWith("Bearer ") &&
    tokenMatches(authorization.slice(7), expectedToken);
  if (!bearerMatches && !sessionMatches(request, expectedToken, now)) {
    return 401;
  }
  return 0;
};
