import assert from "node:assert/strict";
import test from "node:test";
import {
  assertTailoredResume,
  isAggregateYearsClaim,
  parseVacancyLaunch,
} from "./resumeTailoring";

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
