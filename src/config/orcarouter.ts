/**
 * Single source of truth for the OrcaRouter provider: origins, capability
 * filters for the model catalog, and the verified cold-start seed.
 *
 * Shared by the server catalog route, the browser credential flow and the
 * model selectors, so none of them re-derive an origin or re-declare a
 * capability on its own.
 */

export const ORCA_DEFAULT_AUTH_BASE = "https://www.orcarouter.ai";
export const ORCA_DEFAULT_API_BASE = "https://api.orcarouter.ai/v1";
/** Consent screen path on the authentication origin. */
export const ORCA_AUTHORIZE_PATH = "/auth";
/** Code exchange path on the authentication origin. Never the inference origin. */
export const ORCA_EXCHANGE_PATH = "/api/v1/auth/keys";
export const ORCA_KEY_DASHBOARD_URL =
  "https://www.orcarouter.ai/console/authorized-apps";

export type OrcaCapability = "chat" | "embedding" | "image" | "video" | "rerank";

export const ORCA_CAPABILITIES: readonly OrcaCapability[] = [
  "chat",
  "embedding",
  "image",
  "video",
  "rerank",
];

export type OrcaInputModality = "text" | "image" | "audio" | "video";

export const ORCA_INPUT_MODALITIES: readonly OrcaInputModality[] = [
  "text",
  "image",
  "audio",
  "video",
];

/** Endpoint types the text entry points of this project can speak. */
export const ORCA_TEXT_ENDPOINT_TYPES = [
  "openai",
  "openai-response",
  "anthropic",
  "gemini",
] as const;

/** Endpoint types that make a catalog row unusable for text chat. */
export const ORCA_DEDICATED_ENDPOINT_TYPES = [
  "image-generation",
  "openai-video",
  "jina-rerank",
  "embedding",
] as const;

export const ORCA_SEED_MODELS = [
  "openai/gpt-5.5",
  "anthropic/claude-opus-4.8",
  "google/gemini-3.5-flash",
  "deepseek/deepseek-v4-pro",
  "orcarouter/auto",
] as const;

/**
 * Verified seed metadata, kept for a cold start or a catalog outage. It is
 * never merged into a successful live catalog.
 */
export interface OrcaCatalogEntry {
  id: string;
  name?: string;
  description?: string;
  contextLength?: number;
  maxOutputTokens?: number;
  inputModalities?: OrcaInputModality[];
  endpointTypes?: string[];
  reasoningEfforts?: string[];
}

const textOnly: OrcaInputModality[] = ["text"];

export const ORCAROUTER_SEED_CATALOG: readonly OrcaCatalogEntry[] = [
  {
    id: "openai/gpt-5.5",
    name: "GPT-5.5",
    description: "Advanced writing and deep reasoning",
    contextLength: 400000,
    inputModalities: textOnly,
    endpointTypes: ["openai", "openai-response"],
    reasoningEfforts: ["low", "medium", "high", "xhigh"],
  },
  {
    id: "anthropic/claude-opus-4.8",
    name: "Claude Opus 4.8",
    description: "Complex tasks and high-quality understanding",
    contextLength: 200000,
    inputModalities: ["text", "image"],
    endpointTypes: ["anthropic", "openai"],
  },
  {
    id: "google/gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    description: "High-quality multimodal processing",
    contextLength: 1000000,
    inputModalities: ["text", "image", "audio", "video"],
    endpointTypes: ["gemini", "openai"],
  },
  {
    id: "deepseek/deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    description: "Advanced writing and parsing",
    contextLength: 1048576,
    inputModalities: textOnly,
    endpointTypes: ["openai", "openai-response"],
  },
  {
    id: "orcarouter/auto",
    name: "OrcaRouter Auto",
    description: "Balanced quality and cost",
    inputModalities: textOnly,
    endpointTypes: ["openai", "openai-response", "anthropic", "gemini"],
  },
];

export interface OrcaOriginOverrides {
  authBaseUrl?: string;
  apiBaseUrl?: string;
}

