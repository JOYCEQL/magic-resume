import test from "node:test";
import assert from "node:assert/strict";
import { createJSONStorage, type StateStorage } from "zustand/middleware";
import {
  AI_PROVIDERS,
  AI_PROVIDER_DEFINITIONS,
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

test("static providers expose built-in models while OrcaRouter requires live discovery", () => {
  for (const provider of AI_PROVIDERS) {
    const catalog = BUILTIN_AI_MODELS[provider];
    if (provider === "orcarouter") {
      assert.deepEqual(catalog, []);
      continue;
    }
    assert.ok(catalog.length > 0);
    assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
    assert.ok(catalog.some((item) => item.supportsPdf));
    const profiles = catalog.map((item) =>
      createBuiltinModelProfile(provider, item, "shared-key"),
    );
    assert.ok(profiles.every((item) => item.apiKey === "shared-key"));
  }
});

test("DeepSeek Flash supports both tasks while Pro remains text-only", () => {
  assert.equal(AI_PROVIDER_DEFINITIONS.deepseek.defaultModel, "deepseek-flash");
  assert.equal(AI_PROVIDER_DEFINITIONS.deepseek.pdfModel, "deepseek-flash");
  const store = createAIConfigStore(memory().storage);
  store.getState().saveModel({
    ...createModelProfile("deepseek", "flash"),
    apiKey: "test-key",
  });
  store.getState().assignModel("text", "flash");
  store.getState().assignModel("pdf", "flash");
  assert.equal(getTaskModel(store.getState(), "text")?.model, "deepseek-flash");
  assert.equal(getTaskModel(store.getState(), "pdf")?.model, "deepseek-flash");
  assert.equal(modelSupportsPdf("deepseek", "deepseek-v4-pro"), false);
  assert.equal(modelSupportsPdf("deepseek", "unknown-model"), false);
});

test("saved DeepSeek Flash aliases preserve credentials and task assignments", () => {
  for (const alias of ["deepseek-v4-flash", "deepseek-v4-flash-vision-exp"]) {
    const saved = {
      models: [{
        ...createModelProfile("deepseek", "saved-flash"),
        model: alias,
        name: "My Flash",
        apiKey: "saved-key",
        supportsPdf: false,
      }],
      textModelId: "saved-flash",
      pdfModelId: "saved-flash",
    };
    const storage = memory({ version: 1, state: saved });
    const store = createAIConfigStore(storage.storage);
    const profile = getTaskModel(store.getState(), "pdf");
    assert.equal(profile?.model, "deepseek-flash");
    assert.equal(profile?.apiKey, "saved-key");
    assert.equal(profile?.name, "My Flash");
    assert.equal(profile?.supportsPdf, true);
    assert.equal(getTaskModel(store.getState(), "text")?.id, profile?.id);
    assert.equal(storage.read().version, 2);
    assert.equal(storage.read().state.models[0].model, "deepseek-flash");
    assert.deepEqual(createAIConfigStore(storage.storage).getState().models, store.getState().models);
    assert.deepEqual(migrateAISettings(migrateAISettings(saved)), migrateAISettings(saved));
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
  assert.equal(storage.read().version, 2);
  assert.equal(storage.read().state.geminiApiKey, undefined);
});

test("old Flash and Vision presets merge and remap both assignments on upgrade", () => {
  const base = { ...createModelProfile("deepseek", "old-text"), apiKey: "shared-key" };
  const storage = memory({
    version: 1,
    state: {
      models: [
        { ...base, model: "deepseek-v4-flash", name: "DeepSeek V4 Flash", supportsPdf: false },
        { ...base, id: "old-pdf", model: "deepseek-v4-flash-vision-exp", name: "DeepSeek V4 Vision" },
        { ...base, id: "new-flash", model: "deepseek-flash", name: "DeepSeek V4.1 Flash" },
        { ...base, id: "pro", model: "deepseek-v4-pro", name: "DeepSeek V4 Pro", supportsPdf: false },
      ],
      textModelId: "old-text",
      pdfModelId: "old-pdf",
    },
  });
  const state = createAIConfigStore(storage.storage).getState();
  assert.equal(state.models.length, 2);
  assert.equal(state.textModelId, state.pdfModelId);
  assert.equal(getTaskModel(state, "pdf")?.name, "DeepSeek V4.1 Flash");
  assert.equal(getTaskModel(state, "pdf")?.apiKey, "shared-key");
  assert.equal(state.models.find((profile) => profile.id === "pro")?.model, "deepseek-v4-pro");
  assert.deepEqual(migrateAISettings(state), storage.read().state);
  assert.deepEqual(createAIConfigStore(storage.storage).getState().models, state.models);
});

test("Flash migration retains distinct keys and custom labels", () => {
  const base = {
    ...createModelProfile("deepseek", "first"),
    model: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    apiKey: "first-key",
  };
  const state = migrateAISettings({
    models: [base, { ...base, id: "second", apiKey: "second-key" }, { ...base, id: "named", name: "My model" }],
    textModelId: "second",
    pdfModelId: "named",
  });
  assert.equal(state.models.length, 3);
  assert.ok(state.models.every((profile) => profile.model === "deepseek-flash"));
  assert.equal(getTaskModel(state, "text")?.apiKey, "second-key");
  assert.equal(getTaskModel(state, "pdf")?.name, "My model");
});

test("Flash migration leaves custom endpoints and unrelated providers unchanged", () => {
  for (const baseUrl of [
    "https://proxy.example.com/v1",
    "https://api.deepseek.com.example.com/v1",
    "https://api.deepseek.com/custom",
    "http://api.deepseek.com/v1",
  ]) {
    const profile = {
      ...createModelProfile("deepseek", "custom"),
      model: "deepseek-v4-flash-vision-exp",
      name: "DeepSeek V4 Vision",
      apiKey: "custom-key",
      baseUrl,
    };
    const saved = { models: [profile], textModelId: "custom", pdfModelId: "custom" };
    assert.deepEqual(migrateAISettings(saved), saved);
  }
  const profile = { ...createModelProfile("openai", "other"), model: "deepseek-v4-flash", apiKey: "key" };
  const saved = { models: [profile], textModelId: "other", pdfModelId: null };
  assert.deepEqual(migrateAISettings(saved), saved);
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
