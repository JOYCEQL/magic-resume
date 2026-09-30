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
  OrcaConnectController,
  buildAuthorizeUrl,
  buildExchangeRequest,
  createCodeChallenge,
  createCodeVerifier,
  exchangeCodeForCredential,
  pkceCredentialAdapter,
} from "../src/lib/orcarouter/pkce";
import { createOrcaConnectSession } from "../src/lib/orcarouter/connect";
import {
  normalizeOrcaOrigin,
  resolveOrcaOrigins,
} from "../src/config/orcarouter";
import { createAIConfigStore } from "../src/store/useAIConfigStore";
import {
  createModelProfile,
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

test("every attempt uses a fresh verifier and state from the crypto RNG", async () => {
  const verifiers = new Set<string>();
  const states = new Set<string>();
  const controller = new OrcaConnectController({ open: () => {} });
  for (let index = 0; index < 32; index++) {
    verifiers.add(createCodeVerifier());
    await controller.begin({});
    states.add(controller.current!.state);
    // A fresh attempt always advances the generation.
    assert.equal(controller.current!.generation, index + 1);
  }
  assert.equal(verifiers.size, 32);
  assert.equal(states.size, 32);
  for (const verifier of verifiers) {
    assert.match(verifier, /^[A-Za-z0-9_-]{43}$/);
    assert.ok(!verifier.includes("="));
  }
  // The controller holds only the newest attempt.
  assert.equal(controller.current!.status, "pending");
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

test("the authorize URL is Flow B on the auth origin with S256 and state", () => {
  const url = new URL(
    buildAuthorizeUrl(AUTH_ORIGIN, {
      state: "fixture-state",
      codeChallenge: "fixture-challenge",
      appName: "Magic Resume",
      loginHint: "user@example.com",
    }),
  );
  assert.equal(url.origin, AUTH_ORIGIN);
  assert.equal(url.pathname, "/auth");
  assert.equal(url.searchParams.get("callback_url"), "oob");
  assert.equal(url.searchParams.get("code_challenge"), "fixture-challenge");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("state"), "fixture-state");
  assert.equal(url.searchParams.get("app_name"), "Magic Resume");
  assert.equal(url.searchParams.get("scope"), "api");
  assert.equal(url.searchParams.get("login_hint"), "user@example.com");
  // Never the inference origin, and never a plain challenge.
  assert.notEqual(url.hostname, "api.orcarouter.ai");
  assert.ok(!url.searchParams.get("code_challenge_method")!.includes("plain"));
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

test("neither the verifier nor the key appears in errors, logs or the snapshot", async () => {
  const logged: unknown[] = [];
  const original = { ...console };
  console.log = console.warn = console.error = (...args: unknown[]) => {
    logged.push(args);
  };
  const secrets: string[] = [];
  try {
    const controller = new OrcaConnectController({
      fetchImpl: (async () => Response.json({ error: "invalid_grant" }, { status: 403 })) as unknown as typeof fetch,
      open: () => {},
    });
    const started = await controller.begin({});
    secrets.push(started.authorizeUrl);
    const attempt = controller.current!;
    const verifier = (attempt as unknown as { verifier: string }).verifier;
    secrets.push(verifier);
    let failure: unknown;
    try {
      await controller.complete({ code: FAKE_CODE });
    } catch (error) {
      failure = error;
    }
    const rendered = `${String(failure)} ${JSON.stringify(failure)} ${JSON.stringify(logged)}`;
    assert.ok(!rendered.includes(FAKE_CODE));
    assert.ok(!rendered.includes(verifier));
    assert.ok(!rendered.includes("code_verifier"));
    assert.ok(!(failure as Error).stack!.includes(verifier));
    // The authorize URL carries only the hash, never the verifier.
    for (const secret of secrets.filter((value) => value.startsWith("http")))
      assert.ok(!secret.includes(verifier));
  } finally {
    Object.assign(console, original);
  }
});

test("the controller drops the verifier once an attempt ends", async () => {
  const { fetchImpl } = okExchange();
  const controller = new OrcaConnectController({ fetchImpl, open: () => {} });
  await controller.begin({});
  const attempt = controller.current!;
  assert.ok((attempt as unknown as { verifier: string }).verifier.length > 0);
  await controller.complete({ code: FAKE_CODE });
  assert.equal((attempt as unknown as { verifier: string }).verifier, "");
  assert.equal(attempt.status, "completed");
});

// ------------------------------------------------------- flow-level behaviours

test("a mismatched state is refused before the code is exchanged", async () => {
  let calls = 0;
  const controller = new OrcaConnectController({
    fetchImpl: (async () => {
      calls++;
      return Response.json({ key: FAKE_KEY, scope: "api" });
    }) as unknown as typeof fetch,
    open: () => {},
  });
  await controller.begin({});
  await assert.rejects(
    controller.complete({ code: FAKE_CODE, state: "not-the-state" }),
    (error: unknown) =>
      error instanceof OrcaCredentialError &&
      error.code === "stateMismatch" &&
      orcaErrorToken(error) === "signInStateMismatch",
  );
  assert.equal(calls, 0, "the code must not be redeemed on a state mismatch");
});

test("a new begin() invalidates the previous attempt, so a stale exchange cannot land", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const controller = new OrcaConnectController({
    fetchImpl: (async () => {
      await gate;
      return Response.json({ key: FAKE_KEY, scope: "api" });
    }) as unknown as typeof fetch,
    open: () => {},
  });
  await controller.begin({});
  const first = controller.complete({ code: FAKE_CODE });
  const second = await controller.begin({});
  release();
  await assert.rejects(
    first,
    (error: unknown) =>
      error instanceof OrcaCredentialError && error.code === "cancelled",
  );
  assert.equal(controller.current?.generation, second.generation);
  assert.equal(second.generation, 2);
});

test("an expired attempt reports a timeout without calling the exchange", async () => {
  let calls = 0;
  let clock = 1_000;
  const controller = new OrcaConnectController({
    fetchImpl: (async () => {
      calls++;
      return Response.json({ key: FAKE_KEY, scope: "api" });
    }) as unknown as typeof fetch,
    timeoutMs: 5_000,
    now: () => clock,
    open: () => {},
  });
  await controller.begin({});
  clock += 5_001;
  await assert.rejects(
    controller.complete({ code: FAKE_CODE }),
    (error: unknown) =>
      error instanceof OrcaCredentialError &&
      error.code === "timeout" &&
      orcaErrorToken(error) === "signInTimeout",
  );
  assert.equal(calls, 0);
});

test("both adapters hand the same credential result downstream", async () => {
  const { credential } = await (async () => {
    const { fetchImpl } = okExchange();
    const controller = new OrcaConnectController({ fetchImpl, open: () => {} });
    await controller.begin({});
    return controller.complete({ code: FAKE_CODE });
  })();
  assert.deepEqual(Object.keys(credential).sort(), ["apiKey", "scope"]);
  assert.deepEqual(
    Object.keys(credentialFromApiKey(FAKE_KEY)).sort(),
    ["apiKey"],
  );
  assert.equal(credential.apiKey, credentialFromApiKey(FAKE_KEY).apiKey);
  assert.equal(pkceCredentialAdapter.method, "oauth");
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

// ------------------------------------------------- server-side login lifecycle

interface FakeController {
  begin: (input: { loginHint?: string }) => Promise<{ authorizeUrl: string }>;
  complete: (input: { code: string; state?: string }) => Promise<unknown>;
  cancel: () => void;
}

function fakeController(pending: Promise<never>) {
  const snapshot = { begin: 0, cancel: 0, complete: 0 };
  const controller: FakeController = {
    begin: async () => {
      snapshot.begin++;
      return { authorizeUrl: "https://www.orcarouter.ai/auth?callback_url=oob" };
    },
    complete: async () => {
      snapshot.complete++;
      return pending;
    },
    cancel: () => {
      snapshot.cancel++;
    },
  };
  return { controller, snapshot };
}

test("pagehide clears busy and the hint, and a second login starts without remounting", async () => {
  const never = new Promise<never>(() => {});
  const { controller, snapshot } = fakeController(never);
  const states: { busy: boolean; hint: string | null; status: string }[] = [];
  const session = createOrcaConnectSession({
    controller: controller as unknown as OrcaConnectController,
    onChange: (value) =>
      states.push({ busy: value.busy, hint: value.hint, status: value.status }),
  });

  await session.begin({});
  assert.equal(session.snapshot.busy, false);
  assert.ok(session.snapshot.hint);
  assert.equal(session.snapshot.status, "awaiting-code");

  session.handlePageHide();
  assert.equal(session.snapshot.busy, false);
  assert.equal(session.snapshot.hint, null);
  assert.equal(session.snapshot.status, "idle");
  assert.equal(snapshot.cancel, 1);

  // Back-forward-cache restore: the same component instance starts again.
  await session.begin({});
  assert.ok(session.snapshot.hint);
  assert.equal(session.snapshot.status, "awaiting-code");
  assert.equal(snapshot.begin, 2);
});

test("pagehide during the starting phase also clears the busy flag", async () => {
  let release!: (value: { authorizeUrl: string }) => void;
  const controller = {
    begin: () => new Promise<{ authorizeUrl: string }>((resolve) => (release = resolve)),
    complete: async () => ({}),
    cancel: () => {},
  };
  const session = createOrcaConnectSession({
    controller: controller as unknown as OrcaConnectController,
    onChange: () => {},
  });
  const starting = session.begin({});
  assert.equal(session.snapshot.busy, true);
  assert.equal(session.snapshot.status, "starting");

  session.handlePageHide();
  assert.equal(session.snapshot.busy, false);
  assert.equal(session.snapshot.status, "idle");

  // The late URL from the invalidated attempt must not reappear.
  release({ authorizeUrl: "https://www.orcarouter.ai/auth?callback_url=oob" });
  await starting;
  assert.equal(session.snapshot.hint, null);
  assert.equal(session.snapshot.status, "idle");
});

test("unmount and explicit cancel release the login state without a stuck busy flag", async () => {
  const never = new Promise<never>(() => {});
  for (const stop of ["cancel", "dispose"] as const) {
    const { controller, snapshot } = fakeController(never);
    const session = createOrcaConnectSession({
      controller: controller as unknown as OrcaConnectController,
      onChange: () => {},
    });
    await session.begin({});
    if (stop === "cancel") {
      // An explicit cancel is a clean, non-error end state.
      session.cancel();
      assert.equal(session.snapshot.busy, false);
      assert.equal(session.snapshot.hint, null);
      assert.equal(session.snapshot.status, "idle");
    } else {
      // During a real unmount the server work stops and no UI state is written.
      const before = session.snapshot;
      session.dispose();
      assert.deepEqual(session.snapshot, before);
      assert.equal(session.snapshot.busy, false);
    }
    assert.equal(snapshot.cancel, 1);
  }
});

test("dispose never writes UI state from a late response", async () => {
  let release!: (value: { authorizeUrl: string }) => void;
  const controller = {
    begin: () => new Promise<{ authorizeUrl: string }>((resolve) => (release = resolve)),
    complete: async () => ({}),
    cancel: () => {},
  };
  const states: unknown[] = [];
  const session = createOrcaConnectSession({
    controller: controller as unknown as OrcaConnectController,
    onChange: (value) => states.push(value.status),
  });
  const starting = session.begin({});
  const afterDispose = states.length;
  session.dispose();
  release({ authorizeUrl: "https://www.orcarouter.ai/auth?callback_url=oob" });
  await starting;
  assert.equal(states.length, afterDispose);
});

test("a stale exchange result cannot overwrite a newer login generation", async () => {
  let release!: (value: unknown) => void;
  const pending = new Promise<unknown>((resolve) => (release = resolve));
  const { controller } = fakeController(pending as Promise<never>);
  const credentials: unknown[] = [];
  const session = createOrcaConnectSession({
    controller: controller as unknown as OrcaConnectController,
    onChange: () => {},
    onCredential: (result) => credentials.push(result),
  });

  await session.begin({});
  const first = session.submitCode(FAKE_CODE);
  session.reset();
  await session.begin({});
  release({ credential: { apiKey: FAKE_KEY }, generation: 1 });

  await first;
  assert.deepEqual(credentials, []);
  assert.equal(session.snapshot.status, "awaiting-code");
});

test("denial ends in a user-actionable token and clears the busy state", async () => {
  const controller = {
    begin: async () => ({ authorizeUrl: "https://www.orcarouter.ai/auth?callback_url=oob" }),
    complete: async () => {
      throw new OrcaCredentialError("authorizationDenied", 403);
    },
    cancel: () => {},
  };
  const session = createOrcaConnectSession({
    controller: controller as unknown as OrcaConnectController,
    onChange: () => {},
  });
  await session.begin({});
  await session.submitCode(FAKE_CODE);
  assert.equal(session.snapshot.status, "error");
  assert.equal(session.snapshot.busy, false);
  assert.equal(session.snapshot.hint, null);
  assert.equal(session.snapshot.errorToken, "signInDenied");
});

test("pagehide asks for remote cancellation with the new generation", async () => {
  const { controller } = fakeController(new Promise<never>(() => {}));
  const cancelled: number[] = [];
  const session = createOrcaConnectSession({
    controller: controller as unknown as OrcaConnectController,
    onChange: () => {},
    cancelRemote: (generation) => cancelled.push(generation),
  });
  await session.begin({});
  const before = session.snapshot.generation;
  session.handlePageHide();
  assert.deepEqual(cancelled, [before + 1]);
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
