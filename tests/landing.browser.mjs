import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

// Start pnpm dev first, or set LANDING_TEST_URL to a production preview.
const baseURL = process.env.LANDING_TEST_URL ?? "http://127.0.0.1:3000";

const readLayout = (page) =>
  page.evaluate(() => {
    const hero = document.querySelector(".landing-hero-layout");
    const title = document.querySelector("h1");
    return {
      display: getComputedStyle(hero).display,
      size: getComputedStyle(title).fontSize,
      columns: getComputedStyle(hero).gridTemplateColumns,
      overflow: document.documentElement.scrollWidth > innerWidth,
      image: document
        .querySelector(".landing-hero-screenshot img")
        .getAttribute("src"),
      stylesheet: [...document.querySelectorAll('link[rel="stylesheet"]')].some(
        (link) => /landing|_locale/.test(link.getAttribute("href")),
      ),
    };
  });

for (const locale of ["zh", "en"]) {
  test(
    `${locale} landing styles work before hydration and survive reload`,
    { timeout: 45_000 },
    async (t) => {
      const browser = await chromium.launch();
      t.after(() => browser.close());
      const serverPage = await browser.newPage({
        javaScriptEnabled: false,
        viewport: { width: 1440, height: 900 },
      });
      await serverPage.goto(`${baseURL}/${locale}`);
      const serverLayout = await readLayout(serverPage);
      assert.equal(serverLayout.stylesheet, true);
      assert.equal(serverLayout.display, "grid");
      assert.equal(serverLayout.image, "/web-shot.png");
      assert.equal(
        await serverPage.locator(".landing-hero-art img").getAttribute("src"),
        "/landing/unfold.webp",
      );
      assert.equal(await serverPage.locator("#features img").count(), 0);
      const heroBox = await serverPage
        .locator(".landing-hero-layout")
        .boundingBox();
      const screenshotBox = await serverPage
        .locator(".landing-hero-screenshot")
        .boundingBox();
      assert.ok(screenshotBox.y >= heroBox.y + heroBox.height - 1);
      assert.ok(Math.abs(screenshotBox.x + screenshotBox.width / 2 - 720) < 2);
      assert.equal(serverLayout.overflow, false);

      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${baseURL}/${locale}`);
      await page.waitForLoadState("networkidle");
      for (let index = 0; index < 4; index++) {
        const card = page.locator(".landing-template-card").nth(index);
        const source = await card.locator("img").getAttribute("src");
        await card.click();
        const dialog = page.getByRole("dialog");
        await dialog.waitFor({ state: "visible" });
        assert.equal(await dialog.locator("img").getAttribute("src"), source);
        await page.keyboard.press("Escape");
      }
      assert.deepEqual(await readLayout(page), serverLayout);
      await page.reload();
      await page.waitForLoadState("networkidle");
      assert.deepEqual(await readLayout(page), serverLayout);
      for (const width of [320, 390, 768]) {
        await page.setViewportSize({ width, height: 844 });
        assert.equal((await readLayout(page)).overflow, false);
      }
      await page.locator(".landing-language").click();
      await page.waitForURL(`${baseURL}/${locale === "zh" ? "en" : "zh"}`);
      assert.equal((await readLayout(page)).display, "grid");
      for (const group of ["ai", "storage"]) {
        for (const index of [1, 0]) {
          const option = page
            .locator(`.why-story-${group} .why-options button`)
            .nth(index);
          await option.click();
          assert.equal(await option.getAttribute("aria-pressed"), "true");
        }
      }
      assert.deepEqual(errors, []);
    },
  );
}

for (const preference of ["dark", "system"]) {
  test(
    `landing stays light without changing ${preference} app preference`,
    { timeout: 45_000 },
    async (t) => {
      const browser = await chromium.launch();
      t.after(() => browser.close());
      const page = await browser.newPage({
        colorScheme: "dark",
        viewport: { width: 1440, height: 900 },
      });
      await page.addInitScript(
        (theme) => localStorage.setItem("magic-resume-theme", theme),
        preference,
      );
      await page.route("https://api.github.com/**", (route) => route.abort());
      await page.route("**/node_modules/.vite/deps/react-grab*", (route) =>
        route.fulfill({
          contentType: "application/javascript",
          body: "export {};",
        }),
      );
      await page.goto(`${baseURL}/zh`);
      await page.waitForLoadState("networkidle");
      assert.equal(
        await page.locator('header [aria-label="切换主题"]').count(),
        0,
      );
      assert.equal(await page.locator("html").getAttribute("class"), "light");
      assert.equal(
        await page.evaluate(() => localStorage.getItem("magic-resume-theme")),
        preference,
      );
      await page.locator(".landing-template-card").first().click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor({ state: "visible" });
      const background = await dialog.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      assert.ok(Number(background.match(/\d+/)[0]) > 200, background);
      await page.keyboard.press("Escape");
      await page.locator(".landing-nav-cta").click();
      await page.waitForURL("**/app/dashboard**");
      await page.waitForFunction(() =>
        document.documentElement.classList.contains("dark"),
      );
      assert.equal(
        await page.evaluate(() => localStorage.getItem("magic-resume-theme")),
        preference,
      );
      await page.goBack();
      await page.waitForFunction(() =>
        document.documentElement.classList.contains("light"),
      );
      await page.reload();
      await page.waitForLoadState("networkidle");
      assert.equal(await page.locator("html").getAttribute("class"), "light");
      await page.setViewportSize({ width: 320, height: 844 });
      await page.locator(".landing-menu-toggle").click();
      await page.locator("#landing-menu").waitFor({ state: "visible" });
      assert.equal(
        await page.locator('header [aria-label="切换主题"]').count(),
        0,
      );
      assert.equal(
        await page.evaluate(() => localStorage.getItem("magic-resume-theme")),
        preference,
      );
    },
  );
}
