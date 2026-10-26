import test from "node:test";
import assert from "node:assert/strict";
import { createJSONStorage, type StateStorage } from "zustand/middleware";
import {
  OrcaCredentialError,
  apiKeyCredentialAdapter,
  credentialFromApiKey,
  maskCredential,
  orcaErrorToken,
} from "../src/lib/orcarouter/credential";
import {
  buildAuthorizeUrl,
  buildExchangeRequest,
  createCodeChallenge,
  createCodeVerifier,
  createState,
  exchangeCodeForCredential,
  pkceCredentialAdapter,
} from "../src/lib/orcarouter/pkce";
import {
  normalizeOrcaOrigin,
  resolveOrcaOrigins,
  ORCA_REFERRAL_URL,
} from "../src/config/orcarouter";
import { createAIConfigStore } from "../src/store/useAIConfigStore";
import {
  createModelProfile,
  AI_PROVIDER_DEFINITIONS,
  getTaskModel,
  isModelConfigured,
  profileAuthMethod,
  type AISettingsData,
  type AIModelProfile,
} from "../src/config/ai-models";
import { validateAIConnection } from "../src/lib/server/ai-provider";
import { migrateAISettings } from "../src/store/ai-config-migration";

const FAKE_CODE = "fixture-code-abcdef";
const FAKE_KEY = "sk-orca-fixture-key-0000";
const AUTH_ORIGIN = "https://www.orcarouter.ai";
const API_ORIGIN = "https://api.orcarouter.ai/v1";

function memory() {
  let value: string | null = null;
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

function exchangeFetch(
  handler: (url: string, init: RequestInit) => Response | Promise<Response>,
) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return handler(String(url), init ?? {});
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

const okExchange = () =>
  exchangeFetch(() => Response.json({ key: FAKE_KEY, user_id: "12345", scope: "api" }));

// ---------------------------------------------------------------- API-key path

test("the API-key adapter produces a credential without touching the network", async () => {
  let calls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    calls++;
    throw new Error("no network expected");
  }) as unknown as typeof fetch;
  try {
    assert.equal(apiKeyCredentialAdapter.method, "api-key");
    assert.equal(apiKeyCredentialAdapter.interactive, false);
    assert.deepEqual(credentialFromApiKey("  sk-orca-user-key  "), {
      apiKey: "sk-orca-user-key",
    });
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the API-key adapter rejects empty, oversized and newline-bearing input", () => {
  for (const value of ["", "   ", "sk-orca\nx", `sk-orca-${"a".repeat(5000)}`]) {
    assert.throws(
      () => credentialFromApiKey(value),
      (error: unknown) =>
        error instanceof OrcaCredentialError &&
        ["missingKey", "invalidKey"].includes(error.code),
    );
  }
});

test("a credential is masked for display without revealing its body", () => {
  const masked = maskCredential(FAKE_KEY);
  assert.ok(masked.startsWith("sk-o"));
  assert.ok(masked.endsWith("0000"));
  assert.ok(!masked.includes("fixture-key"));
  assert.equal(maskCredential("short"), "•••••");
  assert.equal(maskCredential(""), "");
});

// ------------------------------------------------------------------- PKCE path

test("every attempt uses fresh cryptographic state and verifier", () => {
  assert.equal(new Set(Array.from({length:32}, createState)).size, 32);
  const verifiers = Array.from({length:32}, createCodeVerifier);
  assert.equal(new Set(verifiers).size, 32);
  for (const verifier of verifiers) assert.match(verifier, /^[A-Za-z0-9_-]{43}$/);
});

test("the challenge is base64url(sha256(verifier)) with no padding", async () => {
  const verifier = "fixture-verifier-value";
  const challenge = await createCodeChallenge(verifier);
  const { createHash } = await import("node:crypto");
  assert.equal(
    challenge,
    createHash("sha256").update(verifier).digest("base64url"),
  );
  assert.match(challenge, /^[A-Za-z0-9_-]{43}$/);
  assert.ok(!challenge.includes("="));
  assert.notEqual(challenge, verifier);
});

