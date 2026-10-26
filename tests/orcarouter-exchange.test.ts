import test from "node:test";
import assert from "node:assert/strict";
import { handleOrcaExchange } from "../src/lib/server/orcarouter-auth";

const origin = "http://localhost:3000";
const body = { code: "test-code", code_verifier: "a".repeat(43), code_challenge_method: "S256" };
const request = (data: unknown = body, headers: Record<string, string> = {}) => new Request(origin + "/api/orcarouter/exchange", {
  method: "POST", headers: { origin, "content-type": "application/json", ...headers }, body: JSON.stringify(data),
});

test("same-origin exchange handles an upstream response without CORS headers", async () => {
  let calls = 0;
  const response = await handleOrcaExchange(request({ ...body, authBase: "https://attacker.invalid" }), async (url, options) => {
    calls++;
    assert.equal(String(url), "https://www.orcarouter.ai/api/v1/auth/keys");
    assert.equal(options?.redirect, "error");
    assert.equal(options?.headers && new Headers(options.headers).has("cookie"), false);
    assert.deepEqual(JSON.parse(String(options?.body)), body);
    return Response.json({ key: "sk-orca-test", scope: "api" });
  });
  assert.equal(calls, 1);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { key: "sk-orca-test", scope: "api" });
});

test("reject cross-site, malformed and oversized exchanges before contacting upstream", async () => {
  const neverFetch: typeof fetch = async () => { assert.fail("unexpected upstream request"); };
  for (const [req, status] of [
    [request(body, { origin: "https://attacker.invalid" }), 403],
    [request(body, { "sec-fetch-site": "cross-site" }), 403],
    [request(body, { "content-type": "text/plain" }), 415],
    [request(null), 400],
    [request({ ...body, code_verifier: "short" }), 400],
    [request({ ...body, code_challenge_method: "plain" }), 400],
    [request({ ...body, code: "x".repeat(9000) }), 413],
  ] as const) {
    const response = await handleOrcaExchange(req, neverFetch);
    assert.equal(response.status, status);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
});

test("upstream rejection, rate limiting and unsafe payloads produce sanitized errors", async () => {
  for (const [upstream, status, error] of [
    [Response.json({ error: "Invalid code or code_verifier", secret: "sensitive" }, { status: 403 }), 403, "codeRejected"],
    [Response.json({ error: "sensitive" }, { status: 429 }), 429, "rateLimited"],
    [Response.json({ key: "sensitive", scope: "connector" }), 502, "scopeDowngraded"],
    [new Response("sensitive", { status: 500 }), 502, "networkError"],
  ] as const) {
    const response = await handleOrcaExchange(request(), async () => upstream);
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { error });
  }
});
