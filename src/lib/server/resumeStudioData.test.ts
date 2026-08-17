import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyCanonicalEmploymentIdentity,
  buildEvidenceCatalog,
  catalogFromHandoffSnapshot,
  catalogFromJobSeeker,
  employerCoverageErrors,
  resolveResumeStudioPaths,
  resolveTrustedVacancy,
} from "./resumeStudioData";

test("accepts canonical Job Seeker claims whose source hash is optional", () => {
  const base = {
    status: "подтверждено источником",
    source: { path: "career-master:memory", locator: "sqlite:career_facts:1" },
  } as const;
  const catalog = catalogFromJobSeeker({
    catalog_sha256: "c".repeat(64),
    claims: [
      { ...base, id: "E-aaaaaaaaaaaaaaaa", claim: "Canonical memory claim" },
      {
        ...base,
        id: "E-bbbbbbbbbbbbbbbb",
        claim: "Claim with hashed source",
        source: { ...base.source, sha256: "d".repeat(64) },
      },
    ],
  });

  assert.equal(catalog.items.length, 2);
  assert.deepEqual(catalog.sources, [
    { path: "career-master:memory", sha256: "d".repeat(64) },
  ]);
});

test("localizes canonical employer names and fixes every employment period", () => {
  const employers = [
    ["Московская Биржа", "Moscow Exchange", "October 2025 – Present"],
    ["Entangle", "Entangle", "July 2024 – August 2025"],
    ["Газпром нефть — Цифровые Решения", "Gazpromneft", "November 2022 – June 2024"],
    ["Rock'n'Block", "Rock'n'Block", "January 2022 – November 2022"],
    ["SmartHead", "SmartHead", "March 2020 – December 2021"],
  ] as const;
  const evidenceItems = employers.flatMap(([employer], index) => [
    {
      id: `E-name-${index}`,
      claim: `Работодатель: ${employer}`,
      status: "подтверждено источником" as const,
      employer,
      source: { path: "career-master.md", sha256: "a".repeat(64), locator: `line:${index}` },
    },
    {
      id: `E-date-${index}`,
      claim: "Период: generated value",
      status: "подтверждено источником" as const,
      employer,
      source: { path: "career-master.md", sha256: "a".repeat(64), locator: `line:${index}` },
    },
  ]);
  const experience = employers.map(([, company], index) => ({
    company,
    position: "Role",
    date: `generated date ${index}`,
    details: ["Detail"],
  }));
  const evidenceMap = Object.fromEntries(employers.map(([, ,], index) =>
    [`generated date ${index}`, [`E-date-${index}`]],
  ));
  const resume = { experience, evidenceMap };

  applyCanonicalEmploymentIdentity(resume, evidenceItems, "en");

  assert.deepEqual(
    experience.map(({ company, date }) => ({ company, date })),
    employers.map(([, company, date]) => ({ company, date })),
  );
  employers.forEach(([, company, date], index) => {
    assert.deepEqual(evidenceMap[company], [`E-name-${index}`]);
    assert.deepEqual(evidenceMap[date], [`E-date-${index}`]);
  });
});

test("keeps shared role citations while rejecting cross-only employment details", () => {
  const evidenceItems = [
    { id: "E-rock-name", claim: "Работодатель: Rock'n'Block", status: "подтверждено источником", employer: "Rock'n'Block", source: { path: "/career.md", sha256: "a".repeat(64), locator: "line:1" } },
    { id: "E-rock-role", claim: "Официальная должность: Руководитель проектов", status: "подтверждено источником", employer: "Rock'n'Block", source: { path: "/career.md", sha256: "a".repeat(64), locator: "line:2" } },
    { id: "E-smart-role", claim: "Официальная должность: Руководитель проектов", status: "подтверждено источником", employer: "SmartHead", source: { path: "/career.md", sha256: "a".repeat(64), locator: "line:3" } },
    { id: "E-smart-detail", claim: "SmartHead-only delivery fact", status: "подтверждено источником", employer: "SmartHead", source: { path: "/career.md", sha256: "a".repeat(64), locator: "line:4" } },
  ] as const;
  const resume = {
    experience: [{
      company: "Rock'n'Block",
      position: "Руководитель проектов",
      date: "generated",
      details: ["SmartHead-only delivery fact"],
    }],
    evidenceMap: {
      "Rock'n'Block": ["E-rock-name"],
      "Руководитель проектов": ["E-rock-role", "E-smart-role"],
      "SmartHead-only delivery fact": ["E-smart-detail"],
    },
  };

  applyCanonicalEmploymentIdentity(resume, [...evidenceItems], "ru");

  assert.deepEqual(resume.evidenceMap["Руководитель проектов"], ["E-rock-role", "E-smart-role"]);
  assert.deepEqual(resume.experience[0].details, []);
  assert.equal(employerCoverageErrors(resume, [...evidenceItems]).some((error) =>
    error.includes("Руководитель проектов")), false);
});

