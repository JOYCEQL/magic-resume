import assert from "node:assert/strict";
import test from "node:test";
import {
  applyResumeSelectionPlan,
  buildResumeSelectionPlan,
  calculateVacancyFitScore,
  finalizeRequirementEvidenceMatches,
  finalizeVacancyAnalysis,
  groundResumeSummary,
  pruneResumeToMatchedEvidence,
  resumeRelevanceErrors,
  resumeRequirementCoverageErrors,
  runVacancyRelevanceStages,
  type RequirementEvidenceArtifact,
  type VacancyAnalysis,
  type VacancyAnalysisDraft,
} from "./vacancyRelevance";
import type { EvidenceItem } from "./resumeStudioData";

const vacancy = {
  tracker_id: "EU-LI-4449652677",
  description: [
    "Lead an integrated AI transformation portfolio across the firm.",
    "Provide decision-oriented recommendations to the steering board.",
    "Track value realisation, dependencies, adoption and regulatory risk.",
  ].join(" "),
  provenance: {
    path: "/trusted/linkedin_2026-08-05.json",
    sha256: "a".repeat(64),
    collectedAt: "2026-08-05T10:00:00Z",
  },
};

const analysisDraft: VacancyAnalysisDraft = {
  requirements: [
    {
      category: "portfolio",
      text: "Lead an integrated AI transformation portfolio.",
      sourceText: "Lead an integrated AI transformation portfolio across the firm.",
      priority: "must",
      weight: 95,
      evidenceExpected: "direct",
    },
    {
      category: "governance",
      text: "Advise the steering board with decision-oriented recommendations.",
      sourceText: "Provide decision-oriented recommendations to the steering board.",
      priority: "important",
      weight: 80,
      evidenceExpected: "adjacent-acceptable",
    },
  ],
  outcomes: ["Value realisation"],
  context: ["Firm-wide transformation"],
  risks: ["Regulatory risk"],
};

test("finalizes structured vacancy analysis with stable requirement IDs and trusted provenance", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);

  assert.equal(analysis.vacancyId, "EU-LI-4449652677");
  assert.deepEqual(analysis.requirements.map(({ id }) => id), ["R001", "R002"]);
  assert.deepEqual(analysis.provenance, {
    vacancyId: "EU-LI-4449652677",
    sha256: "a".repeat(64),
    path: "/trusted/linkedin_2026-08-05.json",
    collectedAt: "2026-08-05T10:00:00Z",
  });
  assert.equal(analysis.requirements[0].category, "portfolio");
  assert.equal(analysis.requirements[1].evidenceExpected, "adjacent-acceptable");
});

test("rejects vacancy requirements whose source quote is absent from the trusted description", () => {
  assert.throws(
    () => finalizeVacancyAnalysis({
      ...analysisDraft,
      requirements: [{
        ...analysisDraft.requirements[0],
        sourceText: "Build a secure internal AI platform product.",
      }],
    }, vacancy),
    /sourceText is not present in trusted vacancy/,
  );
  assert.throws(
    () => finalizeVacancyAnalysis({
      ...analysisDraft,
      requirements: [{
        ...analysisDraft.requirements[0],
        sourceText: analysisDraft.requirements[0].sourceText.toLowerCase(),
      }],
    }, vacancy),
    /sourceText is not present in trusted vacancy/,
  );
});

test("keeps materially different vacancy requirement profiles distinct", () => {
  const platformVacancy = {
    tracker_id: "EU-LI-4445475704",
    description: "Own a secure internal AI platform product with reusable deployment patterns and access controls.",
    provenance: {
      path: "/trusted/linkedin_2026-07-29.json",
      sha256: "b".repeat(64),
      collectedAt: "2026-07-29T10:00:00Z",
    },
  };
  const platform = finalizeVacancyAnalysis({
    requirements: [{
      category: "platform",
      text: "Own a secure internal AI platform product.",
      sourceText: platformVacancy.description,
      priority: "must",
      weight: 100,
      evidenceExpected: "direct",
    }],
    outcomes: ["Reusable AI capabilities"],
    context: ["Internal product"],
    risks: ["Access control"],
  }, platformVacancy);
  const portfolio = finalizeVacancyAnalysis(analysisDraft, vacancy);

  assert.notDeepEqual(
    portfolio.requirements.map(({ category, text }) => ({ category, text })),
    platform.requirements.map(({ category, text }) => ({ category, text })),
  );
});

