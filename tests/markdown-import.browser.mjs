import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseURL = process.env.PREVIEW_TEST_URL || "http://127.0.0.1:3000";
const source = "  # 原文姓名\r\n\r\n## 我的经历\r\n- 2025 年开发项目\r\n![头像](https://example.invalid/photo.png)\r\n";
const extracted = {
  basic: { name: "模型识别姓名", email: "resume@example.com", customFields: [{ label: "个人网站", value: "https://example.com" }] },
  experience: [{ company: "示例公司", position: "工程师", details: ["服务 1000+ 用户"] }],
  skills: ["TypeScript"], selfEvaluation: ["擅长跨团队合作"],
  customSections: [{ title: "获奖情况", items: [{ title: "一等奖", description: ['<img src=x onerror="alert(1)">'] }] }],
};

async function setup(page) {
  await page.goto(`${baseURL}/app/dashboard/resumes`);
  await page.getByRole("heading", { name: "我的简历", exact: true }).waitFor();
  return page.evaluate(async () => {
    const { useAIConfigStore } = await import("/src/store/useAIConfigStore.ts");
    useAIConfigStore.setState({ models: [{ id: "markdown-model", provider: "qwen", protocol: "chat-completions", model: "fixture-text", name: "Markdown fixture", apiKey: "test-key", baseUrl: "https://example.com/v1", supportsPdf: false }], textModelId: "markdown-model", pdfModelId: null });
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    const id = useResumeStore.getState().createResume(null);
    const resume = useResumeStore.getState().resumes[id];
    useResumeStore.getState().updateResume(id, { basic: { ...resume.basic, name: "EXISTING_RESUME_PRIVATE_MARKER" } });
    return id;
  });
}

async function openMarkdown(page) {
  await page.getByRole("button", { name: "导入简历", exact: true }).click();
  await page.getByRole("button", { name: /导入 Markdown/ }).click();
  await page.getByLabel("Markdown 正文", { exact: true }).waitFor();
}

const count = page => page.evaluate(async () => Object.keys((await import("/src/store/useResumeStore.ts")).useResumeStore.getState().resumes).length);

test("Markdown upload is model-only; review/back/confirm preserves existing resumes", { timeout: 60_000 }, async t => {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const existingId = await setup(page);
  const requests = [];
  await page.route("**/api/resume-import", async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ json: { resume: extracted, warnings: [] } });
  });
  await openMarkdown(page);
  await page.locator('input[accept*=".markdown"]').setInputFiles({ name: "my-resume.md", mimeType: "text/markdown", buffer: Buffer.from(source) });
  const text = page.getByLabel("Markdown 正文", { exact: true });
  await page.waitForFunction(() => document.getElementById("markdown-resume-text").value.includes("原文姓名"));
  await page.getByRole("button", { name: "导入", exact: true }).click();
  await page.getByRole("heading", { name: "确认识别结果", exact: true }).waitFor();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].markdown, source);
  assert.equal(requests[0].format, "markdown");
  assert.equal(requests[0].model, "fixture-text");
  assert.ok(!JSON.stringify(requests[0]).includes("EXISTING_RESUME_PRIVATE_MARKER"));
  const review = page.getByRole("dialog");
  assert.ok((await review.innerText()).includes("模型识别姓名"));
  assert.ok((await review.innerText()).includes("擅长跨团队合作"));
  assert.ok((await review.innerText()).includes("<img src=x"));
  assert.equal(await review.locator("img").count(), 0, "model content is rendered as text");
  assert.equal(await count(page), 1, "preview must not save a resume");
  await page.getByRole("button", { name: "返回修改正文", exact: true }).click();
  assert.equal(await text.inputValue(), source.replace(/\r\n/g, "\n"), "the textarea retains the source on back");
  assert.equal(await count(page), 1);
  await page.getByRole("button", { name: "导入", exact: true }).click();
  await page.getByRole("heading", { name: "确认识别结果", exact: true }).waitFor();
  await page.getByRole("button", { name: "创建简历", exact: true }).click();
  await page.waitForURL("**/app/workbench/*");
  assert.equal(await count(page), 2);
  const state = await page.evaluate(async existingId => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    const s = useResumeStore.getState();
    return { current: s.activeResume, originalName: s.resumes[existingId].basic.name };
  }, existingId);
  assert.equal(state.originalName, "EXISTING_RESUME_PRIVATE_MARKER");
  assert.equal(state.current.basic.name, extracted.basic.name);
  assert.ok(state.current.selfEvaluationContent.includes("跨团队合作"));
  assert.ok(Object.values(state.current.customData)[0][0].description.includes("&lt;img"));
});