test("the authorize URL uses the real callback with S256 and state", () => {
  const url = new URL(
    buildAuthorizeUrl(AUTH_ORIGIN, {
      state: "fixture-state",
      callbackUrl: "http://localhost:3000/auth/orcarouter/callback",
      codeChallenge: "fixture-challenge",
      appName: "Magic Resume",
      loginHint: "user@example.com",
    }),
  );
  assert.equal(url.origin, AUTH_ORIGIN);
  assert.equal(url.pathname, "/auth");
  assert.equal(url.searchParams.get("callback_url"), "http://localhost:3000/auth/orcarouter/callback");
  assert.equal(url.searchParams.get("code_challenge"), "fixture-challenge");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("state"), "fixture-state");
  assert.equal(url.searchParams.get("app_name"), "Magic Resume");
  assert.equal(url.searchParams.get("scope"), "api");
  assert.equal(url.searchParams.get("login_hint"), "user@example.com");
  assert.equal(url.searchParams.get("ref"), "ref_54dd337f5d343624a551");
  assert.equal(url.searchParams.has("app_id"), false);
  // Never the inference origin, and never a plain challenge.
  assert.notEqual(url.hostname, "api.orcarouter.ai");
  assert.ok(!url.searchParams.get("code_challenge_method")!.includes("plain"));
});

test("registration link and OAuth use the same Magic Resume referral; configured app IDs are retained", () => {
  assert.equal(ORCA_REFERRAL_URL, "https://www.orcarouter.ai/ref/ref_54dd337f5d343624a551");
  assert.equal(AI_PROVIDER_DEFINITIONS.orcarouter.keyUrl, ORCA_REFERRAL_URL);
  const url = new URL(buildAuthorizeUrl(AUTH_ORIGIN, {
    state: "fixture-state", callbackUrl: "https://magicv.art/auth/orcarouter/callback",
    codeChallenge: "fixture-challenge", appId: "app-fixture",
  }));
  assert.equal(url.searchParams.get("app_id"), "app-fixture");
  assert.equal(url.searchParams.get("ref"), "ref_54dd337f5d343624a551");
});

test("the exchange targets /api/v1/auth/keys on the auth origin with the verifier", () => {
  const request = buildExchangeRequest(AUTH_ORIGIN, {
    code: FAKE_CODE,
    verifier: "fixture-verifier",
  });
  const url = new URL(request.url);
  assert.equal(url.origin, AUTH_ORIGIN);
  assert.equal(url.pathname, "/api/v1/auth/keys");
  assert.deepEqual(request.body, {
    code: FAKE_CODE,
    code_verifier: "fixture-verifier",
    code_challenge_method: "S256",
  });
  assert.ok(!request.url.includes("api.orcarouter.ai"));
});