const evidenceItems: EvidenceItem[] = [
  {
    id: "E-portfolio0000001",
    claim: "Managed an enterprise AI portfolio and its dependencies.",
    status: "подтверждено источником",
    employer: "Exchange",
    source: { path: "/career.md", sha256: "c".repeat(64), locator: "line:10" },
  },
  {
    id: "E-platform00000001",
    claim: "Defined reusable integration patterns for an internal AI platform.",
    status: "подтверждено пользователем",
    employer: "Digital",
    source: { path: "/career.md", sha256: "c".repeat(64), locator: "line:20" },
  },
  {
    id: "E-governance000001",
    claim: "Prepared governance recommendations for an executive committee.",
    status: "подтверждено источником",
    employer: "Exchange",
    source: { path: "/career.md", sha256: "c".repeat(64), locator: "line:30" },
  },
];

test("validates requirement-to-fact matches and ranks employers from their strongest facts", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  const artifact = finalizeRequirementEvidenceMatches([
    {
      requirementId: "R001",
      matches: [{
        evidenceId: "E-portfolio0000001",
        support: "direct",
        relevanceScore: 95,
        reason: "Direct portfolio ownership evidence.",
      }],
    },
    {
      requirementId: "R002",
      matches: [{
        evidenceId: "E-governance000001",
        support: "adjacent",
        relevanceScore: 75,
        reason: "Executive governance is adjacent to steering-board advice.",
      }],
    },
  ], analysis, evidenceItems);

  assert.equal(artifact.mappings[0].matches[0].employer, "Exchange");
  assert.equal(artifact.mappings[1].matches[0].support, "adjacent");
  assert.deepEqual(artifact.uncoveredMustHaveRequirementIds, []);
  assert.deepEqual(artifact.employerRanking.map(({ employer }) => employer), ["Exchange"]);
  assert.ok(artifact.employerRanking[0].score > 0);
});

test("builds a bounded selection plan from the strongest vacancy requirements", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  const matching = finalizeRequirementEvidenceMatches([
    {
      requirementId: "R001",
      matches: [{
        evidenceId: "E-portfolio0000001",
        support: "direct",
        relevanceScore: 95,
        reason: "Direct portfolio ownership evidence.",
      }],
    },
    {
      requirementId: "R002",
      matches: [{
        evidenceId: "E-governance000001",
        support: "adjacent",
        relevanceScore: 75,
        reason: "Adjacent governance evidence.",
      }],
    },
  ], analysis, evidenceItems);

  const plan = buildResumeSelectionPlan(analysis, matching, {
    maxRequirements: 1,
    maxEvidence: 1,
    maxEmployers: 1,
  });

  assert.deepEqual(plan.requirementIds, ["R001"]);
  assert.deepEqual(plan.excludedRequirementIds, ["R002"]);
  assert.deepEqual(plan.evidenceIds, ["E-portfolio0000001"]);
  assert.deepEqual(plan.employers, ["Exchange"]);
  assert.deepEqual(plan.evidenceRequirementIds, {
    "E-portfolio0000001": ["R001"],
  });
  assert.match(plan.requirementReasons.R001, /Selected/);
  assert.match(plan.requirementReasons.R002, /outside the top-1/);
  assert.match(plan.evidenceReasons["E-portfolio0000001"], /R001/);
  assert.match(plan.employerReasons.Exchange, /E-portfolio0000001/);
});

test("selection plan defaults to the five strongest reasons to hire", () => {
  const requirements: VacancyAnalysis["requirements"] = Array.from({ length: 8 }, (_, index) => ({
    id: `R${String(index + 1).padStart(3, "0")}`,
    category: "portfolio",
    text: `Requirement ${index + 1}`,
    sourceText: `Requirement ${index + 1}`,
    priority: "must" as const,
    weight: 100 - index,
    evidenceExpected: "direct" as const,
  }));
  const analysis: VacancyAnalysis = {
    ...finalizeVacancyAnalysis(analysisDraft, vacancy),
    requirements,
  };
  const matching: RequirementEvidenceArtifact = {
    vacancyId: vacancy.tracker_id,
    mappings: requirements.map((requirement, index) => ({
      requirementId: requirement.id,
      matches: [{
        evidenceId: `E-${String(index).padStart(16, "0")}`,
        support: "direct",
        relevanceScore: 100 - index,
        reason: "Direct evidence.",
      }],
    })),
    employerRanking: [],
    uncoveredMustHaveRequirementIds: [],
  };

  assert.deepEqual(
    buildResumeSelectionPlan(analysis, matching).requirementIds,
    ["R001", "R002", "R003", "R004", "R005"],
  );
});

