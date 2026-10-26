import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { prepareOrcaRedirect, completeOrcaRedirect, ORCA_PENDING_KEY, ORCA_CALLBACK_PATH, ORCA_AUTH_TIMEOUT_MS } from "../src/lib/orcarouter/redirect";
import { validateCallbackUrl } from "../src/lib/orcarouter/pkce";
import { OrcaCredentialError } from "../src/lib/orcarouter/credential";

const authBase = "https://www.orcarouter.ai";
const origin = "http://localhost:3000";
const now = 100000;
function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); } };
}
async function attempt() {
  const saved = storage();
  const authorize = new URL(await prepareOrcaRedirect({ origin, authBase, storage: saved, now }));
  const callback = new URL(authorize.searchParams.get("callback_url")!);
  callback.searchParams.set("code", "fixture-code");
  callback.searchParams.set("state", authorize.searchParams.get("state")!);
  return { saved, authorize, callback };
}
const hasCode = (code: string) => (error: unknown) => error instanceof OrcaCredentialError && error.code === code;

test("redirect stores a per-tab verifier and sends a real callback plus S256 challenge", async () => {
  const { saved, authorize } = await attempt();
  const pending = JSON.parse(saved.getItem(ORCA_PENDING_KEY)!);
  assert.equal(authorize.searchParams.get("callback_url"), origin + ORCA_CALLBACK_PATH);
  assert.equal(authorize.searchParams.get("code_challenge_method"), "S256");
  assert.equal(authorize.searchParams.get("code_challenge"), createHash("sha256").update(pending.verifier).digest("base64url"));
  assert.ok(!authorize.href.includes(pending.verifier));
  const previousState = pending.state;
  await prepareOrcaRedirect({ origin, authBase, storage: saved });
  assert.notEqual(JSON.parse(saved.getItem(ORCA_PENDING_KEY)!).state, previousState);
});

test("only HTTPS or HTTP loopback callbacks are accepted", () => {
  for (const url of ["oob", "http://example.com/callback", "https://example.com/#code", "https://user:pass@example.com/callback", "javascript:alert(1)"]) {
    assert.throws(() => validateCallbackUrl(url), hasCode("invalidOrigin"));
  }
  for (const url of ["https://magicv.art/auth/orcarouter/callback", "http://localhost:3000/auth/orcarouter/callback", "http://127.0.0.2:8000/callback", "http://[::1]:3000/callback"]) {
    assert.equal(validateCallbackUrl(url).href, url);
  }
});

test("callback survives navigation, consumes the attempt once, and uses the original verifier", async () => {
  const { saved, callback } = await attempt();
  const pending = JSON.parse(saved.getItem(ORCA_PENDING_KEY)!);
  let calls = 0;
  const fetchImpl: typeof fetch = async (url, options) => {
    calls++;
    assert.equal(String(url), origin + "/api/orcarouter/exchange");
    assert.equal(saved.getItem(ORCA_PENDING_KEY), null);
    assert.equal(options?.redirect, "error");
    assert.deepEqual(JSON.parse(String(options?.body)), { code: "fixture-code", code_verifier: pending.verifier, code_challenge_method: "S256" });
    return Response.json({ key: "sk-orca-fixture", scope: "api" });
  };
  const input = { callbackUrl: callback.href, storage: saved, now, fetchImpl };
  assert.deepEqual(await completeOrcaRedirect(input), { apiKey: "sk-orca-fixture", scope: "api" });
  await assert.rejects(completeOrcaRedirect(input), hasCode("codeRejected"));
  assert.equal(calls, 1);
});

for (const scenario of ["missing-state", "wrong-state", "duplicate-state", "denied", "expired", "future", "missing-code", "duplicate-code", "wrong-origin", "wrong-path"] as const) {
  test(`reject ${scenario} before exchanging a code`, async () => {
    const { saved, callback } = await attempt();
    let expected = "codeRejected";
    let clock = now;
    if (scenario === "missing-state") { callback.searchParams.delete("state"); expected = "stateMismatch"; }
    if (scenario === "wrong-state") { callback.searchParams.set("state", "other-attempt"); expected = "stateMismatch"; }
    if (scenario === "duplicate-state") { callback.searchParams.append("state", "other-attempt"); expected = "stateMismatch"; }
    if (scenario === "denied") { callback.searchParams.set("error", "access_denied"); expected = "authorizationDenied"; }
    if (scenario === "expired") { clock += ORCA_AUTH_TIMEOUT_MS; expected = "timeout"; }
    if (scenario === "future") { clock -= 1; expected = "timeout"; }
    if (scenario === "missing-code") callback.searchParams.delete("code");
    if (scenario === "duplicate-code") callback.searchParams.append("code", "other-code");
    if (scenario === "wrong-origin") { callback.hostname = "127.0.0.1"; expected = "invalidOrigin"; }
    if (scenario === "wrong-path") { callback.pathname = "/unexpected"; expected = "invalidOrigin"; }
    let calls = 0;
    await assert.rejects(completeOrcaRedirect({ callbackUrl: callback.href, storage: saved, now: clock,
      fetchImpl: async () => { calls++; return Response.json({}); } }), hasCode(expected));
    assert.equal(calls, 0);
    assert.equal(saved.getItem(ORCA_PENDING_KEY), null);
  });
}

test("a late response after cancellation cannot return a usable credential", async () => {
  const { saved, callback } = await attempt();
  const controller = new AbortController();
  let release!: (response: Response) => void;
  const promise = completeOrcaRedirect({ callbackUrl: callback.href, storage: saved, now, signal: controller.signal,
    fetchImpl: () => new Promise((resolve) => { release = resolve; }) });
  controller.abort();
  release(Response.json({ key: "sk-orca-fixture", scope: "api" }));
  await assert.rejects(promise, hasCode("cancelled"));
});

test("corrupt or missing tab state never triggers an exchange", async () => {
  for (const raw of [null, "{broken", "null", "{}", JSON.stringify({state: "x", verifier: "x"})]) {
    const saved = storage();
    if (raw) saved.setItem(ORCA_PENDING_KEY, raw);
    await assert.rejects(completeOrcaRedirect({ callbackUrl: origin + ORCA_CALLBACK_PATH, storage: saved,
      fetchImpl: async () => { assert.fail("unexpected exchange"); } }), hasCode("codeRejected"));
  }
});
