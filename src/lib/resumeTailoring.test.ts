import assert from "node:assert/strict";
import test from "node:test";
import {
  applyTrustedVacancyIdentity,
  assertTailoredResume,
  buildAllowedCareerFacts,
  isAggregateYearsClaim,
  isVacancySourceCompatible,
  normalizeRequirementMap,
  parseVacancyLaunch,
  semanticVerdictsPass,
  vacancySourceIdCandidates,
} from "./resumeTailoring";

test("normalizes structured requirement provenance into the runtime claim map", () => {
  assert.deepEqual(normalizeRequirementMap([
    { claim: "Led an AI portfolio", requirementIds: ["R001", "R002", "R001"] },
    { claim: "Led an AI portfolio", requirementIds: ["R003"] },
    { claim: "", requirementIds: ["R004"] },
  ]), {
    "Led an AI portfolio": ["R001", "R002", "R003"],
  });
});

const validResume = {
  title: "Head of AI CV",
  language: "en",
  targetRole: "Head of AI",
  basic: { name: "Candidate", title: "Head of AI", email: "", phone: "", location: "" },
  summary: "Relevant summary",
  experience: [{ company: "Acme", position: "Lead", date: "2025", details: ["Led AI governance"] }],
  projects: [],
  education: [],
  skills: ["AI governance"],
  evidenceMap: { "Relevant summary": ["F0001"] },
  requirementMap: { "Relevant summary": ["R001"] },
  audit: {
    score: 80,
    summary: "Strong fit",
    directEvidence: [],
    adjacentEvidence: [],
    gaps: [],
    excludedClaims: [],
  },
};

test("parses a one-click vacancy launch and preserves explicit language", () => {
  const launch = parseVacancyLaunch(
    "?studio=vacancy&id=EU-LI-1&source=linkedin.com&language=en&company=Acme&role=Head%20of%20AI&url=https%3A%2F%2Fexample.com",
  );

  assert.deepEqual(launch, {
    id: "EU-LI-1",
    source: "linkedin.com",
    language: "en",
    company: "Acme",
    role: "Head of AI",
    url: "https://example.com",
  });
});

test("rejects incomplete vacancy launches", () => {
  assert.equal(parseVacancyLaunch("?studio=vacancy&id=RU-HH-1"), null);
  assert.equal(parseVacancyLaunch("?id=RU-HH-1&role=Lead"), null);
});

test("maps tracker IDs to source-specific lookup IDs", () => {
  assert.deepEqual(vacancySourceIdCandidates("RU-HH-135539415"), [
    "RU-HH-135539415",
    "135539415",
  ]);
  assert.deepEqual(vacancySourceIdCandidates("AUTO-HH-131995174"), [
    "AUTO-HH-131995174",
    "131995174",
  ]);
  assert.deepEqual(vacancySourceIdCandidates("EU-IN-52e89d5959e952a9"), [
    "EU-IN-52e89d5959e952a9",
    "52e89d5959e952a9",
    "in-52e89d5959e952a9",
  ]);
  assert.deepEqual(vacancySourceIdCandidates("AUTO-INDEED-in-40eeee6ec923fdfa"), [
    "AUTO-INDEED-in-40eeee6ec923fdfa",
    "in-40eeee6ec923fdfa",
    "40eeee6ec923fdfa",
  ]);
  assert.deepEqual(vacancySourceIdCandidates("AUTO-LINKEDIN-4448786779"), [
    "AUTO-LINKEDIN-4448786779",
    "4448786779",
  ]);
  assert.deepEqual(vacancySourceIdCandidates("AUTO-HIRIFY-676216"), [
    "AUTO-HIRIFY-676216",
    "676216",
  ]);
});

test("requires the tracker source to match the canonical ID family", () => {
  assert.equal(isVacancySourceCompatible("RU-HH-1", "hh.ru"), true);
  assert.equal(isVacancySourceCompatible("AUTO-HH-1", "hh"), true);
  assert.equal(isVacancySourceCompatible("RU-HH-1", "linkedin.com"), false);
  assert.equal(isVacancySourceCompatible("EU-IN-abc", "indeed.com"), true);
  assert.equal(isVacancySourceCompatible("AUTO-INDEED-in-abc", "indeed"), true);
  assert.equal(isVacancySourceCompatible("AUTO-LINKEDIN-123", "linkedin"), true);
  assert.equal(isVacancySourceCompatible("AUTO-HIRIFY-676216", "hirify"), true);
  assert.equal(isVacancySourceCompatible("AUTO-HIRIFY-676216", "hirify.me"), true);
  assert.equal(isVacancySourceCompatible("AUTO-HIRIFY-676216", "hh.ru"), false);
  assert.equal(isVacancySourceCompatible("EU-LI-123", "evil-linkedin.com"), false);
});