test("employer budget removes evidence owned only by excluded employers", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  const matching = finalizeRequirementEvidenceMatches([
    {
      requirementId: "R001",
      matches: [{
        evidenceId: "E-portfolio0000001",
        support: "direct",
        relevanceScore: 95,
        reason: "Primary employer evidence.",
      }],
    },
    {
      requirementId: "R002",
      matches: [{
        evidenceId: "E-platform00000001",
        support: "direct",
        relevanceScore: 90,
        reason: "Evidence owned by a lower-ranked employer.",
      }],
    },
  ], analysis, evidenceItems);

  const plan = buildResumeSelectionPlan(analysis, matching, {
    maxRequirements: 2,
    maxEvidence: 2,
    maxEmployers: 1,
  });

  assert.deepEqual(plan.employers, ["Exchange"]);
  assert.deepEqual(plan.evidenceIds, ["E-portfolio0000001"]);
  assert.deepEqual(plan.requirementIds, ["R001"]);
  assert.deepEqual(plan.excludedRequirementIds, ["R002"]);
  assert.match(plan.evidenceReasons["E-platform00000001"], /employer budget/);
  assert.match(plan.requirementReasons.R002, /selected evidence was removed by the evidence or employer budget/);
  assert.deepEqual(resumeRequirementCoverageErrors({
    evidenceMap: {
      "Focused portfolio claim": ["E-portfolio0000001"],
    },
    requirementMap: {
      "Focused portfolio claim": ["R001"],
    },
  }, analysis, matching, plan), []);
});

test("direct coverage ignores direct evidence removed by the employer budget", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  const matching = finalizeRequirementEvidenceMatches([
    {
      requirementId: "R001",
      matches: [{
        evidenceId: "E-portfolio0000001",
        support: "direct",
        relevanceScore: 95,
        reason: "Selected direct evidence.",
      }],
    },
    {
      requirementId: "R002",
      matches: [{
        evidenceId: "E-governance000001",
        support: "adjacent",
        relevanceScore: 75,
        reason: "Selected adjacent evidence.",
      }, {
        evidenceId: "E-platform00000001",
        support: "direct",
        relevanceScore: 90,
        reason: "Direct evidence owned by the excluded employer.",
      }],
    },
  ], analysis, evidenceItems);
  const plan = buildResumeSelectionPlan(analysis, matching, {
    maxRequirements: 2,
    maxEvidence: 3,
    maxEmployers: 1,
  });

  assert.deepEqual(plan.requirementIds, ["R001", "R002"]);
  assert.deepEqual(plan.evidenceIds, ["E-portfolio0000001", "E-governance000001"]);
  assert.deepEqual(resumeRequirementCoverageErrors({
    evidenceMap: {
      "Focused portfolio claim": ["E-portfolio0000001"],
      "Governance claim": ["E-governance000001"],
    },
    requirementMap: {
      "Focused portfolio claim": ["R001"],
      "Governance claim": ["R002"],
    },
  }, analysis, matching, plan), []);
});

test("calculates fit from weighted direct, adjacent and unsupported evidence", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  const matching = finalizeRequirementEvidenceMatches([
    {
      requirementId: "R001",
      matches: [{
        evidenceId: "E-portfolio0000001",
        support: "direct",
        relevanceScore: 95,
        reason: "Direct portfolio evidence.",
      }],
    },
    {
      requirementId: "R002",
      matches: [{
        evidenceId: "E-governance000001",
        support: "adjacent",
        relevanceScore: 75,
        reason: "Adjacent governance evidence.",
      }],
    },
  ], analysis, evidenceItems);
  const plan = buildResumeSelectionPlan(analysis, matching);

  assert.equal(calculateVacancyFitScore(analysis, matching, plan), 72);
});

