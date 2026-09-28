import test from "node:test";
import assert from "node:assert/strict";
import { handleModelsRequest, modelsBaseUrl } from "../src/lib/server/ai-models";

function modelsRequest(body: unknown) {
  return new Request("http://localhost/api/models", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

test("modelsBaseUrl strips chat-path suffixes and trailing slashes", () => {
  assert.equal(modelsBaseUrl("https://api.example.com/v1/"), "https://api.example.com/v1");
  assert.equal(
    modelsBaseUrl("https://api.example.com/v1/chat/completions"),
    "https://api.example.com/v1",
  );
  assert.equal(
    modelsBaseUrl("https://api.example.com/v1/messages"),
    "https://api.example.com/v1",
  );
});

test("OpenAI-compatible providers list models with bearer auth", async () => {
  const requests: { url: string; headers: Record<string, string> }[] = [];
  const response = await handleModelsRequest(
    modelsRequest({ provider: "qwen", apiKey: "test-key" }),
    (async (url, options) => {
      requests.push({
        url: String(url),
        headers: options?.headers as Record<string, string>,
      });
      return Response.json({
        data: [
          { id: "qwen3.8-flash", owned_by: "system" },
          { id: "qwen3.8-max" },
        ],
      });
    }) as typeof fetch,
  );
  assert.equal(response.status, 200);
  assert.equal(requests[0].url, "https://dashscope.aliyuncs.com/compatible-mode/v1/models");
  assert.equal(requests[0].headers.Authorization, "Bearer test-key");
  assert.deepEqual(await response.json(), {
    models: [
      { id: "qwen3.8-flash", description: "system" },
      { id: "qwen3.8-max" },
    ],
  });
});

test("custom OpenAI-compatible endpoints are normalized before listing", async () => {
  const requests: string[] = [];
  await handleModelsRequest(
    modelsRequest({
      provider: "openai",
      apiKey: "test-key",
      baseUrl: "https://proxy.example.org/v1/chat/completions",
    }),
    (async (url) => {
      requests.push(String(url));
      return Response.json({ data: [] });
    }) as typeof fetch,
  );
  assert.equal(requests[0], "https://proxy.example.org/v1/models");
});

test("Gemini paginates, filters non-generateContent models and strips the prefix", async () => {
  const urls: string[] = [];
  let page = 0;
  const response = await handleModelsRequest(
    modelsRequest({ provider: "gemini", apiKey: "test-key" }),
    (async (url, options) => {
      urls.push(String(url));
      page += 1;
      return Response.json(
        page === 1
          ? {
              models: [
                {
                  name: "models/gemini-3.8-flash",
                  displayName: "Gemini 3.8 Flash",
                  supportedGenerationMethods: ["generateContent"],
                },
                {
                  name: "models/text-embedding-004",
                  supportedGenerationMethods: ["embedContent"],
                },
              ],
              nextPageToken: "page-2",
            }
          : {
              models: [
                {
                  name: "models/gemini-3.1-pro",
                  supportedGenerationMethods: ["generateContent"],
                },
              ],
            },
      );
    }) as typeof fetch,
  );
  assert.equal(response.status, 200);
  assert.match(urls[0], /\/v1beta\/models\?pageSize=100$/);
  assert.match(urls[1], /pageToken=page-2/);
  assert.deepEqual(await response.json(), {
    models: [
      { id: "gemini-3.8-flash", description: "Gemini 3.8 Flash" },
      { id: "gemini-3.1-pro" },
    ],
  });
});

test("Anthropic lists models with the messages API headers and pagination", async () => {
  const requests: { url: string; headers: Record<string, string> }[] = [];
  let page = 0;
  const response = await handleModelsRequest(
    modelsRequest({ provider: "anthropic", apiKey: "test-key" }),
    (async (url, options) => {
      requests.push({
        url: String(url),
        headers: options?.headers as Record<string, string>,
      });
      page += 1;
      return Response.json(
        page === 1
          ? {
              data: [{ id: "claude-sonnet-5", display_name: "Claude Sonnet 5" }],
              has_more: true,
              last_id: "cursor-2",
            }
          : { data: [{ id: "claude-opus-5" }], has_more: false },
      );
    }) as typeof fetch,
  );
  assert.equal(response.status, 200);
  assert.equal(requests[0].url, "https://api.anthropic.com/v1/models?limit=100");
  assert.equal(requests[0].headers["x-api-key"], "test-key");
  assert.equal(requests[0].headers["anthropic-version"], "2023-06-01");
  assert.match(requests[1].url, /after_id=cursor-2/);
  assert.deepEqual(await response.json(), {
    models: [
      { id: "claude-sonnet-5", description: "Claude Sonnet 5" },
      { id: "claude-opus-5" },
    ],
  });
});

test("upstream failures map to shared error codes with their status", async () => {
  const response = await handleModelsRequest(
    modelsRequest({ provider: "deepseek", apiKey: "bad-key" }),
    (async () => new Response("{}", { status: 401 })) as typeof fetch,
  );
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.code, "authenticationFailed");
});

test("invalid provider and missing key are rejected before any upstream call", async () => {
  for (const body of [{ provider: "unknown" }, { provider: "gemini" }]) {
    let called = false;
    const response = await handleModelsRequest(
      modelsRequest(body),
      (async () => {
        called = true;
        return Response.json({ models: [] });
      }) as typeof fetch,
    );
    assert.equal(response.status, 400);
    assert.equal(called, false);
    assert.ok("code" in (await response.json()));
  }
});

test("malformed model list entries are ignored", async () => {
  const response = await handleModelsRequest(
    modelsRequest({ provider: "openai", apiKey: "test-key" }),
    (async () =>
      Response.json({
        data: [null, { id: 42 }, { id: "valid-model" }],
      })) as typeof fetch,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    models: [{ id: "valid-model" }],
  });
});

