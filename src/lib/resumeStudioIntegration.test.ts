import assert from "node:assert/strict";
import test from "node:test";
import {
  artifactLabels,
  assertResumeStudioProvenance,
  buildResumeStudioMetadata,
  completeResumeHandoff,
  fetchFinalizedResumeHandoff,
  finalizedResumeFromHandoff,
  handoffTokenFromFragment,
  isCareerTwinManagedResume,
  parseFinalizedResumeRequest,
  resumeVariantFromStoredResume,
  syncResumeVariant,
} from "./resumeStudioIntegration";
import type {
  RequirementEvidenceArtifact,
  ResumeSelectionPlan,
  VacancyAnalysis,
} from "./careerTwinContract";

const provenance = {
  handoffId: "handoff-1",
  careerProjectionRevision: 7,
  vacancy: {
    id: "EU-LI-123",
    source: "linkedin.com",
    sha256: "a".repeat(64),
    date: "2026-08-05T10:00:00Z",
    path: "/trusted/07_market/linkedin_latest.json",
  },
  evidenceSources: [
    { path: "/trusted/01_profile/career-master.md", sha256: "b".repeat(64) },
    { path: "/trusted/01_profile/evidence-ledger.md", sha256: "c".repeat(64) },
  ],
  careerSha256: "b".repeat(64),
  evidenceSha256: "c".repeat(64),
  catalogSha256: "d".repeat(64),
  generator: "openai:gpt-test",
  verifier: "openai:verify-test",
  generatedAt: "2026-08-05T12:00:00.000Z",
  artifactLanguage: "en" as const,
};

test("rejects incomplete server provenance before persisting a resume", () => {
  assert.throws(
    () => assertResumeStudioProvenance({ ...provenance, evidenceSha256: undefined }, "en"),
    /trusted provenance/,
  );
  assert.deepEqual(assertResumeStudioProvenance(provenance, "en"), provenance);
});

const vacancyAnalysis: VacancyAnalysis = {
  vacancyId: "EU-LI-123",
  requirements: [{
    id: "R001",
    category: "portfolio",
    text: "Lead the AI portfolio.",
    sourceText: "Lead the AI portfolio.",
    priority: "must",
    weight: 100,
    evidenceExpected: "direct",
  }],
  outcomes: ["Portfolio value"],
  context: ["Enterprise"],
  risks: [],
  provenance: {
    vacancyId: "EU-LI-123",
    sha256: "a".repeat(64),
    path: "/trusted/07_market/linkedin_latest.json",
    collectedAt: "2026-08-05T10:00:00Z",
  },
};

const evidenceMatching: RequirementEvidenceArtifact = {
  vacancyId: "EU-LI-123",
  mappings: [{
    requirementId: "R001",
    matches: [{
      evidenceId: "E-0123456789abcdef",
      employer: "Acme",
      support: "direct",
      relevanceScore: 95,
      reason: "Direct portfolio evidence.",
    }],
  }],
  employerRanking: [{ employer: "Acme", score: 95, evidenceIds: ["E-0123456789abcdef"] }],
  uncoveredMustHaveRequirementIds: [],
};

const selectionPlan: ResumeSelectionPlan = {
  requirementIds: ["R001"],
  excludedRequirementIds: [],
  evidenceIds: ["E-0123456789abcdef"],
  employers: ["Acme"],
  evidenceRequirementIds: { "E-0123456789abcdef": ["R001"] },
  requirementReasons: { R001: "Selected as the strongest requirement." },
  evidenceReasons: { "E-0123456789abcdef": "Selected for R001." },
  employerReasons: { Acme: "Selected for E-0123456789abcdef." },
};

const completeProvenance = buildResumeStudioMetadata({
  evidenceMap: { "Led AI portfolio": ["E-0123456789abcdef"] },
  requirementMap: { "Led AI portfolio": ["R001"] },
  excludedClaims: ["Five models in production"],
  vacancyAnalysis,
  evidenceMatching,
  selectionPlan,
  provenance,
});

const nativeResume = {
  id: "resume-1",
  title: "Trusted role",
  language: "en",
  basic: { name: "Candidate", title: "Head of AI" },
  menuSections: [],
};