test("represents unsupported must-haves as explicit gaps without invented evidence", () => {
  const platformVacancy = {
    tracker_id: "EU-LI-4445475704",
    description: "Own data classification and differentiated access controls for the AI platform.",
    provenance: {
      path: "/trusted/platform.json",
      sha256: "d".repeat(64),
      collectedAt: "2026-07-29T10:00:00Z",
    },
  };
  const analysis = finalizeVacancyAnalysis({
    requirements: [{
      category: "platform",
      text: "Own data classification and differentiated access controls.",
      sourceText: platformVacancy.description,
      priority: "must",
      weight: 100,
      evidenceExpected: "direct",
    }],
    outcomes: [],
    context: ["Regulated AI platform"],
    risks: ["Access control"],
  }, platformVacancy);
  const artifact = finalizeRequirementEvidenceMatches([{
    requirementId: "R001",
    matches: [{
      support: "unsupported",
      relevanceScore: 0,
      reason: "No canonical evidence proves data-classification ownership.",
    }],
  }], analysis, evidenceItems);

  assert.deepEqual(artifact.uncoveredMustHaveRequirementIds, ["R001"]);
  assert.equal(artifact.mappings[0].gap, "No canonical evidence proves data-classification ownership.");
  assert.equal(artifact.mappings[0].matches[0].evidenceId, undefined);
  assert.deepEqual(buildResumeSelectionPlan(analysis, artifact).requirementIds, ["R001"]);
});

test("rejects unknown evidence IDs and unsupported matches disguised as supported facts", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  assert.throws(() => finalizeRequirementEvidenceMatches([
    {
      requirementId: "R001",
      matches: [{
        evidenceId: "E-invented0000000",
        support: "direct",
        relevanceScore: 100,
        reason: "Invented.",
      }],
    },
    {
      requirementId: "R002",
      matches: [{ support: "unsupported", relevanceScore: 0, reason: "Gap." }],
    },
  ], analysis, evidenceItems), /unknown evidence ID/);

  assert.throws(() => finalizeRequirementEvidenceMatches([
    {
      requirementId: "R001",
      matches: [{
        evidenceId: "E-portfolio0000001",
        support: "unsupported",
        relevanceScore: 50,
        reason: "Contradictory state.",
      }],
    },
    {
      requirementId: "R002",
      matches: [{ support: "unsupported", relevanceScore: 0, reason: "Gap." }],
    },
  ], analysis, evidenceItems), /unsupported match cannot cite evidence/);
});

test("runs vacancy analysis before evidence matching and isolates career evidence from analysis", async () => {
  const calls: Array<{ stage: string; prompt: string }> = [];
  const result = await runVacancyRelevanceStages({
    vacancy: {
      ...vacancy,
      title: "Head of AI Transformation",
      company: "Firm",
      tracker_language: "en",
    },
    evidenceItems,
    generate: async (stage, prompt) => {
      calls.push({ stage, prompt });
      if (stage === "vacancy-analysis") return analysisDraft as unknown as Record<string, unknown>;
      return {
        mappings: [
          {
            requirementId: "R001",
            matches: [{
              evidenceId: "E-portfolio0000001",
              support: "direct",
              relevanceScore: 95,
              reason: "Direct portfolio evidence.",
            }],
          },
          {
            requirementId: "R002",
            matches: [{
              evidenceId: "E-governance000001",
              support: "adjacent",
              relevanceScore: 75,
              reason: "Adjacent governance evidence.",
            }],
          },
        ],
      };
    },
  });

  assert.deepEqual(calls.map(({ stage }) => stage), ["vacancy-analysis", "evidence-matching"]);
  assert.doesNotMatch(calls[0].prompt, /Managed an enterprise AI portfolio/);
  assert.match(calls[0].prompt, /Head of AI Transformation/);
  assert.match(calls[1].prompt, /R001|E-portfolio0000001/);
  assert.equal(result.analysis.provenance.sha256, "a".repeat(64));
  assert.equal(result.matching.mappings[0].matches[0].evidenceId, "E-portfolio0000001");
});

test("rejects resume bullets that contribute no matched vacancy evidence", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  const matching = finalizeRequirementEvidenceMatches([
    {
      requirementId: "R001",
      matches: [{
        evidenceId: "E-portfolio0000001",
        support: "direct",
        relevanceScore: 95,
        reason: "Direct portfolio evidence.",
      }],
    },
    {
      requirementId: "R002",
      matches: [{ support: "unsupported", relevanceScore: 0, reason: "Gap." }],
    },
  ], analysis, evidenceItems);
  const resume = {
    experience: [{
      details: ["Relevant portfolio bullet", "Generic unmatched bullet"],
    }],
    projects: [],
    evidenceMap: {
      "Relevant portfolio bullet": ["E-portfolio0000001"],
      "Generic unmatched bullet": ["E-platform00000001"],
    },
  };

  assert.deepEqual(resumeRelevanceErrors(resume, matching), [
    "bullet has no matched vacancy evidence: Generic unmatched bullet",
  ]);
});