export interface OrcaOriginEnvironment {
  ORCA_BASE_URL?: string;
  ORCA_AUTH_BASE_URL?: string;
  ORCA_API_BASE_URL?: string;
}

const isLoopbackHost = (hostname: string) =>
  ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname.toLowerCase());

/**
 * Remote origins must be HTTPS. Plain HTTP is only accepted for loopback
 * development, so a credential can never travel in the clear.
 */
export function normalizeOrcaOrigin(value: string, fallback: string): string {
  const raw = value.trim();
  if (!raw) return fallback;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("invalidOrcaOrigin");
  }
  if (url.username || url.password || url.search || url.hash)
    throw new Error("invalidOrcaOrigin");
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopbackHost(url.hostname)))
    throw new Error("insecureOrcaOrigin");
  return url.toString().replace(/\/+$/, "");
}

export function resolveOrcaOrigins(
  environment: OrcaOriginEnvironment = {},
  overrides: OrcaOriginOverrides = {},
): { authBase: string; apiBase: string } {
  const shared = environment.ORCA_BASE_URL?.trim();
  return {
    authBase: normalizeOrcaOrigin(
      overrides.authBaseUrl ?? environment.ORCA_AUTH_BASE_URL ?? shared ?? "",
      ORCA_DEFAULT_AUTH_BASE,
    ),
    apiBase: normalizeOrcaOrigin(
      overrides.apiBaseUrl ?? environment.ORCA_API_BASE_URL ?? shared ?? "",
      ORCA_DEFAULT_API_BASE,
    ),
  };
}

/** Read the deployment's overrides without ever touching the other origin. */
export function orcaEnvironmentFromProcess(): OrcaOriginEnvironment {
  const env = typeof process === "undefined" ? undefined : process.env;
  return {
    ORCA_BASE_URL: env?.ORCA_BASE_URL,
    ORCA_AUTH_BASE_URL: env?.ORCA_AUTH_BASE_URL,
    ORCA_API_BASE_URL: env?.ORCA_API_BASE_URL,
  };
}

export function orcaEnvironmentFromBuild(): OrcaOriginEnvironment {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env;
  return {
    ORCA_BASE_URL: env?.VITE_ORCA_BASE_URL,
    ORCA_AUTH_BASE_URL: env?.VITE_ORCA_AUTH_BASE_URL,
    ORCA_API_BASE_URL: env?.VITE_ORCA_API_BASE_URL,
  };
}

const MODALITIES: OrcaInputModality[] = ["text", "image", "audio", "video"];
const MAX_ID_LENGTH = 256;
const MAX_TEXT_LENGTH = 512;
const MAX_ENDPOINT_TYPES = 16;
const MAX_MODALITIES = 4;

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const boundedText = (value: unknown, maxLength: number) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length <= maxLength ? text : "";
};

const boundedNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : undefined;

const MAX_REASONING_EFFORTS = 8;
const reasoningEfforts = (value: unknown) => {
  const raw = Array.isArray(value)
    ? value
    : Array.isArray(asRecord(value).efforts)
      ? (asRecord(value).efforts as unknown[])
      : [];
  const efforts = raw
    .map((entry) => boundedText(entry, 16))
    .filter(Boolean)
    .slice(0, MAX_REASONING_EFFORTS);
  return efforts.length ? efforts : undefined;
};

/**
 * Accept only catalog shapes this client can actually speak. Unknown or
 * malformed rows are dropped rather than guessed at.
 */
