import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { chromium, webkit } from "playwright";

const baseURL = process.env.PREVIEW_TEST_URL || "http://127.0.0.1:3000";
const editorPattern = /\/(?:src\/components\/shared\/rich-editor\/RichEditor\.tsx|assets\/RichEditor-[^/?]+\.js)(?:\?|$)/;
const fixture = JSON.parse(await readFile(new URL("./fixtures/one-page-lists.json", import.meta.url), "utf8"));

async function seed(page) {
  // Seed outside the dashboard, so this direct-entry case has no warm editor.
  await page.goto(baseURL);
  return page.evaluate(fixture => {
    const id = "editor-loading-test";
    const resume = {
      ...fixture, id, title: "编辑器输入检查", templateId: "classic",
      createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
      activeSection: "custom-input",
      menuSections: [...fixture.menuSections, {
        id: "custom-input", title: "输入检查", icon: "FileText", enabled: true, order: 10,
      }],
      customData: { "custom-input": [{
        id: "input-item", title: "检查条目", subtitle: "", dateRange: "", description: "", visible: true,
      }] },
    };
    localStorage.setItem("resume-storage", JSON.stringify({ state: { resumes: { [id]: resume }, activeResumeId: id }, version: 0 }));
    return id;
  }, fixture);
}

for (const [engine, mobile] of [[chromium, false], [chromium, true], [webkit, true]]) {
  test(`${engine.name()} ${mobile ? "mobile" : "desktop"}: cold entry waits for editor and preserves input`, { timeout: 60_000 }, async t => {
    const browser = await engine.launch();
    t.after(() => browser.close());
    const page = await browser.newPage({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
      isMobile: mobile, hasTouch: mobile,
    });
    const id = await seed(page);
    let release, signal;
    const gate = new Promise(resolve => { release = resolve; });
    const requested = new Promise(resolve => { signal = resolve; });
    await page.route(editorPattern, async route => {
      signal();
      await gate;
      await route.continue();
    });
    try {
      await page.goto(`${baseURL}/app/workbench/${id}`, { waitUntil: "domcontentloaded" });
      await requested;
      await page.getByRole("status").filter({ hasText: "正在准备编辑器" }).waitFor();
      assert.equal(await page.locator("#input-item").count(), 0, "do not present unusable editing controls");
    } finally { release(); }
    const heading = page.locator("#input-item h3");
    await heading.click();
    const editor = page.locator('#input-item .tiptap[contenteditable="true"]');
    await editor.click();
    await page.keyboard.insertText("中文详细描述");
    await page.keyboard.type(" input works");
    assert.equal((await editor.innerText()).trim(), "中文详细描述 input works");
    // Wait for the real debounced save, without forcing a persistence flush.
    await page.waitForFunction(id => {
      const resume = JSON.parse(localStorage.getItem(`magic-resume-doc:${id}`) || "null");
      return resume?.customData?.["custom-input"]?.[0]?.description === "<p>中文详细描述 input works</p>";
    }, id);
    await page.reload();
    await heading.click();
    await editor.waitFor();
    assert.equal((await editor.innerText()).trim(), "中文详细描述 input works");
  });
}

test("dashboard starts downloading the editor before navigation", { timeout: 60_000 }, async t => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage();
  const id = await seed(page);
  const downloaded = page.waitForResponse(response => editorPattern.test(response.url()));
  await page.goto(`${baseURL}/app/dashboard/resumes`);
  assert.equal((await downloaded).status(), 200);
  await page.locator(`[data-resume-id="${id}"]`).getByRole("button", { name: "编辑", exact: true }).click();
  await page.locator("#input-item h3").click();
  await page.locator('#input-item .tiptap[contenteditable="true"]').waitFor();
});

test("failed editor download offers reload and recovers", { timeout: 60_000 }, async t => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage();
  const id = await seed(page);
  await page.route(editorPattern, route => route.abort());
  await page.goto(`${baseURL}/app/workbench/${id}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("alert").filter({ hasText: "编辑器加载失败" }).waitFor();
  await page.unroute(editorPattern);
  await page.getByRole("button", { name: "重新加载编辑器", exact: true }).click();
  await page.locator("#input-item h3").click();
  const editor = page.locator('#input-item .tiptap[contenteditable="true"]');
  await editor.fill("重试后可以输入");
  assert.equal(await editor.innerText(), "重试后可以输入");
});
