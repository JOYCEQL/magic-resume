import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

// Start pnpm dev first. Fixtures stay in isolated browser contexts.
const baseURL = process.env.PREVIEW_TEST_URL || "http://127.0.0.1:3000";
const launch = () => chromium.launch();

test("empty resume list downloads no resume fonts or remote Newsreader", { timeout: 30_000 }, async t => {
  const browser = await launch();
  t.after(() => browser.close());
  const page = await browser.newPage();
  const requests = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto(`${baseURL}/app/dashboard/resumes`);
  await page.getByRole("heading", { name: "我的简历", exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.deepEqual(requests.filter(url => /\/fonts\/resume\/|\.(ttf|otf)(\?|$)/.test(url)), []);
  // React Grab may request its own Geist font in development only.
  assert.deepEqual(requests.filter(url => /fonts\.googleapis\.com.*Newsreader|fonts\.gstatic\.com\/s\/newsreader\//.test(url)), []);
  assert.equal(await page.locator('link[href*="fonts.googleapis.com"]').count(), 0);
  assert.ok(requests.some(url => url.includes("/fonts/ui/newsreader-")), "keep the original heading typeface locally");
});

test("offscreen cards defer fonts; editing reuses the selected font", { timeout: 60_000 }, async t => {
  const browser = await launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const fonts = [];
  page.on("request", request => {
    if (request.url().includes("/fonts/resume/")) fonts.push(request.url());
  });
  await page.goto(`${baseURL}/app/dashboard/resumes`);
  const id = await page.evaluate(async () => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    let last;
    for (let index = 0; index < 24; index++) {
      const store = useResumeStore.getState();
      last = store.createResume(null);
      store.updateResume(last, {
        createdAt: new Date(Date.UTC(2026, 0, 24 - index)).toISOString(),
        globalSettings: {
          ...useResumeStore.getState().resumes[last].globalSettings,
          fontFamily: index === 23 ? '"Noto Sans SC", "Noto Sans CJK SC", sans-serif' : '"Alibaba PuHuiTi", sans-serif',
        },
      });
    }
    return last;
  });
  await page.locator(".resume-preview > :first-child").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  const card = page.locator(`[data-resume-id="${id}"]`);
  assert.equal(await card.locator(".resume-preview").evaluate(el => el.childElementCount), 0);
  assert.ok(!fonts.some(url => url.includes("NotoSansSC")), "don't warm fonts for saved resumes outside the viewport");
  await card.scrollIntoViewIfNeeded();
  await card.locator(".resume-preview > :first-child").waitFor();
  await card.hover();
  await page.evaluate(async () => {
    const { preloadFontFamily } = await import("/src/utils/fonts.ts");
    await preloadFontFamily('"Noto Sans SC", "Noto Sans CJK SC", sans-serif');
  });
  assert.ok(fonts.some(url => url.includes("NotoSansSC")), "the visible preview keeps its selected font");
  const before = fonts.length;
  await card.getByRole("button", { name: "编辑", exact: true }).click();
  await page.waitForURL(`**/app/workbench/${id}`);
  await page.locator("#resume-preview").waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(fonts.length, before, "navigation must reuse fonts already loaded by the list");
});

test("cold workbench stays editable while fonts are waiting", { timeout: 45_000 }, async t => {
  const browser = await launch();
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const setup = await context.newPage();
  await setup.goto(`${baseURL}/app/dashboard/resumes`);
  // Create on a page which does not render a resume, then close it before it can
  // warm any fonts. The next page is a direct workbench entry with a cold font set.
  await setup.goto(`${baseURL}/app/dashboard/ai`);
  const id = await setup.evaluate(async () => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    return useResumeStore.getState().createResume(null);
  });
  await setup.close();
  const page = await context.newPage();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const held = [];
  await page.route("**/fonts/resume/*", async route => {
    held.push(route.request().url());
    await gate;
    await route.continue();
  });
  try {
    await page.goto(`${baseURL}/app/workbench/${id}`, { waitUntil: "domcontentloaded" });
    const title = page.getByPlaceholder("简历名称").filter({ visible: true });
    await title.fill("字体下载时仍可编辑");
    assert.equal(await title.inputValue(), "字体下载时仍可编辑");
    assert.ok(held.length > 0, "exercise a real pending font download");
    await title.blur();
    assert.equal(await page.evaluate(async () => {
      const { useResumeStore } = await import("/src/store/useResumeStore.ts");
      return useResumeStore.getState().activeResume.title;
    }), "字体下载时仍可编辑");
  } finally {
    release();
  }
  await page.evaluate(() => document.fonts.ready);
});