test("cancelled parsing cannot create a late preview or discard the Markdown draft", { timeout: 45_000 }, async t => {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await setup(page);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let calls = 0;
  await page.route("**/api/resume-import", async route => {
    calls++;
    await gate;
    await route.fulfill({ json: { resume: extracted, warnings: [] } }).catch(() => {});
  });
  try {
    await openMarkdown(page);
    await page.getByLabel("Markdown 正文", { exact: true }).fill(source);
    await page.getByRole("button", { name: "导入", exact: true }).click();
    await page.getByRole("button", { name: "取消解析", exact: true }).click();
    release();
    await openMarkdown(page);
    assert.equal(await page.getByLabel("Markdown 正文", { exact: true }).inputValue(), source.replace(/\r\n/g, "\n"));
    await page.waitForTimeout(200);
    assert.equal(await page.getByRole("heading", { name: "确认识别结果", exact: true }).count(), 0);
    assert.equal(await count(page), 1);
    assert.equal(calls, 1);
    const box = await page.getByRole("dialog").boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 391 && box.y >= 0 && box.y + box.height <= 845, "the mobile dialog stays within the viewport");
  } finally { release(); }
});

test("model failure keeps the draft and permits explicit retry", { timeout: 30_000 }, async t => {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage(); await setup(page);
  let calls = 0;
  await page.route("**/api/resume-import", async route => {
    calls++;
    await route.fulfill(calls === 1 ? { status: 502, json: { code: "invalidOutput" } } : { json: { resume: extracted, warnings: [] } });
  });
  await openMarkdown(page);
  await page.getByLabel("Markdown 正文", { exact: true }).fill(source);
  await page.getByRole("button", { name: "导入", exact: true }).click();
  await page.getByRole("alert").waitFor();
  assert.equal(await count(page), 1);
  assert.equal(calls, 1, "do not run any extraction fallback");
  await page.getByRole("button", { name: "导入", exact: true }).click();
  await page.getByRole("heading", { name: "确认识别结果", exact: true }).waitFor();
  assert.equal(calls, 2);
  assert.equal(await count(page), 1);
});

test("PDF import still renders pages and uses the shared confirmation flow", { timeout: 45_000 }, async t => {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage(); await setup(page);
  await page.evaluate(async () => {
    const { useAIConfigStore } = await import("/src/store/useAIConfigStore.ts");
    const { BUILTIN_AI_MODELS } = await import("/src/config/ai-models.ts");
    const selected = BUILTIN_AI_MODELS.qwen.find(model => model.supportsPdf);
    const store = useAIConfigStore.getState();
    useAIConfigStore.setState({ models: [...store.models, { ...store.models[0], id: "pdf-model", model: selected.id, supportsPdf: true }], pdfModelId: "pdf-model" });
  });
  let payload;
  await page.route("**/api/resume-import", async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { resume: extracted, warnings: [] } });
  });
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF(); pdf.text("Resume fixture", 10, 20);
  await page.getByRole("button", { name: "导入简历", exact: true }).click();
  await page.locator('input[accept=".pdf,application/pdf"]').setInputFiles({ name: "resume.pdf", mimeType: "application/pdf", buffer: Buffer.from(pdf.output("arraybuffer")) });
  await page.getByRole("heading", { name: "确认识别结果", exact: true }).waitFor();
  assert.equal(payload.images.length, 1);
  assert.ok(payload.images[0].startsWith("data:image/jpeg;base64,"));
  assert.equal(payload.markdown, undefined);
  assert.equal(await count(page), 1);
  await page.getByRole("button", { name: "创建简历", exact: true }).click();
  await page.waitForURL("**/app/workbench/*");
  assert.equal(await count(page), 2);
});