test("persists complete evidence and generation provenance as compatible resume metadata", () => {
  const metadata = buildResumeStudioMetadata({
    evidenceMap: { "Led AI portfolio": ["E-0123456789abcdef"] },
    requirementMap: { "Led AI portfolio": ["R001"] },
    excludedClaims: ["Five models in production"],
    vacancyAnalysis,
    evidenceMatching,
    selectionPlan,
    provenance,
  });

  assert.deepEqual(metadata.evidenceMap, { "Led AI portfolio": ["E-0123456789abcdef"] });
  assert.deepEqual(metadata.requirementMap, { "Led AI portfolio": ["R001"] });
  assert.deepEqual(metadata.excludedClaims, ["Five models in production"]);
  assert.deepEqual(metadata.vacancy, provenance.vacancy);
  assert.equal(metadata.careerSha256, "b".repeat(64));
  assert.equal(metadata.evidenceSha256, "c".repeat(64));
  assert.equal(metadata.generator, "openai:gpt-test");
  assert.equal(metadata.verifier, "openai:verify-test");
  assert.equal(metadata.generatedAt, "2026-08-05T12:00:00.000Z");
  assert.equal(metadata.artifactLanguage, "en");
  assert.deepEqual(metadata.vacancyAnalysis, vacancyAnalysis);
  assert.deepEqual(metadata.evidenceMatching, evidenceMatching);
  assert.deepEqual(metadata.selectionPlan, selectionPlan);
});

test("artifact labels follow CV language rather than UI locale", () => {
  assert.equal(artifactLabels("en").experience, "Experience");
  assert.equal(artifactLabels("ru").experience, "Опыт");
  assert.equal(artifactLabels("en").syncFailed, "CV saved, but database sync failed");
  assert.equal(artifactLabels("ru").syncFailed, "CV сохранено, но синхронизация с БД не удалась");
});

test("reads the one-time handoff once from a URL fragment", () => {
  const token = "handoff-token-12345678901234567890";
  assert.equal(handoffTokenFromFragment(`#handoff_token=${token}`), token);
  assert.equal(handoffTokenFromFragment(""), "");
  assert.equal(handoffTokenFromFragment("#handoff_token=too-short"), "");
});

test("accepts only finalized Career Twin content from a handoff", () => {
  const finalized = finalizedResumeFromHandoff({
    snapshot: {
      resume_content: { ...nativeResume, summary: "Exact Career Twin wording" },
      vacancy_analysis: vacancyAnalysis,
      evidence_matching: evidenceMatching,
      resume_provenance: provenance,
    },
  });

  assert.equal((finalized.resume as { summary: string }).summary, "Exact Career Twin wording");
  assert.deepEqual(finalized.analysis, vacancyAnalysis);
  assert.deepEqual(finalized.matching, evidenceMatching);
  assert.throws(() => finalizedResumeFromHandoff({ snapshot: {} }), /finalized Career Twin/);
});

test("renderer fetches exactly one finalized handoff from loopback Job Seeker", async () => {
  let request: { url: string; init?: RequestInit } | undefined;
  const result = await fetchFinalizedResumeHandoff(
    "http://127.0.0.1:8765",
    "one-time-secret-12345678901234567",
    async (url, init) => {
      request = { url: String(url), init };
      return Response.json({
        snapshot: {
          resume_content: nativeResume,
          vacancy_analysis: vacancyAnalysis,
          evidence_matching: evidenceMatching,
          resume_provenance: completeProvenance,
        },
      });
    },
    "scoped-integration-token",
  );

  assert.equal(result.resume.id, "resume-1");
  assert.equal(
    request?.url,
    "http://127.0.0.1:8765/api/v1/resume-handoffs/one-time-secret-12345678901234567",
  );
  assert.equal(
    (request?.init?.headers as Record<string, string>).Authorization,
    "Bearer scoped-integration-token",
  );
  assert.equal(request?.init?.redirect, "error");
});

test("renderer request accepts only a finalized Career Twin handoff", () => {
  const request = parseFinalizedResumeRequest({
    handoffToken: "handoff-token-12345678901234567890",
    launch: {
      id: "EU-LI-123",
      source: "linkedin.com",
      language: "en",
      company: "Acme",
      role: "Head of AI",
      url: "https://linkedin.com/jobs/123",
    },
  });

  assert.equal(request.handoffToken, "handoff-token-12345678901234567890");
  assert.equal(request.launch.id, "EU-LI-123");
  assert.throws(
    () => parseFinalizedResumeRequest({ ...request, mode: "analysis" }),
    /renderer-only/,
  );
  assert.throws(
    () => parseFinalizedResumeRequest({ ...request, apiKey: "must-not-reach-renderer" }),
    /renderer-only/,
  );
  assert.throws(() => parseFinalizedResumeRequest({ launch: request.launch }), /handoff/);
});

test("maps only Resume Studio documents into persistent variant payloads", () => {
  const storedResume = {
    ...nativeResume,
    metadata: { resumeStudio: completeProvenance },
  };

  const payload = resumeVariantFromStoredResume(storedResume);

  assert.equal(payload?.vacancy_id, "EU-LI-123");
  assert.equal(payload?.resume_id, "resume-1");
  assert.deepEqual(payload?.resume, storedResume);
  assert.equal(payload?.provenance.generator, "openai:gpt-test");
  assert.equal(resumeVariantFromStoredResume({ ...nativeResume, metadata: {} }), null);
});