test("semantic evidence verification rejects missing or negative verdicts", () => {
  assert.equal(semanticVerdictsPass(["C0001"], {
    verdicts: [{ id: "C0001", supported: true }],
  }), true);
  assert.equal(semanticVerdictsPass(["C0001"], {
    verdicts: [{ id: "C0001", supported: false }],
  }), false);
  assert.equal(semanticVerdictsPass(["C0001", "C0002"], {
    verdicts: [{ id: "C0001", supported: true }],
  }), false);
});

test("trusted vacancy identity overrides generated role and file title", () => {
  const draft = {
    targetRole: "Chief Machine Learning Engineer",
    title: "Invented promotion",
    basic: { title: "Chief Machine Learning Engineer" },
  };
  applyTrustedVacancyIdentity(
    draft,
    { title: "Head of AI Transformation", company: "Acme" },
    "en",
  );
  assert.equal(draft.targetRole, "Head of AI Transformation");
  assert.equal(draft.basic.title, "Head of AI Transformation");
  assert.equal(draft.title, "Acme — Head of AI Transformation — EN");
});

test("removes risky and confirmation-required career claims", () => {
  const allowed = buildAllowedCareerFacts(`# Experience
- Confirmed portfolio of 60+ initiatives.
- 400 million profit. requires confirmation
# Claims, которые нельзя усиливать без подтверждения
- Five models in production.
# Education
- Higher education.`);
  assert.match(allowed.prompt, /60\+/);
  assert.match(allowed.prompt, /Higher education/);
  assert.doesNotMatch(allowed.prompt, /400 million|Five models/);
});

test("detects prohibited aggregate total-years claims deterministically", () => {
  assert.equal(isAggregateYearsClaim("6+ лет в AI-трансформации"), true);
  assert.equal(isAggregateYearsClaim("Six domains and 6 years of experience"), true);
  assert.equal(isAggregateYearsClaim("6 лет опыта управления портфелем"), true);
  assert.equal(isAggregateYearsClaim("Six years of experience"), true);
  assert.equal(isAggregateYearsClaim("6 yrs of experience"), true);
  assert.equal(isAggregateYearsClaim("Опыт 6 лет в трансформации"), true);
  assert.equal(isAggregateYearsClaim("6-летний опыт управления"), true);
  assert.equal(isAggregateYearsClaim("Experience of six years"), true);
  assert.equal(isAggregateYearsClaim("Опыт: шесть лет"), true);
  assert.equal(isAggregateYearsClaim("Работал в компании с 2018 по 2024 год"), false);
  assert.equal(isAggregateYearsClaim("Three-year transformation programme"), false);
  assert.throws(
    () => assertTailoredResume({ ...validResume, summary: "6+ years of experience" }),
    /aggregate total-years claim/,
  );
});

test("tailored resume validation requires evidence audit", () => {
  assert.throws(
    () =>
      assertTailoredResume({
        ...validResume,
        audit: undefined,
      }),
    /evidence audit/,
  );
});

test("tailored resume validation requires claim-level requirement provenance", () => {
  assert.throws(
    () => assertTailoredResume({ ...validResume, requirementMap: undefined }),
    /requirement provenance/,
  );
});

test("preserves legitimate low scores on the required 100-point scale", () => {
  const resume = assertTailoredResume({
    ...validResume,
    audit: { ...validResume.audit, score: 4 },
  });

  assert.equal(resume.audit.score, 4);
  assert.throws(
    () => assertTailoredResume({
      ...validResume,
      audit: { ...validResume.audit, score: 101 },
    }),
    /invalid fit score/,
  );
});

test("rejects wrong-language and structurally empty experience", () => {
  assert.throws(() => assertTailoredResume(validResume, "ru"), /wrong language/);
  assert.throws(
    () => assertTailoredResume({ ...validResume, experience: [{}] }),
    /relevant experience/,
  );
});
