import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

// Start `pnpm dev` first. All fixture data stays in an isolated browser context.
// Override PREVIEW_TEST_URL when the Vite development server uses another port.
const baseURL = process.env.PREVIEW_TEST_URL || "http://127.0.0.1:3000";

test("one-page preview settles and responds to subsequent layout changes", {
  timeout: 90_000,
}, async (t) => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`${baseURL}/app/dashboard`);
  const id = await page.evaluate(async () => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    return useResumeStore.getState().createResume(null);
  });
  await page.goto(`${baseURL}/app/workbench/${id}`);
  await page.waitForSelector("#resume-preview");
  await page.evaluate(() => document.fonts.ready);

  const configure = async ({ count = 68, enabled = true, fontSize = 16, padding = 32 } = {}) => {
    await page.evaluate(async ({ count, enabled, fontSize, padding }) => {
      const { useResumeStore } = await import("/src/store/useResumeStore.ts");
      const store = useResumeStore.getState();
      store.updateResume(store.activeResumeId, {
        menuSections: store.activeResume.menuSections.filter(
          (section) => ["basic", "skills"].includes(section.id),
        ),
        skillContent: `<p>${"负责前端应用开发维护与性能优化，参与技术方案设计。".repeat(count)}</p>`,
        globalSettings: {
          ...store.activeResume.globalSettings,
          autoOnePage: enabled,
          pageBreakLinesVisible: true,
          baseFontSize: fontSize,
          pagePadding: padding,
        },
      });
    }, { count, enabled, fontSize, padding });
    await page.waitForTimeout(600);
  };

  const readLayout = () => page.locator("#resume-preview").evaluate((element) => ({
    height: element.clientHeight,
    width: element.clientWidth,
    scale: Number(element.style.transform.match(/scale\(([\d.]+)\)/)?.[1] || 1),
    padding: parseFloat(getComputedStyle(element).paddingTop),
    breaks: element.querySelectorAll(".page-break-line").length,
  }));

  const assertSettled = async () => {
    const first = await readLayout();
    const expectedScale = Math.min(1, Math.max(0.9,
      (297 * 3.78 - 2 * first.padding) / (first.height - 2 * first.padding),
    ));
    assert.ok(Math.abs(first.scale - expectedScale) < 0.00001,
      "scale should reflect the latest unscaled content height");
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(100);
      assert.deepEqual(await readLayout(), first, "idle preview must not oscillate");
    }
    return first;
  };

  // These two fixtures previously alternated between different wrapped heights;
  // the second also flipped between scaled and unscaled modes.
  for (const count of [68, 72]) {
    await t.test(`near-page text (${count} repetitions) keeps its layout when scaled`, async () => {
      await configure({ count, enabled: false });
      const before = await readLayout();
      assert.ok(before.height > 297 * 3.78);
      await configure({ count });
      const after = await assertSettled();
      assert.equal(after.height, before.height);
      assert.equal(after.width, before.width);
      assert.ok(after.scale < 1 && after.scale > 0.9);
      assert.equal(after.breaks, 0);
    });
  }

  await t.test("content edits, font size and padding trigger fresh measurements", async () => {
    await configure({ count: 72 });
    const before = await assertSettled();
    await configure({ count: 72, fontSize: 17, padding: 40 });
    const after = await assertSettled();
    assert.notEqual(after.height, before.height);
    assert.notEqual(after.scale, before.scale);
    await configure({ count: 100 });
    const tooLong = await assertSettled();
    assert.equal(tooLong.scale, 0.9);
    assert.ok(tooLong.breaks > 0);
    await configure({ count: 10 });
    const short = await assertSettled();
    assert.equal(short.scale, 1);
    assert.equal(short.breaks, 0);
  });

  await t.test("disabling and remounting the preview preserve stable measurement", async () => {
    await configure({ enabled: false });
    const before = await readLayout();
    assert.equal(before.scale, 1);
    await page.waitForTimeout(1000);
    assert.deepEqual(await readLayout(), before);
    await configure();
    await page.goto(`${baseURL}/app/dashboard`);
    await page.goto(`${baseURL}/app/workbench/${id}`);
    await page.waitForSelector("#resume-preview");
    await page.waitForTimeout(600);
    await assertSettled();
  });
});