const workspace = async () => {
  const root = await mkdtemp(join(tmpdir(), "resume-studio-"));
  await mkdir(join(root, "07_market", "raw"), { recursive: true });
  return root;
};

const launch = {
  id: "EU-LI-123",
  source: "linkedin.com",
  language: "en" as const,
  company: "Tracker Co",
  role: "Tracker Role",
  url: "https://tracker.example/123",
};

test("defaults to Job_seeker workspace while preferring explicit path overrides", () => {
  assert.deepEqual(resolveResumeStudioPaths({}), {
    workspaceRoot: "/Users/ryand/dev/Job_seeker",
    careerMasterPath: "/Users/ryand/dev/Job_seeker/01_profile/career-master.md",
  });
  assert.deepEqual(resolveResumeStudioPaths({
    RESUME_STUDIO_WORKSPACE_ROOT: "/custom/workspace",
    RESUME_STUDIO_MASTER_PROFILE: "/custom/career.md",
  }), {
    workspaceRoot: "/custom/workspace",
    careerMasterPath: "/custom/career.md",
  });
});

test("indexes user-confirmed experience appended to the single career master", () => {
  const master = `# Полный мастер профессионального опыта
## Опыт, добавленный через вакансии
### EXP-000001 — Web3 delivery
- Руководил разработкой Web3-продуктов; Работодатель: Rock'n'Block; Проект: Web3 portfolio; Роль: Руководитель проектов; Технологии: Web3, Solidity; Функции: presales, delivery; Команда: backend, QA; Результаты: 30 проектов. \`подтверждено пользователем\``;

  const catalog = buildEvidenceCatalog([{ path: "career-master.md", content: master }]);

  assert.equal(catalog.sources.length, 1);
  assert.match(catalog.prompt, /Web3-продуктов/);
  assert.match(catalog.prompt, /Solidity/);
  assert.match(catalog.prompt, /backend, QA/);
});

test("dynamically indexes dated/latest/raw snapshots and selects the richest newest full description", async () => {
  const root = await workspace();
  await writeFile(join(root, "07_market", "linkedin_2026-08-01.json"), JSON.stringify({
    collected_at: "2026-08-01T10:00:00Z",
    records: [{ linkedin_id: "123", title: "Old role", company: "Old Co", description: "A".repeat(2_000) }],
  }));
  await writeFile(join(root, "07_market", "raw", "linkedin_latest.json"), JSON.stringify({
    collected_at: "2026-08-05T10:00:00Z",
    records: [{
      linkedin_id: "123",
      title: "Trusted role",
      company: "Trusted Co",
      updated_at: "2026-08-02T10:00:00Z",
      full_description: "B".repeat(1_500),
    }],
  }));
  await writeFile(join(root, "07_market", "raw", "unrelated.json"), JSON.stringify({
    records: [{ id: "other", description: "C".repeat(5_000) }],
  }));

  const vacancy = await resolveTrustedVacancy(root, launch);

  assert.equal(vacancy.title, "Trusted role");
  assert.equal(vacancy.company, "Trusted Co");
  assert.equal(vacancy.description.length, 1_500);
  assert.equal(vacancy.description_quality, "full");
  assert.match(vacancy.provenance.path, /07_market\/raw\/linkedin_latest\.json$/);
  assert.equal(vacancy.provenance.collectedAt, "2026-08-05T10:00:00Z");
  assert.match(vacancy.provenance.sha256, /^[a-f0-9]{64}$/);
});

