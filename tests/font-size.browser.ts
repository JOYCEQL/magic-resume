import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { initialResumeState } from "../src/config/initialResumeData";

// 具体运行方式见 tests/README.md；每次使用隔离浏览器上下文和测试数据。
const artifacts = "node_modules/.cache/font-size";
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const origin = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const html = '<p>正文<strong><span style="color: #ff0000"><a href="https://example.com">目标文字</a></span></strong>保持默认</p><ul><li><p>第一项</p></li><li><p>第二项</p></li></ul>';
const resume = { ...initialResumeState, id: "font-size-test", templateId: "classic", activeSection: "skills", skillContent: html };
const editor = page.locator('.tiptap[contenteditable="true"]:visible').first();
const control = page.getByRole("combobox", { name: /^(正文字号|Body font size)$/ }).first();
const shortcut = process.platform === "darwin" ? "Meta" : "Control";

async function selectText(text: string) {
  await editor.evaluate((element, target) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const index = node.textContent?.indexOf(target) ?? -1;
      if (index < 0) continue;
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + target.length);
      element.focus();
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
      return;
    }
    throw new Error(`Text not found: ${target}`);
  }, text);
  await page.waitForFunction(() => {
    const trigger = Array.from(document.querySelectorAll('[aria-label="正文字号"], [aria-label="Body font size"]'))
      .find((element) => element.getClientRects().length > 0);
    return trigger && !trigger.hasAttribute("disabled");
  });
}

async function size(value: string) {
  await control.click();
  await page.getByRole("option", { name: value, exact: true }).click();
}

async function storedHtml() {
  return page.evaluate(() => JSON.parse(localStorage.getItem("resume-storage") || "{}").state.resumes["font-size-test"].skillContent as string);
}

async function updateFixture(changes: Record<string, unknown>) {
  await page.evaluate((patch) => {
    const saved = JSON.parse(localStorage.getItem("resume-storage") || "{}");
    Object.assign(saved.state.resumes["font-size-test"], patch);
    localStorage.setItem("resume-storage", JSON.stringify(saved));
  }, changes);
  await page.reload();
}

