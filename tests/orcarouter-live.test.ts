import test from "node:test";
import assert from "node:assert/strict";
import { handleModelsRequest } from "../src/lib/server/ai-models";
import { handleTextRequest } from "../src/lib/server/ai-text";

/**
 * Real upstream checks, executed through the request paths this project
 * actually serves. They are skipped unless a real key is supplied, so the
 * default suite never depends on a live account and never uses one.
 */
const API_KEY = (process.env.ORCAROUTER_API_KEY ?? "").trim();
const live = { skip: !API_KEY && "ORCAROUTER_API_KEY is not set" };

const modelsRequest = (body: unknown) =>
  new Request("http://localhost/api/models", {
    method: "POST",
    body: JSON.stringify(body),
  });

interface LiveModel {
  id: string;
  contextLength?: number;
  supportsImages?: boolean;
}

async function discover(
  capability: "chat" | "embedding",
  modalities = "text",
): Promise<LiveModel[]> {
  const response = await handleModelsRequest(
    modelsRequest({
      provider: "orcarouter",
      apiKey: API_KEY,
      capability,
      modalities,
    }),
  );
  assert.equal(response.status, 200, await response.clone().text());
  return ((await response.json()) as { models: LiveModel[] }).models;
}

test("the live OrcaRouter catalog is real and namespaced", live, async () => {
  const models = await discover("chat");
  assert.ok(models.length > 0, "the workspace catalog must not be empty");
  for (const model of models) {
    assert.match(model.id, /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/i);
    assert.ok(!/embedding|rerank/.test(model.id));
  }
  console.log(
    `[live] GET https://api.orcarouter.ai/v1/models?capability=chat -> ${models.length} models: ${models
      .map((model) => model.id)
      .join(", ")}`,
  );
});

test("the multimodal filter is a strict subset of the text catalog", live, async () => {
  const chat = await discover("chat");
  const multimodal = await discover("chat", "text,image");
  assert.ok(
    multimodal.every((model) => model.supportsImages === true),
    "every multimodal option must declare image input",
  );
  assert.ok(multimodal.every((model) => chat.some((entry) => entry.id === model.id)));
  assert.ok(
    multimodal.length < chat.length,
    "a text-only model must be excluded from the multimodal list",
  );
  console.log(
    `[live] multimodal options (${multimodal.length}): ${multimodal
      .map((model) => model.id)
      .join(", ")}`,
  );
});

test("a first-class request reaches the relay through the project's own path", live, async () => {
  const models = await discover("chat");
  const model = models.find((entry) => entry.id.startsWith("deepseek/"))?.id ?? models[0].id;
  const response = await handleTextRequest(
    new Request("http://localhost/api/ai-test", {
      method: "POST",
      body: JSON.stringify({
        // No baseUrl: the server resolves the OrcaRouter inference origin.
        connection: {
          provider: "orcarouter",
          protocol: "chat-completions",
          apiKey: API_KEY,
          model,
        },
      }),
    }),
    "test",
  );
  const body = (await response.json()) as { ok?: boolean; code?: string };
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.equal(body.ok, true);
  console.log(`[live] POST https://api.orcarouter.ai/v1/chat/completions (${model}) -> OK`);
});

test("an unauthorized key fails as an authentication error, not a crash", live, async () => {
  const response = await handleModelsRequest(
    modelsRequest({ provider: "orcarouter", apiKey: "sk-orca-invalid-fixture", capability: "chat" }),
  );
  assert.equal(response.status, 401);
  assert.equal(((await response.json()) as { code: string }).code, "authenticationFailed");
});