test("deterministically removes bullets outside validated vacancy matching", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  const matching = finalizeRequirementEvidenceMatches([
    {
      requirementId: "R001",
      matches: [{
        evidenceId: "E-portfolio0000001",
        support: "direct",
        relevanceScore: 95,
        reason: "Direct portfolio evidence.",
      }],
    },
    {
      requirementId: "R002",
      matches: [{ support: "unsupported", relevanceScore: 0, reason: "Gap." }],
    },
  ], analysis, evidenceItems);
  const resume = {
    experience: [{ details: ["Relevant portfolio bullet", "Generic unmatched bullet"] }],
    projects: [{ description: ["Generic project claim"] }],
    evidenceMap: {
      "Relevant portfolio bullet": ["E-portfolio0000001"],
      "Generic unmatched bullet": ["E-platform00000001"],
      "Generic project claim": ["E-platform00000001"],
    },
  };

  pruneResumeToMatchedEvidence(resume, matching);

  assert.deepEqual(resume.experience[0].details, ["Relevant portfolio bullet"]);
  assert.deepEqual(resume.projects[0].description, []);
  assert.deepEqual(resumeRelevanceErrors(resume, matching), []);
});

test("selection plan removes low-priority material and records requirement provenance", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  const matching = finalizeRequirementEvidenceMatches([
    {
      requirementId: "R001",
      matches: [{
        evidenceId: "E-portfolio0000001",
        support: "direct",
        relevanceScore: 95,
        reason: "Direct portfolio evidence.",
      }],
    },
    {
      requirementId: "R002",
      matches: [{
        evidenceId: "E-governance000001",
        support: "adjacent",
        relevanceScore: 75,
        reason: "Adjacent governance evidence.",
      }],
    },
  ], analysis, evidenceItems);
  const plan = buildResumeSelectionPlan(analysis, matching, {
    maxRequirements: 1,
    maxEvidence: 1,
  });
  const resume = {
    summary: "Focused portfolio leader",
    experience: [
      { company: "Exchange", details: ["Portfolio bullet"] },
      { company: "Digital", details: ["Platform bullet"] },
    ],
    projects: [{ name: "Generic", description: ["Platform bullet"] }],
    skills: ["Portfolio leadership", "Platform architecture"],
    evidenceMap: {
      "Focused portfolio leader": ["E-portfolio0000001"],
      "Portfolio bullet": ["E-portfolio0000001", "E-platform00000001"],
      "Platform bullet": ["E-platform00000001"],
      "Portfolio leadership": ["E-portfolio0000001"],
      "Platform architecture": ["E-platform00000001"],
    },
    requirementMap: {
      "Focused portfolio leader": ["R001"],
      "Portfolio bullet": ["R001"],
      "Portfolio leadership": ["R001"],
    } as Record<string, string[]>,
  };

  applyResumeSelectionPlan(resume, plan);

  assert.deepEqual(resume.experience, [{ company: "Exchange", details: ["Portfolio bullet"] }]);
  assert.deepEqual(resume.projects, []);
  assert.deepEqual(resume.skills, ["Portfolio leadership"]);
  assert.deepEqual(resume.evidenceMap["Portfolio bullet"], ["E-portfolio0000001"]);
  assert.equal("Platform bullet" in resume.evidenceMap, false);
  assert.deepEqual(resume.requirementMap, {
    "Focused portfolio leader": ["R001"],
    "Portfolio bullet": ["R001"],
    "Portfolio leadership": ["R001"],
  });
});

