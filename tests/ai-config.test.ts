import test from "node:test";
import assert from "node:assert/strict";
import { createJSONStorage, type StateStorage } from "zustand/middleware";
import {
  AI_PROVIDERS,
  BUILTIN_AI_MODELS,
  createBuiltinModelProfile,
  createModelProfile,
  getTaskModel,
  isModelConfigured,
  modelSupportsPdf,
  type AISettingsData,
} from "../src/config/ai-models";
import { migrateAISettings } from "../src/store/ai-config-migration";
import { createAIConfigStore } from "../src/store/useAIConfigStore";

const model = (id: string, supportsPdf = true) => ({
  ...createModelProfile("qwen", id),
  apiKey: "test-key",
  model: supportsPdf ? "qwen3-vl-plus" : "qwen3-max",
  supportsPdf,
});
function memory(initial?: unknown) {
  let value = initial === undefined ? null : JSON.stringify(initial);
  const storage: StateStorage = {
    getItem: () => value,
    setItem: (_, next) => {
      value = next;
    },
    removeItem: () => {
      value = null;
    },
  };
  return {
    storage: createJSONStorage<AISettingsData>(() => storage),
    read: () => (value ? JSON.parse(value) : null),
  };
}

test("empty legacy installations remain empty without phantom preset models", () => {
  assert.deepEqual(
    migrateAISettings({
      selectedModel: "doubao",
      geminiModelId: "gemini-flash-latest",
      pdfImportProfiles: {},
    }),
    { models: [], textModelId: null, pdfModelId: null },
  );
});

test("identical text and PDF configs merge into one model and preserve assignments", () => {
  const state = migrateAISettings({
    selectedModel: "gemini",
    geminiApiKey: "old-key",
    geminiModelId: "old-model",
    pdfImportProvider: "gemini",
    pdfImportProfiles: {},
  });
  assert.equal(state.models.length, 1);
  assert.equal(state.models[0].apiKey, "old-key");
  assert.equal(state.textModelId, state.pdfModelId);
  assert.equal(state.models[0].supportsPdf, true);
  assert.deepEqual(migrateAISettings(state), state);
});

test("different model IDs, credentials and per-provider PDF profiles are retained", () => {
  const state = migrateAISettings({
    selectedModel: "openai",
    openaiApiKey: "text-key",
    openaiModelId: "text-model",
    openaiApiEndpoint: "https://example.com/v1",
    pdfImportProvider: "openai",
    pdfImportProfiles: {
      openai: {
        model: "vision-model",
        apiKey: "vision-key",
        protocol: "responses",
      },
      qwen: { apiKey: "qwen-key", model: "qwen3-vl-plus" },
    },
  });
  assert.equal(state.models.length, 3);
  assert.equal(getTaskModel(state, "text")?.apiKey, "text-key");
  assert.equal(getTaskModel(state, "pdf")?.apiKey, "vision-key");
  assert.equal(getTaskModel(state, "pdf")?.protocol, "responses");
  assert.ok(state.models.some((item) => item.provider === "qwen"));
});

test("editing one model updates both tasks without maintaining duplicate credentials", () => {
  const storage = memory();
  const store = createAIConfigStore(storage.storage);
  store.getState().saveModel(model("shared"));
  store.getState().assignModel("text", "shared");
  store.getState().assignModel("pdf", "shared");
  store.getState().saveModel({ ...model("shared"), apiKey: "updated-key" });
  assert.equal(getTaskModel(store.getState(), "text")?.apiKey, "updated-key");
  assert.equal(getTaskModel(store.getState(), "pdf")?.apiKey, "updated-key");
  assert.deepEqual(Object.keys(storage.read().state).sort(), [
    "models",
    "pdfModelId",
    "textModelId",
  ]);
  const reloaded = createAIConfigStore(storage.storage);
  assert.equal(reloaded.getState().models.length, 1);
  assert.equal(reloaded.getState().pdfModelId, "shared");
});

test("PDF assignments reject text-only models and clear when capability is removed", () => {
  const store = createAIConfigStore(memory().storage);
  store.getState().saveModel(model("text-only", false));
  store.getState().assignModel("pdf", "text-only");
  assert.equal(store.getState().pdfModelId, null);
  store.getState().saveModel(model("vision"));
  store.getState().assignModel("text", "vision");
  store.getState().assignModel("pdf", "vision");
  store.getState().saveModel(model("vision", false));
  assert.equal(store.getState().pdfModelId, null);
  assert.equal(store.getState().textModelId, "vision");
  store.getState().deleteModel("vision");
  assert.equal(store.getState().textModelId, null);
});

test("PDF capability follows known model families without a manual setting", () => {
  assert.equal(modelSupportsPdf("qwen", "qwen3-vl-plus"), true);
  assert.equal(modelSupportsPdf("qwen", "qwen3-max"), false);
  assert.equal(modelSupportsPdf("openai", "gpt-4o"), true);
  assert.equal(modelSupportsPdf("deepseek", "deepseek-chat"), false);
  assert.equal(modelSupportsPdf("gemini", "gemini-2.5-flash"), true);
});

test("every provider exposes built-in models that share one provider key", () => {
  for (const provider of AI_PROVIDERS) {
    const catalog = BUILTIN_AI_MODELS[provider];
    assert.ok(catalog.length >= 3);
    assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
    assert.ok(catalog.some((item) => item.supportsPdf));
    const profiles = catalog.map((item) =>
      createBuiltinModelProfile(provider, item, "shared-key"),
    );
    assert.ok(profiles.every((item) => item.apiKey === "shared-key"));
  }
});

test("version-zero persistence is migrated once without dropping credentials", () => {
  const storage = memory({
    version: 0,
    state: {
      selectedModel: "gemini",
      geminiApiKey: "legacy-key",
      geminiModelId: "legacy-model",
    },
  });
  const store = createAIConfigStore(storage.storage);
  assert.equal(store.getState().models[0].apiKey, "legacy-key");
  assert.equal(storage.read().version, 1);
  assert.equal(storage.read().state.geminiApiKey, undefined);
});

test("invalid and dangling saved assignments cannot select a missing model", () => {
  const migrated = migrateAISettings({
    models: [model("one", false), { id: "bad", provider: "__proto__" }],
    pdfModelId: "one",
    textModelId: "missing",
  });
  assert.equal(migrated.models.length, 1);
  assert.equal(migrated.pdfModelId, null);
  assert.equal(migrated.textModelId, null);
  assert.equal(
    isModelConfigured({
      ...model("one"),
      baseUrl: "https://user:key@example.com",
    }),
    false,
  );
});
