import test from "node:test";
import assert from "node:assert/strict";
import {
  createResumeStudioSession,
  resumeStudioCorsHeaders,
  resumeStudioCrossOriginModeStatus,
  resumeStudioRequestStatus,
} from "./resumeStudioSecurity";

const token = "test-only-token-with-at-least-32-characters";
const request = (authorization: string, url = "http://127.0.0.1:3000/api/resume-tailor") =>
  new Request(url, {
    method: "POST",
    headers: {
      authorization,
      "content-type": "application/json",
      origin: new URL(url).origin,
    },
  });

test("requires a configured high-entropy server token", () => {
  assert.equal(resumeStudioRequestStatus(request(`Bearer ${token}`), undefined), 503);
  assert.equal(resumeStudioRequestStatus(request(`Bearer ${token}`), "short"), 503);
});

test("rejects forged loopback Host and Origin without the bearer token", () => {
  assert.equal(resumeStudioRequestStatus(request("Bearer attacker-token"), token), 401);
  assert.equal(
    resumeStudioRequestStatus(
      request(`Bearer ${token}`, "http://attacker.example/api/resume-tailor"),
      token,
    ),
    403,
  );
});

test("accepts only a loopback same-origin request with the configured token", () => {
  assert.equal(resumeStudioRequestStatus(request(`Bearer ${token}`), token), 0);
});

test("issues an HttpOnly same-site session without exposing the server token", () => {
  const now = Date.UTC(2026, 7, 6, 12, 0, 0);
  const result = createResumeStudioSession(
    new Request("http://127.0.0.1:3000/api/resume-tailor", {
      headers: { "sec-fetch-site": "same-origin" },
    }),
    token,
    now,
    "fixed-nonce",
  );

  assert.equal(result.status, 0);
  assert.ok(result.cookie?.includes("HttpOnly"));
  assert.ok(result.cookie?.includes("SameSite=Strict"));
  assert.equal(result.cookie?.includes(token), false);

  const cookie = result.cookie!.split(";", 1)[0];
  const sessionRequest = new Request("http://127.0.0.1:3000/api/resume-tailor", {
    method: "POST",
    headers: {
      cookie,
      "content-type": "application/json",
      origin: "http://127.0.0.1:3000",
    },
  });
  assert.equal(resumeStudioRequestStatus(sessionRequest, token, now + 1_000), 0);
  assert.equal(resumeStudioRequestStatus(sessionRequest, token, now + 28_801_000), 401);
});

test("allows only the explicit Job Seeker origin to use analysis through the browser", () => {
  const now = Date.UTC(2026, 7, 7, 12, 0, 0);
  const jobSeekerOrigin = "http://127.0.0.1:8765";
  const allowedOrigins = [jobSeekerOrigin];
  const session = createResumeStudioSession(
    new Request("http://127.0.0.1:3100/api/resume-tailor", {
      headers: { origin: jobSeekerOrigin },
    }),
    token,
    now,
    "job-seeker-nonce",
    allowedOrigins,
  );
  assert.equal(session.status, 0);

  const cookie = session.cookie!.split(";", 1)[0];
  const analysisRequest = new Request("http://127.0.0.1:3100/api/resume-tailor", {
    method: "POST",
    headers: {
      cookie,
      "content-type": "application/json",
      origin: jobSeekerOrigin,
    },
  });
  assert.equal(resumeStudioRequestStatus(analysisRequest, token, now + 1_000, allowedOrigins), 0);
  assert.deepEqual(resumeStudioCorsHeaders(analysisRequest, allowedOrigins), {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Origin": jobSeekerOrigin,
    Vary: "Origin",
  });

  const attacker = new Request("http://127.0.0.1:3100/api/resume-tailor", {
    headers: { origin: "http://127.0.0.1:9999" },
  });
  assert.equal(createResumeStudioSession(attacker, token, now, "bad", allowedOrigins).status, 403);
  assert.deepEqual(resumeStudioCorsHeaders(attacker, allowedOrigins), {});
});

test("cross-origin Job Seeker access is analysis-only", () => {
  const allowedOrigins = ["http://127.0.0.1:8765"];
  const jobSeekerRequest = new Request("http://127.0.0.1:3100/api/resume-tailor", {
    headers: { origin: allowedOrigins[0] },
  });
  const sameOriginRequest = new Request("http://127.0.0.1:3100/api/resume-tailor", {
    headers: { origin: "http://127.0.0.1:3100" },
  });

  assert.equal(resumeStudioCrossOriginModeStatus(jobSeekerRequest, "analysis", allowedOrigins), 0);
  assert.equal(resumeStudioCrossOriginModeStatus(jobSeekerRequest, "resume", allowedOrigins), 403);
  assert.equal(resumeStudioCrossOriginModeStatus(sameOriginRequest, "resume", allowedOrigins), 0);
});
