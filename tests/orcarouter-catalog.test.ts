import test from "node:test";
import assert from "node:assert/strict";
import { handleModelsRequest } from "../src/lib/server/ai-models";
import {
  ORCAROUTER_SEED_CATALOG,
  matchesOrcaCapability,
  parseOrcaCatalogEntry,
} from "../src/config/orcarouter";

/** Fixture rows shaped like the real catalog. Fake ids only. */
const CATALOG = [
  {
    id: "openai/gpt-5.5",
    name: "GPT-5.5",
    context_length: 400000,
    supported_endpoint_types: ["openai", "openai-response"],
    architecture: { input_modalities: ["text"] },
  },
  {
    id: "anthropic/claude-opus-4.8",
    name: "Claude Opus 4.8",
    context_length: 200000,
    supported_endpoint_types: ["anthropic", "openai"],
    architecture: { input_modalities: ["text", "image"] },
  },
  {
    id: "google/gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    context_length: 1000000,
    supported_endpoint_types: ["gemini", "openai"],
    architecture: { input_modalities: ["text", "image", "audio", "video"] },
  },
  {
    id: "deepseek/deepseek-v4-pro",
    name: "DeepSeek V4 Pro",
    context_length: 1048576,
    supported_endpoint_types: ["openai", "openai-response"],
    architecture: { input_modalities: ["text", "image"] },
  },
  {
    id: "vendor/text-embedding-4",
    supported_endpoint_types: ["embedding"],
    architecture: { input_modalities: ["text"] },
  },
  {
    id: "vendor/image-gen-xl",
    supported_endpoint_types: ["image-generation"],
    architecture: { input_modalities: ["text"], output_modalities: ["image"] },
  },
  {
    id: "vendor/video-gen-2",
    supported_endpoint_types: ["openai-video"],
    architecture: { input_modalities: ["text"] },
  },
  {
    id: "vendor/rerank-v3",
    supported_endpoint_types: ["jina-rerank"],
    architecture: { input_modalities: ["text"] },
  },
  {
    id: "vendor/legacy-row",
    architecture: { input_modalities: ["text", "image"] },
  },
  {
    id: "orcarouter/auto",
    supported_endpoint_types: ["openai", "openai-response", "anthropic", "gemini"],
    architecture: { input_modalities: ["text"] },
  },
];