export function parseOrcaCatalogEntry(value: unknown): OrcaCatalogEntry | null {
  const item = asRecord(value);
  const id = boundedText(item.id, MAX_ID_LENGTH);
  if (!id) return null;

  const endpointTypes = Array.isArray(item.supported_endpoint_types)
    ? item.supported_endpoint_types
        .map((entry) => boundedText(entry, 64))
        .filter(Boolean)
        .slice(0, MAX_ENDPOINT_TYPES)
    : undefined;

  const rawModalities = Array.isArray(asRecord(item.architecture).input_modalities)
    ? (asRecord(item.architecture).input_modalities as unknown[])
    : undefined;
  const inputModalities = rawModalities
    ?.map((entry) => boundedText(entry, 16))
    .filter((entry): entry is OrcaInputModality =>
      MODALITIES.includes(entry as OrcaInputModality),
    )
    .slice(0, MAX_MODALITIES);

  return {
    id,
    name: boundedText(item.name, MAX_TEXT_LENGTH) || undefined,
    description: boundedText(item.description, MAX_TEXT_LENGTH) || undefined,
    contextLength: boundedNumber(item.context_length),
    maxOutputTokens: boundedNumber(item.max_completion_tokens),
    ...(inputModalities ? { inputModalities } : {}),
    ...(endpointTypes ? { endpointTypes } : {}),
    ...(reasoningEfforts(item.reasoning) !== undefined
      ? { reasoningEfforts: reasoningEfforts(item.reasoning) }
      : {}),
  };
}

function hasTextEndpoint(entry: OrcaCatalogEntry) {
  const types = entry.endpointTypes;
  if (!types?.length) return false;
  if (types.some((type) => ORCA_DEDICATED_ENDPOINT_TYPES.includes(type as never)))
    return false;
  return types.some((type) => ORCA_TEXT_ENDPOINT_TYPES.includes(type as never));
}

/**
 * Capability filter for one AI entry point. A row is only usable when the
 * catalog itself proves the capability; undeclared rows fail closed.
 */
export function matchesOrcaCapability(
  entry: OrcaCatalogEntry,
  capability: OrcaCapability,
  requiredModalities: OrcaInputModality[] = [],
): boolean {
  const modalities = entry.inputModalities ?? [];
  switch (capability) {
    case "chat":
      if (!hasTextEndpoint(entry)) return false;
      return requiredModalities
        .filter((modality) => modality !== "text")
        .every((modality) => modalities.includes(modality));
    case "embedding":
      return (entry.endpointTypes ?? []).includes("embedding");
    case "image":
      return (entry.endpointTypes ?? []).includes("image-generation");
    case "video":
      return (entry.endpointTypes ?? []).includes("openai-video");
    case "rerank":
      return (entry.endpointTypes ?? []).includes("jina-rerank");
  }
}

export function orcaChatSupportsImages(entry: OrcaCatalogEntry) {
  return matchesOrcaCapability(entry, "chat", ["image"]);
}

/**
 * Capabilities discovered from the live catalog. Live discovery is
 * authoritative: registering a catalog replaces the previous one entirely,
 * and nothing is merged in from the seed.
 */
const emptyCatalog: readonly OrcaCatalogEntry[] = [];
let discoveredCatalog: readonly OrcaCatalogEntry[] = emptyCatalog;

export function registerOrcaCatalog(entries: readonly OrcaCatalogEntry[]) {
  discoveredCatalog = entries;
}

export function orcaCatalogSize() {
  return discoveredCatalog.length;
}

const orcaCatalogIndex = () =>
  new Map(discoveredCatalog.map((entry) => [entry.id, entry]));

/** Declared capabilities for a model id, from the live catalog, then the seed. */
export function orcaCatalogEntry(id: string): OrcaCatalogEntry | undefined {
  const trimmed = id.trim();
  if (!trimmed) return undefined;
  return (
    orcaCatalogIndex().get(trimmed) ??
    ORCAROUTER_SEED_CATALOG.find((entry) => entry.id === trimmed)
  );
}

export function orcaModelSupportsImages(id: string): boolean {
  const entry = orcaCatalogEntry(id);
  return !!entry && orcaChatSupportsImages(entry);
}

export const MAX_CONTEXT_LENGTH = 10_000_000;

/** Formats a verified context window for the capability list. */
export function formatContextLength(value?: number): string | null {
  if (!value || value <= 0 || value > MAX_CONTEXT_LENGTH) return null;
  return value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : `${Math.round(value / 1_000)}K`;
}

export const orcaModelDisplayName = (entry: OrcaCatalogEntry) =>
  entry.name?.trim() || entry.id;