test("a successful exchange returns the durable key and reads back the scope", async () => {
  const { calls, fetchImpl } = okExchange();
  const credential = await exchangeCodeForCredential(
    AUTH_ORIGIN,
    { code: FAKE_CODE, verifier: "fixture-verifier" },
    { fetchImpl },
  );
  assert.deepEqual(credential, { apiKey: FAKE_KEY, scope: "api" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.redirect, "error");
  const body = JSON.parse(String(calls[0].init.body));
  assert.equal(body.code, FAKE_CODE);
  assert.equal(body.code_verifier, "fixture-verifier");
  assert.equal(body.code_challenge_method, "S256");
});

test("denial, expired codes, rate limits and transport failures end safely", async () => {
  const cases: [number, string, string][] = [
    [403, "codeRejected", "signInExpired"],
    [400, "codeRejected", "signInExpired"],
    [429, "rateLimited", "signInRateLimited"],
    [500, "networkError", "signInNetwork"],
    [403, "authorizationDenied", "signInDenied"],
  ];
  for (const [status, code, token] of cases) {
    const { fetchImpl } = exchangeFetch(() =>
      Response.json(
        status === 403 && code === "authorizationDenied"
          ? { error: "access_denied", error_description: "denied" }
          : { error: "invalid_grant" },
        { status },
      ),
    );
    await assert.rejects(
      exchangeCodeForCredential(
        AUTH_ORIGIN,
        { code: FAKE_CODE, verifier: "fixture-verifier" },
        { fetchImpl },
      ),
      (error: unknown) => {
        assert.ok(error instanceof OrcaCredentialError);
        assert.equal(error.code, code);
        assert.equal(orcaErrorToken(error), token);
        return true;
      },
    );
  }

  await assert.rejects(
    exchangeCodeForCredential(
      AUTH_ORIGIN,
      { code: FAKE_CODE, verifier: "fixture-verifier" },
      {
        fetchImpl: (async () => {
          throw new TypeError("Failed to fetch");
        }) as unknown as typeof fetch,
      },
    ),
    (error: unknown) =>
      error instanceof OrcaCredentialError && error.code === "networkError",
  );
});

test("a downgraded grant is reported instead of assumed", async () => {
  for (const scope of ["connector", "admin"])
    await assert.rejects(
      exchangeCodeForCredential(
        AUTH_ORIGIN,
        { code: FAKE_CODE, verifier: "fixture-verifier" },
        {
          fetchImpl: exchangeFetch(() => Response.json({ key: FAKE_KEY, scope }))
            .fetchImpl,
        },
      ),
      (error: unknown) => {
        assert.ok(error instanceof OrcaCredentialError, String(error));
        assert.equal(error.code, "scopeDowngraded");
        assert.equal(orcaErrorToken(error), "signInScope");
        return true;
      },
    );

  // An unreported scope is not evidence of the scope this client needs.
  await assert.rejects(
    exchangeCodeForCredential(
      AUTH_ORIGIN,
      { code: FAKE_CODE, verifier: "fixture-verifier" },
      { fetchImpl: exchangeFetch(() => Response.json({ key: FAKE_KEY })).fetchImpl },
    ),
    (error: unknown) =>
      error instanceof OrcaCredentialError && error.code === "scopeDowngraded",
  );
});

test("a corrupted key in a successful response is terminal, not persisted", async () => {
  for (const key of ["", "sk-orca\nbroken", "x".repeat(5000)]) {
    const { fetchImpl } = exchangeFetch(() => Response.json({ key, scope: "api" }));
    await assert.rejects(
      exchangeCodeForCredential(
        AUTH_ORIGIN,
        { code: FAKE_CODE, verifier: "fixture-verifier" },
        { fetchImpl },
      ),
      (error: unknown) =>
        error instanceof OrcaCredentialError &&
        ["invalidResponse", "scopeDowngraded", "invalidKey"].includes(error.code),
    );
  }
});

// ------------------------------------------------------ origins and overrides

test("auth and inference origins stay separate and are never derived from each other", () => {
  const { authBase, apiBase } = resolveOrcaOrigins({});
  assert.equal(authBase, "https://www.orcarouter.ai");
  assert.equal(apiBase, "https://api.orcarouter.ai/v1");

  const shared = resolveOrcaOrigins({ ORCA_BASE_URL: "https://router.internal" });
  assert.equal(shared.authBase, "https://router.internal");
  assert.equal(shared.apiBase, "https://router.internal");

  const explicit = resolveOrcaOrigins(
    {
      ORCA_BASE_URL: "https://shared.internal",
      ORCA_AUTH_BASE_URL: "https://login.internal",
      ORCA_API_BASE_URL: "https://inference.internal/v1",
    },
    {},
  );
  assert.equal(explicit.authBase, "https://login.internal");
  assert.equal(explicit.apiBase, "https://inference.internal/v1");
});

test("plain HTTP is refused for remote origins and allowed for loopback", () => {
  assert.throws(() => normalizeOrcaOrigin("http://router.internal", AUTH_ORIGIN));
  assert.throws(() => normalizeOrcaOrigin("https://user:pass@router.internal", AUTH_ORIGIN));
  assert.equal(
    normalizeOrcaOrigin("http://127.0.0.1:8787", AUTH_ORIGIN),
    "http://127.0.0.1:8787",
  );
  assert.equal(normalizeOrcaOrigin("http://localhost:8787", AUTH_ORIGIN), "http://localhost:8787");
});

test("the OrcaRouter request path ignores a client-supplied inference origin", () => {
  const connection = validateAIConnection({
    provider: "orcarouter",
    protocol: "chat-completions",
    apiKey: FAKE_KEY,
    model: "deepseek/deepseek-v4-pro",
    baseUrl: "https://evil.example/v1",
  });
  assert.equal(connection.baseUrl, API_ORIGIN);
  // Other providers keep their configurable endpoint.
  assert.equal(
    validateAIConnection({
      provider: "openai",
      protocol: "chat-completions",
      apiKey: FAKE_KEY,
      model: "gpt-fixture",
      baseUrl: "https://proxy.example/v1",
    }).baseUrl,
    "https://proxy.example/v1",
  );
});

// ------------------------------------------------ credential store and reauth

const orcaProfile = (overrides: Partial<AIModelProfile> = {}): AIModelProfile => ({
  ...createModelProfile("orcarouter", "custom:orcarouter:deepseek/deepseek-v4-pro"),
  apiKey: FAKE_KEY,
  model: "deepseek/deepseek-v4-pro",
  ...overrides,
});

test("both authentication choices stay registered and selectable", () => {
  assert.equal(profileAuthMethod({ provider: "orcarouter", authMethod: "api-key" }), "api-key");
  assert.equal(profileAuthMethod({ provider: "orcarouter", authMethod: "oauth" }), "oauth");
  assert.equal(profileAuthMethod({ provider: "orcarouter" }), "api-key");
  // Providers without a sign-in flow cannot claim one.
  assert.equal(profileAuthMethod({ provider: "openai", authMethod: "oauth" }), "api-key");
});

test("saving, reading and clearing an OrcaRouter credential round-trips", () => {
  const store = createAIConfigStore(memory().storage);
  store.getState().saveModel(orcaProfile({ authMethod: "api-key" }));
  const saved = store.getState().models[0];
  assert.equal(saved.apiKey, FAKE_KEY);
  assert.equal(saved.authMethod, "api-key");
  assert.equal(saved.generation, 0);
  assert.equal(saved.needsReauth, false);

  store.getState().saveModel({ ...saved, apiKey: "" });
  assert.equal(getTaskModel(store.getState(), "text"), null);
  assert.equal(store.getState().isConfigured(), false);
});

test("replacing the credential bumps its generation and clears needsReauth", () => {
  const store = createAIConfigStore(memory().storage);
  store.getState().saveModel(orcaProfile());
  store.getState().assignModel("text", store.getState().models[0].id);
  store.getState().markNeedsReauth("orcarouter", 0);
  assert.equal(store.getState().models[0].needsReauth, true);
  assert.equal(getTaskModel(store.getState(), "text"), null);

  store.getState().saveModel({ ...store.getState().models[0], apiKey: "sk-orca-replacement" });
  assert.equal(store.getState().models[0].generation, 1);
  assert.equal(store.getState().models[0].needsReauth, false);
  assert.ok(getTaskModel(store.getState(), "text"));
});

test("a revoked key marks only the exact rejected generation", () => {
  const store = createAIConfigStore(memory().storage);
  store.getState().saveModel(orcaProfile());
  store.getState().assignModel("text", store.getState().models[0].id);
  store.getState().saveModel({ ...store.getState().models[0], apiKey: "sk-orca-new-login" });
  assert.equal(store.getState().models[0].generation, 1);

  // A late 401 from the previous credential must not poison the new one.
  store.getState().markNeedsReauth("orcarouter", 0);
  assert.equal(store.getState().models[0].needsReauth, false);
  assert.ok(getTaskModel(store.getState(), "text"));

  store.getState().markNeedsReauth("orcarouter", 1);
  assert.equal(store.getState().models[0].needsReauth, true);
  assert.equal(getTaskModel(store.getState(), "text"), null);
  // A dead credential cannot be assigned to a task either.
  store.getState().markNeedsReauth("orcarouter", 1);
  store.getState().assignModel("pdf", store.getState().models[0].id);
  assert.equal(store.getState().pdfModelId, null);
});

test("a revoked credential is never silently deleted, and migration keeps its state", () => {
  const memoryStore = memory();
  const store = createAIConfigStore(memoryStore.storage);
  store.getState().saveModel(orcaProfile({ authMethod: "oauth" }));
  store.getState().markNeedsReauth("orcarouter", 0);

  const reloaded = createAIConfigStore(memoryStore.storage);
  assert.equal(reloaded.getState().models.length, 1);
  assert.equal(reloaded.getState().models[0].apiKey, FAKE_KEY);
  assert.equal(reloaded.getState().models[0].needsReauth, true);
  assert.equal(reloaded.getState().models[0].authMethod, "oauth");
  assert.equal(isModelConfigured(reloaded.getState().models[0]), true);
});

test("an unknown persisted generation is treated as generation zero, not as trusted", () => {
  const state = {
    models: [{ ...orcaProfile(), generation: "tampered", needsReauth: "yes" }],
    textModelId: null,
    pdfModelId: null,
  };
  const migrated = migrateAISettings(state);
  assert.equal(migrated.models[0].generation, 0);
  assert.equal(migrated.models[0].needsReauth, false);
});

test("the store's own persistence round-trips generation and reauth state", () => {
  const memoryStore = memory();
  const store = createAIConfigStore(memoryStore.storage);
  store.getState().saveModel(orcaProfile({ authMethod: "oauth" }));
  store.getState().saveModel({ ...store.getState().models[0], apiKey: "sk-orca-second" });

  const persisted = memoryStore.read();
  const restored = migrateAISettings(persisted.state);
  assert.equal(restored.models[0].generation, 1);
  assert.equal(restored.models[0].authMethod, "oauth");
  assert.equal(restored.models[0].apiKey, "sk-orca-second");
});

test("first OAuth credential creates a persistent provider profile without inventing a model", () => {
  const storage = memory();
  const store = createAIConfigStore(storage.storage);
  store.getState().saveOrcaCredential(FAKE_KEY, "oauth");
  const restored = createAIConfigStore(storage.storage).getState();
  assert.equal(restored.models.length, 1);
  assert.equal(restored.models[0].apiKey, FAKE_KEY);
  assert.equal(restored.models[0].authMethod, "oauth");
  assert.equal(restored.models[0].model, "");
  assert.equal(restored.textModelId, null);
});

test("live vision capabilities and task assignments survive a fresh store", () => {
  const storage = memory();
  const store = createAIConfigStore(storage.storage);
  const profile = orcaProfile({ id: "live-vision", model: "vendor/new-vision", supportsPdf: true });
  store.getState().saveModel(profile);
  store.getState().assignModel("text", profile.id);
  store.getState().assignModel("pdf", profile.id);
  const restored = createAIConfigStore(storage.storage).getState();
  assert.equal(restored.pdfModelId, profile.id);
  assert.equal(getTaskModel(restored, "pdf")?.model, "vendor/new-vision");
  assert.equal(restored.models[0].supportsPdf, true);
});

test("provider credential replacement synchronizes all models and rejects stale failures", () => {
  const store = createAIConfigStore(memory().storage);
  store.getState().saveModel(orcaProfile({id:"first",generation:2}));
  store.getState().saveModel(orcaProfile({id:"second",generation:5}));
  store.getState().saveOrcaCredential("sk-orca-replacement", "oauth");
  store.getState().markNeedsReauth("orcarouter", 5);
  for (const profile of store.getState().models) {
    assert.equal(profile.generation, 6);
    assert.equal(profile.needsReauth, false);
    assert.equal(profile.apiKey, "sk-orca-replacement");
  }
});

// ---------------------------------------------- provider wiring stays neutral

test("the downstream provider path does not care which adapter produced the key", () => {
  const store = createAIConfigStore(memory().storage);
  const profile = orcaProfile({ authMethod: "oauth" });
  store.getState().saveModel(profile);
  store.getState().assignModel("text", profile.id);
  const viaAuth = getTaskModel(store.getState(), "text")!;
  const viaKey = {
    ...getTaskModel(store.getState(), "text")!,
    authMethod: "api-key" as const,
  };
  assert.ok(viaAuth);

  const connectionFrom = (value: AIModelProfile) =>
    validateAIConnection({
      provider: value.provider,
      protocol: value.protocol,
      apiKey: value.apiKey,
      model: value.model,
      baseUrl: value.baseUrl,
    });
  assert.deepEqual(connectionFrom(viaAuth), connectionFrom(viaKey));
  assert.equal(connectionFrom(viaKey).baseUrl, API_ORIGIN);
  // The connection carries no credential-source field at all.
  assert.deepEqual(Object.keys(connectionFrom(viaKey)).sort(), [
    "apiKey",
    "baseUrl",
    "model",
    "protocol",
    "provider",
  ]);
});
