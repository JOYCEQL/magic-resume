import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { mockSchoolLogos } from "./helpers/school-logo-fixtures.mjs";

// Run against an isolated Vite dev server; fixtures use a fresh browser context.
const origin = process.env.LOGO_TEST_URL || "http://127.0.0.1:3000";
const artifacts = "node_modules/.cache/logo-upload";

async function eventually(assertion) {
  const deadline = Date.now() + 15_000;
  while (true) {
    try { return await assertion(); } catch (error) {
      if (Date.now() >= deadline) throw error;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

test("old resumes support logo uploads, ratios, remote images, all templates and PDF export", {
  timeout: 180_000,
}, async (t) => {
  await mkdir(artifacts, { recursive: true });
  const png = await readFile(new URL("../public/company.png", import.meta.url));
  // Deliberately omit CORS headers, exercising the real same-origin image proxy.
  const imageHost = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "image/png" });
    response.end(png);
  });
  await new Promise(resolve => imageHost.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => imageHost.close(resolve)));
  const imageUrl = `http://127.0.0.1:${imageHost.address().port}/logo.png`;
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
  const searchRequests = await mockSchoolLogos(page, await readFile(new URL("../public/university.png", import.meta.url)));
  const errors = [];
  const schoolRequests = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => {
    if (/SchoolLogoSearch|school-logos/.test(request.url())) schoolRequests.push(request.url());
  });
  await page.goto(`${origin}/app/dashboard`);
  const id = await page.evaluate(async (remoteUrl) => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    const store = useResumeStore.getState();
    const id = store.createResume(null);
    const resume = useResumeStore.getState().resumes[id];
    const education = resume.education.map(({ logo, logoConfig, ...old }) => old);
    const experience = resume.experience.map(old => ({ ...old, logo: remoteUrl, logoConfig: undefined }));
    store.updateResume(id, { education, experience, activeSection: "education" });
    return id;
  }, imageUrl);
  await page.goto(`${origin}/app/workbench/${id}`);
  await page.waitForSelector("#resume-preview");
  assert.deepEqual(schoolRequests, [], "the workbench does not load the school catalog or logos");
  await page.locator("h3").filter({ hasText: "北京大学", visible: true }).first().click();

  const savedEducation = () => page.evaluate((resumeId) =>
    JSON.parse(localStorage.getItem("resume-storage")).state.resumes[resumeId].education[0], id);
  await page.getByRole("button", { name: "隐藏 Logo", exact: true }).click();
  let saved = await savedEducation();
  assert.equal(saved.logoConfig.width, 20);
  assert.equal(saved.logoConfig.height, 20);
  assert.equal(saved.logoConfig.visible, false);
  await page.getByRole("button", { name: "显示 Logo", exact: true }).click();
  await page.getByRole("button", { name: "Logo 设置", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Logo 设置" });
  await drawer.waitFor({ state: "visible" });
  await drawer.locator('input[type="file"]').setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: png });
  await eventually(async () => assert.match((await savedEducation()).logo || "", /^data:image\/png;base64,/));
  await drawer.getByRole("button", { name: "4:3", exact: true }).click();
  saved = await savedEducation();
  assert.equal(saved.logoConfig.width, 20);
  assert.equal(saved.logoConfig.height, 15);
  await drawer.getByRole("textbox", { name: "宽度", exact: true }).fill("40");
  await drawer.getByRole("textbox", { name: "宽度", exact: true }).blur();
  saved = await savedEducation();
  assert.equal(saved.logoConfig.width, 40);
  assert.equal(saved.logoConfig.height, 30);
  await drawer.getByRole("button", { name: "圆形", exact: true }).click();
  await drawer.getByRole("button", { name: "关闭", exact: true }).click();
  await drawer.waitFor({ state: "hidden" });

  await page.getByRole("button", { name: "Logo 设置", exact: true }).click();
  let proxyRequests = 0;
  page.on("request", request => {
    if (request.url().includes("/api/proxy/image?")) proxyRequests += 1;
  });
  await drawer.getByRole("textbox", { name: "图片链接", exact: true }).fill(imageUrl);
  assert.equal(proxyRequests, 0, "typing a URL does not launch image requests");
  await drawer.getByRole("button", { name: "使用图片链接", exact: true }).click();
  await drawer.getByRole("button", { name: "使用图片链接", exact: true }).waitFor();
  assert.ok(proxyRequests >= 1);
  saved = await savedEducation();
  assert.match(saved.logo, /^data:image\/png;base64,/);
  assert.equal(saved.logoConfig.width, 40);
  // Invalid replacement must leave the previously saved logo intact.
  let previousLogo = saved.logo;
  await drawer.getByRole("textbox", { name: "图片链接", exact: true }).fill("not-a-url");
  await drawer.getByRole("button", { name: "使用图片链接", exact: true }).click();
  await drawer.getByRole("button", { name: "使用图片链接", exact: true }).waitFor();
  assert.equal((await savedEducation()).logo, previousLogo);
  assert.deepEqual(schoolRequests, [], "opening logo settings and uploading do not load school search");
  await drawer.getByRole("button", { name: "查找学校校徽", exact: true }).click();
  const searchInput = drawer.getByRole("textbox", { name: "搜索学校", exact: true });
  await searchInput.waitFor();
  assert.equal(await searchInput.inputValue(), "北京大学");
  await drawer.getByRole("button", { name: "使用北京大学校徽", exact: true }).waitFor();
  await searchInput.fill("university");
  const results = drawer.getByRole("list", { name: "学校校徽候选" });
  await eventually(async () => assert.equal(await results.getByRole("listitem").count(), 6));
  await searchInput.fill("unknown school 123456");
  await results.getByRole("status").waitFor();
  const requestsBeforeTyping = searchRequests.length;
  await searchInput.fill("北京大学");
  await eventually(async () => assert.equal(await results.getByRole("listitem").count(), 1));
  assert.equal(searchRequests.length, requestsBeforeTyping, "revisiting a query reuses client cache");
  await searchInput.press("Tab");
  await page.keyboard.press("Enter");
  await eventually(async () => {
    const logo = (await savedEducation()).logo;
    assert.match(logo, /^data:image\/png;base64,/);
    assert.notEqual(logo, previousLogo);
  });
  previousLogo = (await savedEducation()).logo;
  const dimensions = await page.evaluate(src => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve([img.naturalWidth, img.naturalHeight]);
    img.src = src;
  }), previousLogo);
  assert.ok(Math.max(...dimensions) <= 200, "selected logos are bounded for storage and export");
  await page.screenshot({ path: `${artifacts}/school-search-desktop.png` });
  await drawer.getByRole("button", { name: "关闭", exact: true }).click();
  const requestsAfterChoosing = schoolRequests.length;
  await page.reload();
  await page.waitForSelector("#resume-preview");
  assert.equal((await savedEducation()).logo, previousLogo);
  assert.equal(schoolRequests.length, requestsAfterChoosing, "saved logo previews do not reload the catalog or source image");

  const templates = await page.evaluate(async () => {
    const { DEFAULT_TEMPLATES } = await import("/src/components/templates/registry.ts");
    return DEFAULT_TEMPLATES.map(template => template.id);
  });
  assert.equal(templates.length, 9);
  for (const templateId of templates) {
    await page.evaluate(async ({ resumeId, templateId }) => {
      const { useResumeStore } = await import("/src/store/useResumeStore.ts");
      useResumeStore.getState().updateResume(resumeId, { templateId });
    }, { resumeId: id, templateId });
    const schoolLogo = page.locator("#resume-preview img").filter({ visible: true });
    await eventually(async () => assert.equal(await schoolLogo.evaluateAll((images, target) => images.some(image =>
      image.getAttribute("src") === target && image.complete && image.naturalWidth > 0 &&
      image.style.width === "40px" && image.style.height === "30px"), previousLogo), true, templateId));
    await eventually(async () => assert.equal(await page.locator('#resume-preview img[src^="/api/proxy/image?"]').evaluateAll(images =>
      images.some(image => image.complete && image.naturalWidth > 0)), true, `${templateId}: legacy remote logo`));
  }
  await page.screenshot({ path: `${artifacts}/desktop.png` });

  const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
  await page.evaluate(async () => {
    const { exportToLongPagePdf } = await import("/src/utils/export.ts");
    await exportToLongPagePdf({ elementId: "resume-preview", title: "logo-regression", pagePadding: 32 });
  });
  const download = await downloadPromise;
  await download.saveAs(`${artifacts}/logos.pdf`);
  const pdf = await readFile(`${artifacts}/logos.pdf`);
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  assert.match(pdf.toString("latin1"), /\/Subtype\s*\/Image/);

  // Fresh mobile context must select a bottom drawer without requiring resize.
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mockSchoolLogos(mobile, png);
  await mobile.goto(`${origin}/app/dashboard`);
  await mobile.evaluate(({ resumeId, stored }) => localStorage.setItem("resume-storage", stored), {
    resumeId: id,
    stored: await page.evaluate(() => localStorage.getItem("resume-storage")),
  });
  await mobile.goto(`${origin}/app/workbench/${id}`);
  await mobile.getByRole("button", { name: "内容", exact: true }).click();
  await mobile.locator("h3").filter({ hasText: "北京大学", visible: true }).first().click();
  await mobile.getByRole("button", { name: "Logo 设置", exact: true }).click();
  const mobileDrawer = mobile.getByRole("dialog", { name: "Logo 设置" });
  await mobileDrawer.waitFor({ state: "visible" });
  assert.equal(await mobileDrawer.getAttribute("data-vaul-drawer-direction"), "bottom");
  await eventually(async () => {
    const box = await mobileDrawer.boundingBox();
    assert.ok(box.x >= -1 && box.x + box.width <= 391);
    assert.ok(box.y >= 0 && box.y + box.height <= 845, `mobile drawer bounds: ${JSON.stringify(box)}`);
  });
  await mobileDrawer.getByRole("button", { name: "查找学校校徽", exact: true }).click();
  await mobileDrawer.getByRole("textbox", { name: "搜索学校", exact: true }).fill("Harvard");
  await mobileDrawer.getByRole("button", { name: "使用哈佛大学校徽", exact: true }).waitFor();
  assert.ok(await mobileDrawer.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
  assert.ok(await mobileDrawer.getByRole("button", { name: "关闭", exact: true }).isVisible());
  await mobile.screenshot({ path: `${artifacts}/mobile.png` });
  assert.deepEqual(errors, []);
});