function catalogRequest(body: unknown) {
  return new Request("http://localhost/api/models", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function catalogFetch(): { fetchImpl: typeof fetch; urls: string[] } {
  const urls: string[] = [];
  return {
    urls,
    fetchImpl: (async (url: string | URL) => {
      urls.push(String(url));
      return Response.json({ data: CATALOG, object: "list", success: true });
    }) as unknown as typeof fetch,
  };
}

test("the live catalog request goes to the OrcaRouter inference origin", async () => {
  const { fetchImpl, urls } = catalogFetch();
  const response = await handleModelsRequest(
    catalogRequest({ provider: "orcarouter", apiKey: "sk-orca-fixture", capability: "chat" }),
    fetchImpl,
  );
  assert.equal(response.status, 200);
  assert.equal(urls.length, 1);
  const url = new URL(urls[0]);
  assert.equal(url.origin, "https://api.orcarouter.ai");
  assert.equal(url.pathname, "/v1/models");
  assert.equal(url.searchParams.get("capability"), "chat");
  // The exchange path on the inference origin is the documented 404 trap.
  assert.ok(!urls[0].includes("/auth/"));
});

test("chat rows keep the vendor/model namespace and its catalog metadata", async () => {
  const { fetchImpl } = catalogFetch();
  const response = await handleModelsRequest(
    catalogRequest({ provider: "orcarouter", apiKey: "sk-orca-fixture", capability: "chat" }),
    fetchImpl,
  );
  const { models } = (await response.json()) as {
    models: { id: string; contextLength?: number; supportsImages?: boolean }[];
  };
  assert.deepEqual(
    models.map((model) => model.id),
    [
      "anthropic/claude-opus-4.8",
      "deepseek/deepseek-v4-pro",
      "google/gemini-3.5-flash",
      "openai/gpt-5.5",
      "orcarouter/auto",
    ],
  );
  const opus = models.find((model) => model.id === "anthropic/claude-opus-4.8");
  assert.equal(opus?.contextLength, 200000);
  assert.equal(opus?.supportsImages, true);
  assert.equal(
    models.find((model) => model.id === "openai/gpt-5.5")?.supportsImages,
    false,
  );
});

test("text chat drops embedding, image-generation, video and rerank models", async () => {
  const { fetchImpl } = catalogFetch();
  const response = await handleModelsRequest(
    catalogRequest({ provider: "orcarouter", apiKey: "sk-orca-fixture", capability: "chat" }),
    fetchImpl,
  );
  const ids = ((await response.json()) as { models: { id: string }[] }).models.map(
    (model) => model.id,
  );
  for (const excluded of [
    "vendor/text-embedding-4",
    "vendor/image-gen-xl",
    "vendor/video-gen-2",
    "vendor/rerank-v3",
    // No endpoint declaration at all: fail closed.
    "vendor/legacy-row",
  ])
    assert.ok(!ids.includes(excluded), `${excluded} must not be offered for chat`);
});

test("a multimodal entry point keeps only models that declare image input", async () => {
  const { fetchImpl } = catalogFetch();
  const response = await handleModelsRequest(
    catalogRequest({
      provider: "orcarouter",
      apiKey: "sk-orca-fixture",
      capability: "chat",
      modalities: "text,image",
    }),
    fetchImpl,
  );
  const { models } = (await response.json()) as {
    models: { id: string; supportsImages?: boolean }[];
  };
  assert.deepEqual(
    models.map((model) => model.id),
    [
      "anthropic/claude-opus-4.8",
      "deepseek/deepseek-v4-pro",
      "google/gemini-3.5-flash",
    ],
  );
  assert.ok(models.every((model) => model.supportsImages === true));
});

test("embedding, image, video and rerank capabilities filter strictly", async () => {
  const entries = CATALOG.map(parseOrcaCatalogEntry).filter((entry) => !!entry);
  const by = (capability: "embedding" | "image" | "video" | "rerank") =>
    entries.filter((entry) => matchesOrcaCapability(entry!, capability)).map((entry) => entry!.id);
  assert.deepEqual(by("embedding"), ["vendor/text-embedding-4"]);
  assert.deepEqual(by("image"), ["vendor/image-gen-xl"]);
  assert.deepEqual(by("video"), ["vendor/video-gen-2"]);
  assert.deepEqual(by("rerank"), ["vendor/rerank-v3"]);
});

test("a rejected key surfaces the authentication error and mints nothing", async () => {
  const response = await handleModelsRequest(
    catalogRequest({ provider: "orcarouter", apiKey: "sk-orca-revoked", capability: "chat" }),
    (async () => new Response("{}", { status: 401 })) as unknown as typeof fetch,
  );
  assert.equal(response.status, 401);
  assert.equal(((await response.json()) as { code: string }).code, "authenticationFailed");
});

test("an empty catalog is returned as an empty list, not as a seed", async () => {
  const response = await handleModelsRequest(
    catalogRequest({ provider: "orcarouter", apiKey: "sk-orca-fixture", capability: "chat" }),
    (async () => Response.json({ data: [], object: "list", success: true })) as unknown as typeof fetch,
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { models: [] });
});

test("malformed catalog rows are dropped instead of guessed at", async () => {
  const response = await handleModelsRequest(
    catalogRequest({ provider: "orcarouter", apiKey: "sk-orca-fixture", capability: "chat" }),
    (async () =>
      Response.json({
        data: [
          null,
          { supported_endpoint_types: ["openai"] },
          { id: 42, supported_endpoint_types: ["openai"] },
          { id: "x".repeat(300), supported_endpoint_types: ["openai"] },
          {
            id: "vendor/usable",
            supported_endpoint_types: ["openai", "nonsense-endpoint"],
            architecture: { input_modalities: ["text", "smell", "image"] },
          },
        ],
      })) as unknown as typeof fetch,
  );
  assert.deepEqual(await response.json(), {
    models: [
      { id: "vendor/usable", supportsImages: true },
    ],
  });
});

test("an unknown capability is rejected before any upstream call", async () => {
  let called = false;
  const response = await handleModelsRequest(
    catalogRequest({ provider: "orcarouter", apiKey: "sk-orca-fixture", capability: "telepathy" }),
    (async () => {
      called = true;
      return Response.json({ data: [] });
    }) as unknown as typeof fetch,
  );
  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test("discovery caps and de-duplicates a large OrcaRouter catalog", async () => {
  const response = await handleModelsRequest(
    catalogRequest({ provider: "orcarouter", apiKey: "sk-orca-fixture", capability: "chat" }),
    (async () =>
      Response.json({
        data: [
          { id: "vendor/first", supported_endpoint_types: ["openai"] },
          { id: "vendor/first", supported_endpoint_types: ["openai"] },
          ...Array.from({ length: 550 }, (_, index) => ({
            id: `vendor/model-${String(index).padStart(4, "0")}`,
            supported_endpoint_types: ["openai"],
          })),
        ],
      })) as unknown as typeof fetch,
  );
  const { models } = (await response.json()) as { models: { id: string }[] };
  assert.equal(models.length, 500);
  assert.equal(new Set(models.map((model) => model.id)).size, 500);
});

test("the verified seed keeps its declared capabilities and reasoning ladder", () => {
  const ids = ORCAROUTER_SEED_CATALOG.map((entry) => entry.id);
  assert.deepEqual(ids.sort(), [
    "anthropic/claude-opus-4.8",
    "deepseek/deepseek-v4-pro",
    "google/gemini-3.5-flash",
    "openai/gpt-5.5",
    "orcarouter/auto",
  ]);
  const gpt = ORCAROUTER_SEED_CATALOG.find((entry) => entry.id === "openai/gpt-5.5");
  assert.deepEqual(gpt?.reasoningEfforts, ["low", "medium", "high", "xhigh"]);
  assert.deepEqual(gpt?.inputModalities, ["text"]);
  const gemini = ORCAROUTER_SEED_CATALOG.find(
    (entry) => entry.id === "google/gemini-3.5-flash",
  );
  assert.ok(gemini?.inputModalities?.includes("image"));
  assert.ok(
    ORCAROUTER_SEED_CATALOG.every((entry) =>
      matchesOrcaCapability(entry, "chat"),
    ),
  );
});