test("invalid upstream model list payloads return an upstream error", async () => {
  const response = await handleModelsRequest(
    modelsRequest({ provider: "gemini", apiKey: "test-key" }),
    (async () => Response.json({ models: {} })) as typeof fetch,
  );

  assert.equal(response.status, 502);
  assert.equal((await response.json()).code, "upstreamError");
});

test("model discovery caps and deduplicates large catalogs", async () => {
  const response = await handleModelsRequest(
    modelsRequest({ provider: "openai", apiKey: "test-key" }),
    (async () => Response.json({ data: [
      { id: "model-0000" },
      ...Array.from({ length: 550 }, (_, i) => ({ id: `model-${String(i).padStart(4, "0")}` })),
    ] })) as typeof fetch,
  );
  const { models } = await response.json();
  assert.equal(models.length, 500);
  assert.equal(new Set(models.map((model: { id: string }) => model.id)).size, 500);
});

test("pagination stops when upstream repeats its cursor", async () => {
  for (const provider of ["gemini", "anthropic"]) {
    let requests = 0;
    const response = await handleModelsRequest(
      modelsRequest({ provider, apiKey: "test-key" }),
      (async () => {
        requests++;
        return Response.json(provider === "gemini"
          ? { models: [{ name: "models/test", supportedGenerationMethods: ["generateContent"] }], nextPageToken: "same" }
          : { data: [{ id: "test" }], has_more: true, last_id: "same" });
      }) as typeof fetch,
    );
    assert.equal(response.status, 200);
    assert.equal(requests, 2);
    assert.equal((await response.json()).models.length, 1);
  }
});

test("discovery cancels oversized upstream bodies", async () => {
  let cancelled = false;
  const response = await handleModelsRequest(
    modelsRequest({ provider: "qwen", apiKey: "test-key" }),
    (async () => new Response(new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array(2 * 1024 * 1024 + 1)); },
      cancel() { cancelled = true; },
    }))) as typeof fetch,
  );
  assert.equal(response.status, 502);
  assert.equal((await response.json()).code, "upstreamError");
  assert.equal(cancelled, true);
});

test("discovery forwards request cancellation", async () => {
  const controller = new AbortController();
  const request = new Request("http://localhost/api/models", {
    method: "POST",
    body: JSON.stringify({ provider: "openai", apiKey: "test-key" }),
    signal: controller.signal,
  });
  let started!: () => void;
  const ready = new Promise<void>((resolve) => { started = resolve; });
  const pending = handleModelsRequest(request, (async (_url, options) => {
    assert.equal(options?.redirect, "manual");
    started();
    await new Promise((_, reject) => {
      options!.signal!.addEventListener("abort", () => reject(options!.signal!.reason), { once: true });
    });
    throw new Error("unreachable");
  }) as typeof fetch);
  await ready;
  controller.abort();
  const response = await pending;
  assert.equal(response.status, 504);
  assert.equal((await response.json()).code, "timeout");
});

test("discovery rejects upstream redirects without forwarding credentials", async () => {
  let requests = 0;
  const response = await handleModelsRequest(
    modelsRequest({ provider: "openai", apiKey: "test-key" }),
    (async (_url, options) => {
      requests++;
      assert.equal(options?.redirect, "manual");
      return new Response(null, { status: 302, headers: { Location: "https://unexpected.example/models" } });
    }) as typeof fetch,
  );
  assert.equal(requests, 1);
  assert.equal(response.status, 502);
  assert.equal((await response.json()).code, "modelOrEndpointError");
});
