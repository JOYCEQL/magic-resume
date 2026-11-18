import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseURL = process.env.PREVIEW_TEST_URL || "http://127.0.0.1:3000";

test("ordered lists can continue across paragraphs without changing other lists", { timeout: 60_000 }, async t => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(`${baseURL}/app/dashboard`);
  const id = await page.evaluate(async () => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    const id = useResumeStore.getState().createResume("classic");
    useResumeStore.getState().updateResume(id, {
      activeSection: "skills", skillContent: "<ol><li><p>第一项</p></li></ol>",
    });
    return id;
  });
  await page.goto(`${baseURL}/app/workbench/${id}`);
  const editor = page.locator('.tiptap[contenteditable="true"]:visible').first();
  await editor.waitFor();
  const options = page.getByRole("button", { name: "有序列表编号选项" });
  async function cursor(text) {
    await editor.getByText(text, { exact: true }).evaluate(el => {
      el.closest("[contenteditable]").focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    });
  }
  async function choose(label) {
    await options.click();
    await page.getByRole("menuitem", { name: label, exact: true }).click();
  }
  async function fixture(html) {
    await page.evaluate(async ({ id, html }) => {
      const { useResumeStore } = await import("/src/store/useResumeStore.ts");
      useResumeStore.getState().updateResume(id, { skillContent: html });
    }, { id, html });
  }

  // The report's exact sequence: leave the list, add prose, start another list.
  await cursor("第一项");
  await editor.press("Enter");
  await editor.press("Enter");
  await page.keyboard.insertText("第一项的无编号补充说明");
  await editor.press("Enter");
  await page.locator("button").filter({ has: page.locator("svg.lucide-list-ordered") }).first().click();
  await page.keyboard.insertText("第二项");
  await choose("继续上次编号");
  assert.deepEqual(await editor.locator("ol").evaluateAll(els => els.map(el => el.start)), [1, 2]);
  assert.equal(await editor.locator(":scope > p").first().innerText(), "第一项的无编号补充说明");
  await editor.press("ControlOrMeta+z");
  assert.equal(await editor.locator("ol").nth(1).getAttribute("start"), null);
  await editor.press("ControlOrMeta+Shift+z");
  assert.equal(await editor.locator("ol").nth(1).getAttribute("start"), "2");
  await choose("重新从 1 开始");
  assert.equal(await editor.locator("ol").nth(1).getAttribute("start"), null);
  await choose("继续上次编号");

  // Persisted HTML, preview, and the actual PDF request must retain start=2.
  await page.reload();
  await editor.waitFor();
  assert.equal(await editor.locator("ol").nth(1).getAttribute("start"), "2");
  assert.equal(await page.locator('#resume-preview ol[start="2"]').count(), 1);
  const pdfPage = await browser.newPage();
  let pdfBytes;
  await page.route("**/generate-pdf", async route => {
    const payload = route.request().postDataJSON();
    assert.match(payload.content, /<ol start="2"/);
    await pdfPage.setContent(`<html><head><style>${payload.styles}</style></head><body>${payload.content}</body></html>`);
    await pdfPage.evaluate(() => document.fonts.ready);
    pdfBytes = await pdfPage.pdf({ width: "8.2677in", height: "11.6929in", printBackground: true });
    await route.fulfill({ contentType: "application/pdf", body: pdfBytes });
  });
  const download = page.waitForEvent("download");
  await page.evaluate(async () => {
    const { exportToPdf } = await import("/src/utils/export.ts");
    await exportToPdf({ elementId: "resume-preview", title: "list-numbering", pagePadding: 32 });
  });
  await download;
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await getDocument({ data: new Uint8Array(pdfBytes) }).promise;
  try {
    let text = "";
    for (let n = 1; n <= pdf.numPages; n++) {
      text += (await (await pdf.getPage(n)).getTextContent()).items.map(item => item.str).join("");
    }
    // Absolutely positioned markers can be emitted after their item text.
    assert.match(text.replace(/\s/g, ""), /2\.第二项|第二项2\./);
  } finally { await pdf.destroy(); }

  // Count direct items, respect a custom start, and use the nearest sibling list.
  await fixture('<ol start="4"><li><p>四</p><ol start="20"><li><p>嵌套</p></li></ol></li><li><p>五</p></li></ol><p>说明</p><ol><li><p>六</p></li></ol><p>更多说明</p><ol><li><p>七</p></li></ol>');
  await cursor("六");
  await choose("继续上次编号");
  await cursor("七");
  await choose("继续上次编号");
  assert.deepEqual(await editor.locator(":scope > ol").evaluateAll(els => els.map(el => el.start)), [4, 6, 7]);
  assert.equal(await editor.locator("ol ol").getAttribute("start"), "20");
  await cursor("嵌套");
  await options.click();
  assert.equal(await page.getByRole("menuitem", { name: "继续上次编号", exact: true }).getAttribute("aria-disabled"), "true");
  await page.keyboard.press("Escape");
  await cursor("四");
  await options.click();
  assert.equal(await page.getByRole("menuitem", { name: "继续上次编号", exact: true }).getAttribute("aria-disabled"), "true");
  await page.keyboard.press("Escape");

  // A soft line break remains inside the first item; Enter creates item two.
  await fixture("<ol><li><p>起始项</p></li></ol>");
  await cursor("起始项");
  await editor.press("Shift+Enter");
  await page.keyboard.insertText("补充说明");
  await editor.press("Enter");
  await page.keyboard.insertText("下一项");
  assert.equal(await editor.locator("ol").count(), 1);
  assert.equal(await editor.locator("ol > li").count(), 2);
  assert.equal(await editor.locator("ol > li").first().locator("br").count(), 1);

  await page.setViewportSize({ width: 375, height: 900 });
  await options.click();
  const menu = await page.getByRole("menu").boundingBox();
  assert.ok(menu.x >= 0 && menu.x + menu.width <= 375, "numbering menu fits on mobile");
});
