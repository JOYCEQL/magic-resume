import assert from "node:assert/strict";
import { after, afterEach, beforeEach, test } from "node:test";
import { createModelProfile, type AISettingsData } from "../src/config/ai-models";
// Initialize browser storage before the application singleton is imported.
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
});
const { fetchAIClient } = await import("../src/lib/ai-client");
const { useAIConfigStore } = await import("../src/store/useAIConfigStore");
after(() => {
  if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
  else Reflect.deleteProperty(globalThis, "localStorage");
});

beforeEach(() => {
  useAIConfigStore.setState({ models: [], textModelId: null, pdfModelId: null } satisfies AISettingsData);
});
afterEach(() => useAIConfigStore.setState({ models: [], textModelId: null, pdfModelId: null }));
const saveOrca = (apiKey = "test-orca-key") => {
  useAIConfigStore.getState().saveOrcaCredential(apiKey, "api-key");
  return useAIConfigStore.getState().models[0];
};

test("401 marks the rejected OrcaRouter credential and returns the untouched response", async () => {
  const credential = saveOrca();
  const expected = Response.json({ code: "authenticationFailed" }, { status: 401 });
  const response = await fetchAIClient(credential, "/api/ai-test", { method: "POST" }, async () => expected);
  assert.equal(response, expected);
  assert.deepEqual(await response.json(), { code: "authenticationFailed" });
  assert.equal(useAIConfigStore.getState().models[0].needsReauth, true);
  assert.equal(useAIConfigStore.getState().models[0].apiKey, credential.apiKey);
});

test("credit, model permission, rate limit and service failures do not revoke credentials", async () => {
  const credential = saveOrca();
  for (const status of [200, 402, 403, 429, 500, 503]) {
    await fetchAIClient(credential, "/api/models", {}, async () => new Response(null, { status }));
    assert.notEqual(useAIConfigStore.getState().models[0].needsReauth, true);
  }
});

test("a late 401 cannot revoke a replacement credential, including a reused key", async () => {
  for (const reuseKey of [false, true]) {
    const original = saveOrca("old-key");
    let complete!: (response: Response) => void;
    const request = fetchAIClient(original, "/api/models", {}, () => new Promise((resolve) => { complete = resolve; }));
    saveOrca("new-key");
    if (reuseKey) saveOrca("old-key");
    complete(new Response(null, { status: 401 }));
    await request;
    assert.equal(useAIConfigStore.getState().models[0].needsReauth, false);
  }
});

test("cancelled requests and other providers never mark OrcaRouter as rejected", async () => {
  const orca = saveOrca();
  const abort = new AbortController();
  abort.abort();
  await fetchAIClient(orca, "/api/models", { signal: abort.signal }, async () => new Response(null, { status: 401 }));
  const openai = { ...createModelProfile("openai", "openai"), apiKey: orca.apiKey };
  await fetchAIClient(openai, "/api/ai-test", {}, async () => new Response(null, { status: 401 }));
  assert.notEqual(useAIConfigStore.getState().models[0].needsReauth, true);
});