test("requires the selected weighted requirement profile to appear in the CV", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  const matching = finalizeRequirementEvidenceMatches([
    {
      requirementId: "R001",
      matches: [{
        evidenceId: "E-portfolio0000001",
        support: "direct",
        relevanceScore: 95,
        reason: "Direct portfolio evidence.",
      }],
    },
    {
      requirementId: "R002",
      matches: [{
        evidenceId: "E-governance000001",
        support: "adjacent",
        relevanceScore: 75,
        reason: "Adjacent governance evidence.",
      }],
    },
  ], analysis, evidenceItems);
  const plan = buildResumeSelectionPlan(analysis, matching);
  const resume = {
    summary: "Governance profile",
    experience: [{ details: ["Governance bullet"] }],
    projects: [],
    skills: ["Governance"],
    evidenceMap: {
      "Governance profile": ["E-governance000001"],
      "Governance bullet": ["E-governance000001"],
      "Governance": ["E-governance000001"],
    } as Record<string, string[]>,
    requirementMap: {
      "Governance profile": ["R002"],
      "Governance bullet": ["R002"],
      "Governance": ["R002"],
    } as Record<string, string[]>,
  };
  applyResumeSelectionPlan(resume, plan);

  assert.match(resumeRequirementCoverageErrors(resume, analysis, matching, plan).join("\n"), /weighted requirement coverage/);

  resume.summary = "Portfolio and governance profile";
  resume.evidenceMap[resume.summary] = ["E-portfolio0000001", "E-governance000001"];
  resume.requirementMap[resume.summary] = ["R001", "R002"];
  applyResumeSelectionPlan(resume, plan);
  assert.deepEqual(resumeRequirementCoverageErrors(resume, analysis, matching, plan), []);
});

test("does not inflate claim coverage when one evidence item matches multiple requirements", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  const matching = finalizeRequirementEvidenceMatches([
    {
      requirementId: "R001",
      matches: [{
        evidenceId: "E-portfolio0000001",
        support: "direct",
        relevanceScore: 95,
        reason: "Direct portfolio evidence.",
      }],
    },
    {
      requirementId: "R002",
      matches: [{
        evidenceId: "E-portfolio0000001",
        support: "adjacent",
        relevanceScore: 75,
        reason: "The same evidence is only adjacent for governance.",
      }],
    },
  ], analysis, evidenceItems);
  const plan = buildResumeSelectionPlan(analysis, matching);
  const resume = {
    summary: "Portfolio profile",
    experience: [{ details: ["Portfolio delivery"] }],
    projects: [],
    skills: [],
    evidenceMap: {
      "Portfolio profile": ["E-portfolio0000001"],
      "Portfolio delivery": ["E-portfolio0000001"],
    } as Record<string, string[]>,
    requirementMap: {
      "Portfolio profile": ["R001"],
      "Portfolio delivery": ["R001"],
    } as Record<string, string[]>,
  };

  applyResumeSelectionPlan(resume, plan);

  assert.deepEqual(resume.requirementMap, {
    "Portfolio profile": ["R001"],
    "Portfolio delivery": ["R001"],
  });
  assert.match(
    resumeRequirementCoverageErrors(resume, analysis, matching, plan).join("\n"),
    /weighted requirement coverage/,
  );
});

test("replaces an uncited generated summary with a matched canonical fact", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  const matching = finalizeRequirementEvidenceMatches([{
    requirementId: "R001",
    matches: [{
      evidenceId: "E-portfolio0000001",
      support: "direct",
      relevanceScore: 95,
      reason: "Direct portfolio evidence.",
    }],
  }, {
    requirementId: "R002",
    matches: [{ support: "unsupported", relevanceScore: 0, reason: "Gap." }],
  }], analysis, evidenceItems);
  const resume = {
    summary: "Generated uncited positioning",
    evidenceMap: {} as Record<string, string[]>,
  };

  groundResumeSummary(resume, matching, evidenceItems);

  assert.equal(resume.summary, "Managed an enterprise AI portfolio and its dependencies.");
  assert.deepEqual(resume.evidenceMap[resume.summary], ["E-portfolio0000001"]);
});

test("summary fallback combines the strongest selected evidence instead of collapsing to one fact", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  const matching = finalizeRequirementEvidenceMatches([
    {
      requirementId: "R001",
      matches: [{
        evidenceId: "E-portfolio0000001",
        support: "direct",
        relevanceScore: 95,
        reason: "Direct portfolio evidence.",
      }],
    },
    {
      requirementId: "R002",
      matches: [{
        evidenceId: "E-governance000001",
        support: "direct",
        relevanceScore: 90,
        reason: "Direct governance evidence.",
      }],
    },
  ], analysis, evidenceItems);
  const plan = buildResumeSelectionPlan(analysis, matching);
  const resume = {
    summary: "Uncited positioning",
    evidenceMap: {} as Record<string, string[]>,
  };

  groundResumeSummary(resume, matching, evidenceItems, plan);

  assert.match(resume.summary, /Managed an enterprise AI portfolio/);
  assert.match(resume.summary, /Prepared governance recommendations/);
  assert.deepEqual(resume.evidenceMap[resume.summary], [
    "E-portfolio0000001",
    "E-governance000001",
  ]);
});