try {
  await page.goto(origin);
  await page.evaluate((data) => localStorage.setItem("resume-storage", JSON.stringify({ state: { resumes: { [data.id]: data }, activeResumeId: data.id }, version: 0 })), resume);
  await page.goto(`${origin}/app/workbench/${resume.id}`);
  await editor.waitFor();
  assert.equal(await control.isDisabled(), true);
  const bounds = await editor.locator("strong").boundingBox();
  assert.ok(bounds);
  await page.mouse.move(bounds.x + 1, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width - 1, bounds.y + bounds.height / 2, { steps: 12 });
  await page.mouse.up();
  await page.waitForFunction(() => !document.querySelector('[aria-label="正文字号"]')?.hasAttribute("disabled"));
  assert.equal((await control.innerText()).trim(), "默认");
  await size("20px");
  assert.match(await storedHtml(), /font-size: 20px/);
  assert.equal(await editor.locator('span[style*="font-size"]').innerText(), "目标文字");
  assert.equal(await editor.locator("strong").innerText(), "目标文字");
  assert.equal(await editor.locator('a[href="https://example.com"]').innerText(), "目标文字");
  assert.match(await storedHtml(), /color:/);
  await editor.press(`${shortcut}+z`);
  assert.doesNotMatch(await storedHtml(), /font-size/);
  await editor.press(`${shortcut}+Shift+z`);
  assert.match(await storedHtml(), /font-size: 20px/);
  await editor.press(`${shortcut}+a`);
  await page.waitForFunction(() => document.querySelector('[aria-label="正文字号"]')?.textContent?.includes("混合"));
  await size("24px");
  assert.equal(await editor.locator("li span[style*='24px']").count(), 2);
  await size("恢复默认");
  assert.doesNotMatch(await storedHtml(), /font-size/);
  await selectText("目标文字");
  await size("20px");
  await page.reload();
  await editor.waitFor();
  assert.equal(await editor.locator('span[style*="20px"]').innerText(), "目标文字");
  const preview = page.locator('#resume-preview span[style*="20px"]').first();
  await preview.waitFor();
  assert.equal(await preview.evaluate((el) => getComputedStyle(el).fontSize), "20px");
  const sectionHeading = page.locator("#resume-preview h3").filter({ hasText: "专业技能" });
  const headingSize = await sectionHeading.evaluate((el) => getComputedStyle(el).fontSize);
  await updateFixture({ globalSettings: { ...resume.globalSettings, baseFontSize: 24 } });
  await preview.waitFor();
  assert.equal(await preview.evaluate((el) => getComputedStyle(el).fontSize), "20px");
  assert.equal(await page.locator("#resume-preview li p").first().evaluate((el) => getComputedStyle(el).fontSize), "24px");
  assert.equal(await sectionHeading.evaluate((el) => getComputedStyle(el).fontSize), headingSize);
  await selectText("目标文字");
  await size("恢复默认");
  assert.equal(await page.locator('#resume-preview a[href="https://example.com"]').first().evaluate((el) => getComputedStyle(el).fontSize), "24px");
  assert.equal(await sectionHeading.evaluate((el) => getComputedStyle(el).fontSize), headingSize);
  await size("20px");
  await page.context().addCookies([{ name: "NEXT_LOCALE", value: "en", url: origin }]);
  await page.reload();
  await editor.waitFor();
  await selectText("目标文字");
  assert.equal(await control.getAttribute("aria-label"), "Body font size");
  await size("Reset to default");
  assert.equal((await control.innerText()).trim(), "Default");
  await size("20px");
  await editor.press(`${shortcut}+a`);
  await page.waitForFunction(() => document.querySelector('[aria-label="Body font size"]')?.textContent?.includes("Mixed"));
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await editor.waitFor();
    await selectText("目标文字");
    await size("24px");
    const box = await control.boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= width, `Toolbar overflow at ${width}px`);
    await page.screenshot({ path: `${artifacts}/mobile-${width}.png`, fullPage: true });
    await size("20px");
  }
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.context().addCookies([{ name: "NEXT_LOCALE", value: "zh", url: origin }]);
  await updateFixture({ globalSettings: resume.globalSettings });
  await editor.waitFor();
  await selectText("目标文字");
  await page.screenshot({ path: `${artifacts}/selection.png`, fullPage: true });
  console.log("PASS: base/local size precedence, reset inheritance, unchanged headings, English labels, 375px/320px toolbars");
  for (const templateId of ["classic", "modern", "left-right", "timeline", "minimalist", "elegant", "creative", "editorial", "swiss"]) {
    await updateFixture({ templateId });
    await preview.waitFor();
    assert.equal(await preview.evaluate((el) => getComputedStyle(el).fontSize), "20px", templateId);
    assert.equal(await page.locator('#resume-preview span[style*="20px"]').count(), 1, templateId);
  }
  const formatted = await storedHtml();
  await updateFixture({
    templateId: "classic",
    selfEvaluationContent: formatted,
    education: resume.education.map((item) => ({ ...item, description: formatted })),
    experience: resume.experience.map((item) => ({ ...item, details: formatted })),
    projects: resume.projects.map((item) => ({ ...item, description: formatted })),
    customData: { "custom-test": [{ id: "custom-item", title: "自定义验证", subtitle: "", dateRange: "", description: formatted, visible: true }] },
    menuSections: [...resume.menuSections,
      { id: "selfEvaluation", title: "自我评价", icon: "", enabled: true, order: 5 },
      { id: "custom-test", title: "自定义验证模块", icon: "", enabled: true, order: 6 }],
  });
  for (const [activeSection, title] of [
    ["skills", ""], ["selfEvaluation", ""],
    ["education", resume.education[0].school],
    ["experience", resume.experience[0].company],
    ["projects", resume.projects[0].name], ["custom-test", "自定义验证"],
  ]) {
    console.log(`Checking body editor: ${activeSection}`);
    await updateFixture({ activeSection });
    if (title) await page.getByText(title, { exact: true }).first().click();
    await editor.waitFor();
    await selectText("目标文字");
    assert.equal((await control.innerText()).trim(), "20px", activeSection);
    await size("18px");
    assert.equal(await editor.locator('span[style*="18px"]').innerText(), "目标文字", activeSection);
  }
  await updateFixture({ activeSection: "skills" });
  await editor.waitFor();
  const jsonDownload = page.waitForEvent("download");
  await page.evaluate(async () => {
    const modulePath = "/src/utils/export.ts";
    const { exportResumeAsJson } = await import(modulePath);
    const saved = JSON.parse(localStorage.getItem("resume-storage") || "{}");
    exportResumeAsJson({ resume: saved.state.resumes["font-size-test"] });
  });
  const jsonFile = await (await jsonDownload).path();
  assert.ok(jsonFile);
  const imported = JSON.parse(await readFile(jsonFile, "utf8"));
  assert.match(imported.skillContent, /font-size: 18px/);
  await page.evaluate(async (data) => {
    const modulePath = "/src/store/useResumeStore.ts";
    const { useResumeStore } = await import(modulePath);
    const id = useResumeStore.getState().addResume(data);
    if (useResumeStore.getState().resumes[id].skillContent !== data.skillContent) throw new Error("JSON import lost formatting");
  }, imported);
  await updateFixture({
    globalSettings: { ...resume.globalSettings, autoOnePage: true },
    skillContent: formatted + '<p><span style="font-size: 24px">长正文换行与分页验证</span></p>'.repeat(18),
  });
  await preview.waitFor();
  await page.evaluate(() => document.fonts.ready);
  const pdfDownload = page.waitForEvent("download", { timeout: 60000 });
  await page.evaluate(async () => {
    const modulePath = "/src/utils/export.ts";
    const { exportToLongPagePdf } = await import(modulePath);
    await exportToLongPagePdf({ elementId: "resume-preview", title: "font-size-test", pagePadding: 32 });
  });
  const pdfFile = await (await pdfDownload).path();
  assert.ok(pdfFile);
  assert.equal((await readFile(pdfFile)).subarray(0, 4).toString(), "%PDF");
  await page.evaluate(async () => {
    const modulePath = "/src/utils/print.ts";
    const { exportResumeToBrowserPrint } = await import(modulePath);
    const observer = new MutationObserver(() => {
      const frame = document.querySelector('iframe[style*="-9999px"]') as HTMLIFrameElement | null;
      if (frame?.contentWindow) {
        frame.contentWindow.print = () => {
          document.body.dataset.printHtml = frame.contentDocument?.body.innerHTML;
        };
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true });
    await exportResumeToBrowserPrint(document.getElementById("resume-preview"), 32);
  });
  await page.waitForFunction(() => document.body.dataset.printHtml?.includes("font-size: 24px"));
  console.log("PASS: JSON export/import, long-page PDF download, print markup, auto-one-page long content");
  await page.screenshot({ path: `${artifacts}/long-content.png`, fullPage: true });
  console.log("PASS: mouse selection, mixed/default, marks, lists, undo/redo, persistence, nine templates, six body editors");
} catch (error) {
  await page.screenshot({ path: `${artifacts}/failure.png`, fullPage: true });
  throw error;
} finally {
  await browser.close();
}