test("does not accept snippets as full descriptions and fails closed for metadata-only matches", async () => {
  const root = await workspace();
  await writeFile(join(root, "07_market", "linkedin_latest.json"), JSON.stringify({
    records: [{
      linkedin_id: "123",
      title: "Role",
      company: "Co",
      snippet: "short search snippet",
      description: "Short metadata-like description.",
    }],
  }));

  await assert.rejects(() => resolveTrustedVacancy(root, launch), /VACANCY_FULL_DESCRIPTION_NOT_FOUND/);
});

test("resolves a fresh AUTO vacancy from the operational SQLite API with verified provenance", async () => {
  const root = await workspace();
  const description = "Trusted operational vacancy description. ".repeat(30);
  const autoLaunch = {
    id: "AUTO-HH-131995174",
    source: "hh",
    language: "ru" as const,
    company: "Tracker Co",
    role: "AI Project Manager",
    url: "https://hh.ru/vacancy/131995174",
  };
  let requested = "";

  const vacancy = await resolveTrustedVacancy(root, autoLaunch, async (input, init) => {
    requested = String(input);
    assert.equal(init?.redirect, "error");
    assert.equal(
      (init?.headers as Record<string, string>).Authorization,
      "Bearer scoped-integration-token",
    );
    return new Response(JSON.stringify({
      id: autoLaunch.id,
      source: "hh",
      role: autoLaunch.role,
      company: autoLaunch.company,
      location: "Saint Petersburg",
      url: autoLaunch.url,
      last_checked_at: "2026-08-07T15:41:28Z",
      description_hash: createHash("sha256").update(description).digest("hex"),
      source_payload: JSON.stringify({
        id: "131995174",
        title: autoLaunch.role,
        company: autoLaunch.company,
        description,
        date_posted: "2026-07-31T09:05:11+03:00",
      }),
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }, "scoped-integration-token");

  assert.equal(requested, "http://127.0.0.1:8765/api/v1/vacancies/AUTO-HH-131995174");
  assert.equal(vacancy.source_id, "131995174");
  assert.equal(vacancy.description, description.trim());
  assert.match(vacancy.provenance.path, /job-seeker\.sqlite3#vacancies\/AUTO-HH-131995174$/);
  assert.match(vacancy.provenance.sha256, /^[a-f0-9]{64}$/);
  assert.equal(vacancy.provenance.collectedAt, "2026-08-07T15:41:28Z");
});

test("rejects operational vacancy content whose stored description hash does not match", async () => {
  const root = await workspace();
  const autoLaunch = {
    id: "AUTO-HH-1",
    source: "hh",
    language: "ru" as const,
    company: "Co",
    role: "Role",
    url: "https://hh.ru/vacancy/1",
  };
  await assert.rejects(
    () => resolveTrustedVacancy(root, autoLaunch, async () => new Response(JSON.stringify({
      id: autoLaunch.id,
      source: "hh",
      role: autoLaunch.role,
      company: autoLaunch.company,
      last_checked_at: "2026-08-07T15:41:28Z",
      description_hash: "0".repeat(64),
      source_payload: JSON.stringify({ id: "1", description: "A".repeat(900) }),
    }), { status: 200 })),
    /OPERATIONAL_VACANCY_HASH_MISMATCH/,
  );
});

test("fails closed when a full description has no dated provenance", async () => {
  const root = await workspace();
  await writeFile(join(root, "07_market", "linkedin_latest.json"), JSON.stringify({
    records: [{
      linkedin_id: "123",
      title: "Undated role",
      company: "Co",
      datePosted: "2026-07-01",
      description: "A".repeat(900),
    }],
  }));

  await assert.rejects(() => resolveTrustedVacancy(root, launch), /VACANCY_PROVENANCE_DATE_MISSING/);
});

test('builds a typed evidence catalog from source documents with stable IDs and provenance', () => {
  const career = `# Profile\n- Portfolio of 60+ initiatives. \`подтверждено источником\`\n- User-confirmed SQL. \`подтверждено пользователем\`\n- Five models in production. \`требует подтверждения\`\n## Не позиционировать без новых доказательств\n- ML Engineering Lead. \`подтверждено источником\`\n## Safe again\n- Led delivery. \`подтверждено источником\``;
  const ledger = `| Утверждение | Статус | Источник / что требуется |\n|---|---|---|\n| AI portfolio governance | Подтверждено источником | resume v17 |\n| Adoption metrics | Нужно собрать | report |\n| Python with assistant | Подтверждено пользователем | работодатель: Example Bank; навык: Python; user 2026-07-29 |`;

  const first = buildEvidenceCatalog([
    { path: "/workspace/01_profile/career-master.md", content: career },
    { path: "/workspace/01_profile/evidence-ledger.md", content: ledger },
  ]);
  const second = buildEvidenceCatalog([
    { path: "/workspace/01_profile/career-master.md", content: career },
    { path: "/workspace/01_profile/evidence-ledger.md", content: ledger },
  ]);

  assert.deepEqual(first, second);
  assert.equal(first.items.length, 5);
  assert.deepEqual(new Set(first.items.map((item) => item.status)), new Set([
    "подтверждено источником",
    "подтверждено пользователем",
  ]));
  assert.ok(first.items.every((item) => /^E-[a-f0-9]{16}$/.test(item.id)));
  assert.ok(first.items.every((item) =>
    /^[a-f0-9]{64}$/.test(item.source.sha256 ?? "")));
  assert.match(first.prompt, /60\+ initiatives|User-confirmed SQL|Led delivery|AI portfolio governance|Python with assistant/);
  assert.doesNotMatch(first.prompt, /Five models|ML Engineering Lead|Adoption metrics/);
  assert.equal(
    first.items.find((item) => item.claim === "Python with assistant")?.employer,
    "Example Bank",
  );
  assert.match(first.prompt, /\[Работодатель: Example Bank\].*Python with assistant/);
  assert.match(first.catalogSha256, /^[a-f0-9]{64}$/);
});

test("preserves employer ownership and canonical company, title and period facts", () => {
  const career = `# Карьерная хронология
## Московская Биржа
- Период: октябрь 2025 — настоящее время.
- Официальная должность: Руководитель портфеля AI-проектов.
- Сформировал портфель из 60+ инициатив. \`подтверждено источником\`
## Entangle
- Период: июль 2024 — август 2025.
- Официальная должность: Руководитель AI-направления.
- Сформировал AI-направление из 10 специалистов. \`подтверждено источником\``;

  const catalog = buildEvidenceCatalog([{ path: "career-master.md", content: career }]);
  const moex = catalog.items.filter((item) => item.employer === "Московская Биржа");
  const entangle = catalog.items.filter((item) => item.employer === "Entangle");

  assert.match(moex.map((item) => item.claim).join("\n"), /Работодатель: Московская Биржа|Период: октябрь 2025|Официальная должность: Руководитель портфеля|60\+/);
  assert.match(entangle.map((item) => item.claim).join("\n"), /Работодатель: Entangle|Период: июль 2024|Официальная должность: Руководитель AI-направления|10 специалистов/);
  assert.match(catalog.prompt, /\[Работодатель: Московская Биржа\]/);
  assert.match(catalog.prompt, /\[Работодатель: Entangle\]/);
});

test("accepts a focused CV when one employer carries all selected evidence", () => {
  const catalog = buildEvidenceCatalog([{ path: "career-master.md", content: `# Карьерная хронология
## Московская Биржа
- Период: октябрь 2025 — настоящее время.
- Официальная должность: Руководитель портфеля AI-проектов.
- Управлял AI-портфелем. \`подтверждено источником\`
## Entangle
- Период: июль 2024 — август 2025.
- Официальная должность: Руководитель AI-направления.
- Сформировал AI-команду. \`подтверждено источником\`
## Газпром нефть — Цифровые Решения
- Период: ноябрь 2022 — июнь 2024.
- Официальная должность: Старший руководитель проектов.
- Внедрял корпоративные IT-системы. \`подтверждено источником\`` }]);
  const moex = catalog.items.filter((item) => item.employer === "Московская Биржа");
  const byClaim = (pattern: RegExp) => moex.find((item) => pattern.test(item.claim))!.id;
  const resume = {
    experience: [{
      company: "Московская Биржа",
      position: "Руководитель портфеля AI-проектов",
      date: "октябрь 2025 — настоящее время",
      details: ["Управлял AI-портфелем"],
    }],
    evidenceMap: {
      "Московская Биржа": [byClaim(/Работодатель/)],
      "Руководитель портфеля AI-проектов": [byClaim(/Официальная должность/)],
      "октябрь 2025 — настоящее время": [byClaim(/Период/)],
      "Управлял AI-портфелем": [byClaim(/Управлял/)],
    },
  };

  assert.deepEqual(employerCoverageErrors(resume, catalog.items), []);
});

test("excludes all claims under explicit forbidden headings and plain structural sections", () => {
  const catalog = buildEvidenceCatalog([{ path: "career-master.md", content: `# Safe\n- Allowed. \`подтверждено источником\`\nНе позиционировать без новых доказательств:\n- Forbidden plain. \`подтверждено источником\`\n## Safe again\n- Allowed again. \`подтверждено пользователем\`\n# Claims, которые нельзя усиливать без подтверждения\n- Forbidden heading. \`подтверждено источником\`\n## Nested\n- Forbidden nested. \`подтверждено пользователем\`` }]);

  assert.match(catalog.prompt, /Allowed\./);
  assert.match(catalog.prompt, /Allowed again/);
  assert.doesNotMatch(catalog.prompt, /Forbidden/);
});

test("uses the frozen Job Seeker catalog instead of re-parsing markdown", () => {
  const content = `# Карьерная хронология
## Example Bank
- Период: 2024 — 2025.
- Led delivery. \`подтверждено источником\``;
  const careerSha = createHash("sha256").update(content).digest("hex");
  const frozen = [
    {
      id: "E-aaaaaaaaaaaaaaaa",
      claim: "SQLite-only claim that markdown parser would miss",
      status: "подтверждено источником" as const,
      employer: "Example Bank",
      source: { path: "career-master.md", locator: "sqlite:evidence_items:1" },
    },
  ];
  const catalog = catalogFromHandoffSnapshot({
    career_sha256: careerSha,
    catalog_sha256: "b".repeat(64),
    evidence_refs: ["E-aaaaaaaaaaaaaaaa"],
    evidence_catalog: frozen,
    career_document: { path: "career-master.md", content },
  });

  assert.equal(catalog.items.length, 1);
  assert.equal(catalog.items[0]?.claim, "SQLite-only claim that markdown parser would miss");
  assert.equal(catalog.catalogSha256, "b".repeat(64));
  assert.equal(catalog.sources[0]?.sha256, careerSha);
  assert.match(catalog.prompt, /SQLite-only claim/);
  assert.notEqual(
    buildEvidenceCatalog([{ path: "career-master.md", content }]).catalogSha256,
    catalog.catalogSha256,
  );
});

test("rejects a handoff whose career document hash or evidence refs do not match", () => {
  const content = "career";
  const careerSha = createHash("sha256").update(content).digest("hex");
  const frozen = [{
    id: "E-bbbbbbbbbbbbbbbb",
    claim: "Visible",
    status: "подтверждено источником" as const,
    source: { path: "career-master.md", locator: "line:1" },
  }];

  assert.throws(
    () => catalogFromHandoffSnapshot({
      career_sha256: "0".repeat(64),
      catalog_sha256: "c".repeat(64),
      evidence_refs: ["E-bbbbbbbbbbbbbbbb"],
      evidence_catalog: frozen,
      career_document: { path: "career-master.md", content },
    }),
    /RESUME_HANDOFF_CATALOG_MISMATCH/,
  );
  assert.throws(
    () => catalogFromHandoffSnapshot({
      career_sha256: careerSha,
      catalog_sha256: "c".repeat(64),
      evidence_refs: ["E-cccccccccccccccc"],
      evidence_catalog: frozen,
      career_document: { path: "career-master.md", content },
    }),
    /RESUME_HANDOFF_CATALOG_MISMATCH/,
  );
});
