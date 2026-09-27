import assert from "node:assert/strict";
import test from "node:test";
import { mkdir } from "node:fs/promises";
import { chromium, webkit } from "playwright";
import { initialResumeState } from "../src/config/initialResumeData";

const origin = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const artifacts = "node_modules/.cache/mobile-workbench";
await mkdir(artifacts, { recursive: true });

for (const engine of [chromium, webkit]) {
  test(`${engine.name()}: mobile workbench keeps navigation in the viewport`, { timeout: 90_000 }, async (t) => {
    const browser = await engine.launch();
    t.after(() => browser.close());
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const resume = {
      ...initialResumeState,
      id: "mobile-workbench-test",
      createdAt: "2026-09-27T00:00:00.000Z",
      updatedAt: "2026-09-27T00:00:00.000Z",
      activeSection: "skills",
      skillContent: "<p>Scrollable resume content</p>".repeat(40),
    };
    await page.goto(origin);
    await page.evaluate((data) => {
      localStorage.setItem("resume-storage", JSON.stringify({
        state: { resumes: { [data.id]: data }, activeResumeId: data.id }, version: 0,
      }));
    }, resume);
    await page.goto(`${origin}/app/workbench/${resume.id}`);
    const contentButton = page.getByRole("button", { name: "内容", exact: true });
    await contentButton.waitFor();
    assert.match(await page.locator('meta[name="viewport"]').getAttribute("content") || "", /viewport-fit=cover/);

    // Exercise address-bar/keyboard-sized viewport changes, short landscape,
    // and an explicit home-indicator inset. This is not a physical iOS keyboard.
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 390, height: 660 },
      { width: 390, height: 360 },
      { width: 667, height: 375 },
      { width: 320, height: 568 },
    ]) {
      await page.setViewportSize(viewport);
      for (const inset of [0, 34]) {
        await contentButton.evaluate((button, padding) => {
          button.parentElement!.parentElement!.style.paddingBottom = `${padding}px`;
        }, inset);
        for (const tab of ["内容", "样式", "预览"]) {
          await page.getByRole("button", { name: tab, exact: true }).click();
          await page.waitForTimeout(300);
          const layout = await contentButton.evaluate((button) => {
            const nav = button.parentElement!.parentElement!;
            const rect = nav.getBoundingClientRect();
            const main = document.querySelector("main")!.getBoundingClientRect();
            const header = document.querySelector("header")!.getBoundingClientRect();
            const buttons = Array.from(nav.querySelectorAll("button")).map((item) => {
              const box = item.getBoundingClientRect();
              return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
            });
            return {
              top: rect.top, bottom: rect.bottom, height: rect.height,
              mainBottom: main.bottom, headerHeight: header.height,
              viewportHeight: window.innerHeight, viewportWidth: window.innerWidth,
              locked: getComputedStyle(document.body).position, buttons,
            };
          });
          const scenario = `${engine.name()} ${viewport.width}x${viewport.height}, ${tab}, inset ${inset}: ${JSON.stringify(layout)}`;
          assert.ok(Math.abs(layout.bottom - layout.viewportHeight) < 1, scenario);
          assert.ok(Math.abs(layout.mainBottom - layout.viewportHeight) < 1, scenario);
          assert.equal(layout.height, 65 + inset, scenario);
          assert.equal(layout.headerHeight, 64, scenario);
          assert.equal(layout.locked, "fixed", scenario);
          for (const button of layout.buttons) {
            assert.ok(button.top >= layout.top && button.bottom <= layout.bottom - inset + 1, scenario);
            // WebKit rounds fractional thirds to 1/64px (320px may end at 320.016px).
            assert.ok(button.left >= -0.5 && button.right <= layout.viewportWidth + 0.5, scenario);
          }
        }
      }
    }
    await page.screenshot({ path: `${artifacts}/${engine.name()}-320.png` });

    await page.setViewportSize({ width: 390, height: 660 });
    await contentButton.click();
    const editor = page.locator('.tiptap[contenteditable="true"]:visible').first();
    await editor.waitFor();
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.type(" Mobile edit retained");
    assert.match(await page.evaluate(() => JSON.parse(localStorage.getItem("resume-storage")!).state.resumes["mobile-workbench-test"].skillContent), /Mobile edit retained/);

    await page.setViewportSize({ width: 1024, height: 768 });
    assert.equal(await contentButton.isVisible(), false);
    await page.locator("#resume-preview").waitFor();
    // A client-side route change must release the document scroll lock.
    await page.locator("header").getByText(/^(魔方简历|Magic Resume)$/).click();
    await page.waitForURL("**/app/dashboard/resumes");
    assert.equal(await page.locator("body").evaluate((body) => body.classList.contains("workbench-body-lock")), false);
    assert.deepEqual(pageErrors, []);
  });
}
