import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const origin = process.env.PREVIEW_TEST_URL || "http://127.0.0.1:3000";

test("quota-limited migration preserves data across a real page lifecycle", { timeout: 30_000 }, async t => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route("**/__resume-storage-test__*", route => route.fulfill({
    contentType: "text/html", body: "<!doctype html><title>Persistence test</title>",
  }));
  await page.goto(`${origin}/__resume-storage-test__`);
  await page.evaluate(async () => {
    const { initialResumeState } = await import("/src/config/initialResumeData.ts");
    const resume = { ...initialResumeState, id: "quota-test", skillContent: "x".repeat(3 * 1024 * 1024) };
    localStorage.setItem("resume-storage", JSON.stringify({
      state: { resumes: { [resume.id]: resume }, activeResumeId: resume.id }, version: 0,
    }));
  });
  const before = await page.evaluate(async () => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    const state = useResumeStore.getState();
    state.updateResumeTitle("Migration failure still saves edits");
    return {
      contentLength: state.activeResume.skillContent.length,
      originalKept: localStorage.getItem("resume-storage") !== null,
      nativeStorage: Storage.prototype.getItem.toString().includes("[native code]"),
    };
  });
  assert.equal(before.contentLength, 3 * 1024 * 1024);
  assert.equal(before.originalKept, true);
  assert.equal(before.nativeStorage, true);
  // Navigate immediately, before the debounce timeout, to exercise pagehide.
  await page.goto(`${origin}/__resume-storage-test__?reload=1`);
  const after = await page.evaluate(async () => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    const resume = useResumeStore.getState().activeResume;
    return { title: resume.title, contentLength: resume.skillContent.length };
  });
  assert.equal(after.title, "Migration failure still saves edits");
  assert.equal(after.contentLength, 3 * 1024 * 1024);
});

test("incremental edits survive navigation without a Storage prototype patch", { timeout: 30_000 }, async t => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route("**/__resume-storage-test__*", route => route.fulfill({
    contentType: "text/html", body: "<!doctype html><title>Persistence test</title>",
  }));
  await page.goto(`${origin}/__resume-storage-test__`);
  const id = await page.evaluate(async () => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    const store = useResumeStore.getState();
    const id = store.createResume(null);
    store.updateResume(id, { title: "Saved on navigation" });
    return id;
  });
  await page.goto(`${origin}/__resume-storage-test__?reload=1`);
  const saved = await page.evaluate(async id => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    return {
      title: useResumeStore.getState().resumes[id].title,
      rawTitle: JSON.parse(localStorage.getItem(`magic-resume-doc:${id}`)).title,
      legacy: localStorage.getItem("resume-storage"),
    };
  }, id);
  assert.deepEqual(saved, { title: "Saved on navigation", rawTitle: "Saved on navigation", legacy: null });
});