test("identifies Career Twin-managed resumes so semantic rewrite actions stay disabled", () => {
  assert.equal(isCareerTwinManagedResume({
    ...nativeResume,
    metadata: { resumeStudio: completeProvenance },
  }), true);
  assert.equal(isCareerTwinManagedResume(nativeResume), false);
  assert.equal(isCareerTwinManagedResume({
    ...nativeResume,
    metadata: { resumeStudio: {} },
  }), false);
});

test("posts a created resume variant using the required contract", async () => {
  let request: { url: string; init?: RequestInit } | undefined;
  const result = await syncResumeVariant(
    "http://127.0.0.1:8765",
    {
      vacancy_id: "EU-LI-123",
      resume_id: "resume-1",
      language: "en",
      title: "Trusted role",
      resume: nativeResume,
      provenance: completeProvenance,
      status: "created",
    },
    async (url, init) => {
      request = { url: String(url), init };
      return new Response(null, { status: 201 });
    },
    "scoped-integration-token",
  );

  assert.deepEqual(result, { ok: true });
  assert.equal(request?.url, "http://127.0.0.1:8765/api/v1/resume-variants");
  assert.equal(request?.init?.method, "POST");
  assert.equal((request?.init?.headers as Record<string, string>)["Content-Type"], "application/json");
  assert.equal(
    (request?.init?.headers as Record<string, string>).Authorization,
    "Bearer scoped-integration-token",
  );
  assert.equal(JSON.parse(String(request?.init?.body)).resume_id, "resume-1");
  assert.deepEqual(JSON.parse(String(request?.init?.body)).resume, nativeResume);
  assert.deepEqual(
    JSON.parse(String(request?.init?.body)).provenance.evidenceMap,
    completeProvenance.evidenceMap,
  );
});

test("completes a one-time handoff without exposing the integration capability", async () => {
  let request: { url: string; init?: RequestInit } | undefined;
  const result = await completeResumeHandoff(
    "http://127.0.0.1:8765",
    "one-time-secret-12345678901234567",
    {
      vacancy_id: "EU-LI-123",
      resume_id: "resume-1",
      language: "en",
      title: "Trusted role",
      resume: nativeResume,
      provenance: completeProvenance,
      status: "created",
    },
    async (url, init) => {
      request = { url: String(url), init };
      return new Response(null, { status: 201 });
    },
  );

  assert.deepEqual(result, { ok: true });
  assert.equal(
    request?.url,
    "http://127.0.0.1:8765/api/v1/resume-handoffs/one-time-secret-12345678901234567/complete",
  );
  assert.equal((request?.init?.headers as Record<string, string>).Authorization, undefined);
  assert.equal(JSON.parse(String(request?.init?.body)).schema_version, 1);
});


test("reports callback failures without throwing away the locally-created resume", async () => {
  const result = await syncResumeVariant(
    "http://127.0.0.1:8765/api/v1/resume-variants",
    {
      vacancy_id: "EU-LI-123",
      resume_id: "resume-1",
      language: "ru",
      title: "Роль",
      resume: nativeResume,
      provenance: { ...completeProvenance, artifactLanguage: "ru" },
      status: "created",
    },
    async () => { throw new Error("connection refused"); },
  );

  assert.equal(result.ok, false);
  assert.match(result.error || "", /connection refused/);
});

test("rejects a non-loopback callback destination before sending provenance", async () => {
  let calls = 0;
  const result = await syncResumeVariant(
    "https://collector.example",
    {
      vacancy_id: "EU-LI-123",
      resume_id: "resume-1",
      language: "en",
      title: "Trusted role",
      resume: nativeResume,
      provenance: completeProvenance,
      status: "created",
    },
    async () => {
      calls += 1;
      return new Response(null, { status: 201 });
    },
  );

  assert.equal(result.ok, false);
  assert.equal(calls, 0);
  assert.match(result.error || "", /loopback/i);
});

test("forbids following callback redirects that could leave loopback", async () => {
  let redirect: RequestRedirect | undefined;
  const result = await syncResumeVariant(
    "http://127.0.0.1:8765",
    {
      vacancy_id: "EU-LI-123",
      resume_id: "resume-1",
      language: "en",
      title: "Trusted role",
      resume: nativeResume,
      provenance: completeProvenance,
      status: "created",
    },
    async (_url, init) => {
      redirect = init?.redirect;
      return new Response(null, { status: 201 });
    },
  );

  assert.equal(result.ok, true);
  assert.equal(redirect, "error");
});