test("summary fallback does not copy Russian evidence into an English CV", () => {
  const analysis = finalizeVacancyAnalysis(analysisDraft, vacancy);
  const russianEvidence = [{
    ...evidenceItems[0],
    claim: "Управлял корпоративным портфелем ИИ и зависимостями.",
  }];
  const matching = finalizeRequirementEvidenceMatches([{
    requirementId: "R001",
    matches: [{
      evidenceId: "E-portfolio0000001",
      support: "direct",
      relevanceScore: 95,
      reason: "Direct evidence.",
    }],
  }, {
    requirementId: "R002",
    matches: [{ support: "unsupported", relevanceScore: 0, reason: "Gap." }],
  }], analysis, russianEvidence);
  const plan = buildResumeSelectionPlan(analysis, matching);
  const resume = {
    summary: "Generated uncited positioning",
    evidenceMap: {} as Record<string, string[]>,
  };

  groundResumeSummary(resume, matching, russianEvidence, plan, "en");

  assert.equal(resume.summary, "Generated uncited positioning");
});

test("repairs a vacancy analysis whose source quote is not verbatim", async () => {
  const calls: string[] = [];
  const result = await runVacancyRelevanceStages({
    vacancy: {
      ...vacancy,
      title: "Head of AI Transformation",
      company: "Firm",
      tracker_language: "en",
    },
    evidenceItems,
    generate: async (stage) => {
      calls.push(stage);
      if (stage === "vacancy-analysis" && calls.length === 1) {
        return {
          ...analysisDraft,
          requirements: [{
            ...analysisDraft.requirements[0],
            sourceText: "A paraphrase that is absent from the trusted description.",
          }],
        } as unknown as Record<string, unknown>;
      }
      if (stage === "vacancy-analysis") return analysisDraft as unknown as Record<string, unknown>;
      return {
        mappings: [
          {
            requirementId: "R001",
            matches: [{
              evidenceId: "E-portfolio0000001",
              support: "direct",
              relevanceScore: 95,
              reason: "Direct portfolio evidence.",
            }],
          },
          {
            requirementId: "R002",
            matches: [{ support: "unsupported", relevanceScore: 0, reason: "Gap." }],
          },
        ],
      };
    },
  });

  assert.deepEqual(calls, ["vacancy-analysis", "vacancy-analysis", "evidence-matching"]);
  assert.equal(result.analysis.requirements[0].sourceText, analysisDraft.requirements[0].sourceText);
});

test("repairs evidence matching that cites an unknown evidence ID", async () => {
  const calls: Array<{ stage: string; prompt: string }> = [];
  const result = await runVacancyRelevanceStages({
    vacancy: {
      ...vacancy,
      title: "Head of AI Transformation",
      company: "Firm",
      tracker_language: "en",
    },
    evidenceItems,
    generate: async (stage, prompt) => {
      calls.push({ stage, prompt });
      if (stage === "vacancy-analysis") return analysisDraft as unknown as Record<string, unknown>;
      if (calls.filter((call) => call.stage === "evidence-matching").length === 1) {
        return {
          mappings: analysisDraft.requirements.map((_, index) => ({
            requirementId: `R00${index + 1}`,
            matches: [{
              evidenceId: "E-invented0000000",
              support: "direct",
              relevanceScore: 100,
              reason: "Invented.",
            }],
          })),
        };
      }
      return {
        mappings: [
          {
            requirementId: "R001",
            matches: [{
              evidenceId: "E-portfolio0000001",
              support: "direct",
              relevanceScore: 95,
              reason: "Direct portfolio evidence.",
            }],
          },
          {
            requirementId: "R002",
            matches: [{ support: "unsupported", relevanceScore: 0, reason: "Gap." }],
          },
        ],
      };
    },
  });

  assert.deepEqual(calls.map(({ stage }) => stage), [
    "vacancy-analysis",
    "evidence-matching",
    "evidence-matching",
  ]);
  assert.match(calls[2].prompt, /unknown evidence ID/);
  assert.equal(result.matching.mappings[0].matches[0].evidenceId, "E-portfolio0000001");
});
