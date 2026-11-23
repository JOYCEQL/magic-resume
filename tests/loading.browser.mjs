import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { chromium } from "playwright";

// Run against a production build to exercise streamed hydration and real chunks:
// PREVIEW_TEST_URL=http://127.0.0.1:3011 node --test tests/loading.browser.mjs
const baseURL = process.env.PREVIEW_TEST_URL || "http://127.0.0.1:3000";

test("cold dashboard hydrates on a slow connection without client-render recovery", { timeout: 60_000 }, async t => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750,
  });
  await page.goto(`${baseURL}/app/dashboard/resumes`);
  await page.getByRole("button", { name: "新建简历", exact: true }).waitFor();
  await page.getByRole("region", { name: "Notifications alt+T" }).waitFor({ state: "attached" });
  await page.waitForLoadState("networkidle");
  assert.deepEqual(errors, [], "slow downloads must not discard hydrated boundaries");
});

test("legacy resume avatars use the optimized image without changing saved photos", { timeout: 30_000 }, async t => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const fixture = JSON.parse(await readFile(new URL("./fixtures/one-page-lists.json", import.meta.url), "utf8"));
  const resume = { ...fixture, id: "legacy-avatar", title: "旧简历头像", templateId: "classic", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
  await page.addInitScript(resume => {
    if (!localStorage.getItem("magic-resume-index")) {
      localStorage.setItem("resume-storage", JSON.stringify({ state: { resumes: { [resume.id]: resume }, activeResumeId: resume.id }, version: 0 }));
    }
  }, resume);
  const requests = [];
  page.on("request", request => requests.push(new URL(request.url()).pathname));
  await page.goto(`${baseURL}/app/dashboard/resumes`);
  const card = page.locator('[data-resume-id="legacy-avatar"]');
  const photo = card.locator('img[src*="/images/avatar."]');
  await photo.waitFor();
  await photo.evaluate(image => image.decode());
  assert.equal(await photo.evaluate(image => image.naturalWidth), 1024);
  assert.ok(!requests.includes("/avatar.png"), "old backups must not fetch the 1.5 MB PNG");
  await card.getByRole("button", { name: "编辑", exact: true }).click();
  await page.locator('#resume-preview img[src*="/images/avatar."]').waitFor();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("magic-resume-doc:legacy-avatar")));
  assert.equal(saved.basic.photo, "/avatar.png", "rendering must not rewrite the user's backup");
});

test("template thumbnails load as WebP only when the picker is opened", { timeout: 30_000 }, async t => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const requests = [];
  page.on("request", request => requests.push(new URL(request.url()).pathname));
  await page.goto(`${baseURL}/app/dashboard/resumes`);
  await page.getByRole("button", { name: "新建简历", exact: true }).waitFor();
  assert.equal(requests.filter(url => url.startsWith("/template-snapshots/")).length, 0);
  await page.getByRole("button", { name: "新建简历", exact: true }).click();
  const thumbnails = page.getByRole("dialog").locator('img[src*="/template-snapshots/"]');
  await thumbnails.first().waitFor();
  assert.equal(await thumbnails.count(), 9);
  for (const img of await thumbnails.all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(image => image.decode());
    assert.match(await img.getAttribute("src"), /\.[a-f0-9]{12}\.webp$/);
    assert.equal(await img.evaluate(image => image.naturalWidth), 794);
  }
  assert.ok(!requests.some(url => /template-snapshots\/.*\.png$/.test(url)));
});
