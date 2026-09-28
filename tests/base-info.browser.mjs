import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

// Start pnpm dev first. Fixtures use a fresh browser context, not saved resumes.
const baseURL = process.env.PREVIEW_TEST_URL || "http://127.0.0.1:3000";
const templates = ["classic", "creative", "elegant", "left-right", "minimalist", "modern", "timeline", "editorial"];

const readAlignment = (root) => Array.from(root.querySelectorAll('[data-resume-section-id="basic"] svg')).map((icon) => {
  let row = icon.parentElement;
  while (!row.textContent.trim()) row = row.parentElement;
  const text = Array.from(row.querySelectorAll("a, span")).find((node) => node.textContent.trim());
  const iconRect = icon.getBoundingClientRect();
  const textRect = text.getBoundingClientRect();
  const scale = iconRect.height / parseFloat(getComputedStyle(icon).height);
  const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
  return {
    text: text.textContent,
    delta: (iconRect.top + iconRect.height / 2 - textRect.top) / scale - lineHeight / 2,
    lines: textRect.height / scale / lineHeight,
    overflow: row.scrollWidth - row.clientWidth,
    iconWidth: iconRect.width / scale,
  };
});

test("base info icons align with the first text line in preview and PDF export", { timeout: 180_000 }, async (t) => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const exported = await browser.newPage();
  await page.goto(`${baseURL}/app/dashboard`);
  const id = await page.evaluate(async () => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    return useResumeStore.getState().createResume(null);
  });
  await page.goto(`${baseURL}/app/workbench/${id}`);
  await page.waitForSelector("#resume-preview");

  // Render the real outgoing HTML/CSS, without adding a line height or font
  // stylesheet that the PDF request itself does not contain.
  await page.route("**/generate-pdf", async (route) => {
    const payload = route.request().postDataJSON();
    await exported.setContent(`<!doctype html><html><head><style>${payload.styles}
      html, body { margin: 0; padding: 0; }
      body { width: calc(210mm - ${2 * payload.margin}px); }
      </style></head><body>${payload.content}</body></html>`);
    await exported.evaluate(() => document.fonts.ready);
    await route.fulfill({ status: 200, contentType: "application/pdf", body: "alignment-test" });
  });

  for (const template of templates) {
    await t.test(template, async () => {
      for (const [fontSize, fontFamily, layout] of [
        [12, '"Alibaba PuHuiTi", sans-serif', "left"],
        [16, '"MiSans", sans-serif', "center"],
        [20, '"Noto Sans SC", "Noto Sans CJK SC", sans-serif', "right"],
      ]) {
        for (const autoOnePage of [false, true]) {
          await page.evaluate(async ({ template, fontSize, fontFamily, layout, autoOnePage }) => {
            const { useResumeStore } = await import("/src/store/useResumeStore.ts");
            const { preloadFontFamily } = await import("/src/utils/fonts.ts");
            useResumeStore.getState().setTemplate(template);
            const store = useResumeStore.getState();
            const resume = store.activeResume;
            store.updateResume(store.activeResumeId, {
              menuSections: resume.menuSections.filter((section) => ["basic", "skills"].includes(section.id)),
              basic: {
                ...resume.basic, name: "对齐验证", title: "", photo: "", layout,
                employementStatus: "在职-找机会", birthDate: "2000-02", phone: "13812346670",
                email: `${"long.email.".repeat(12)}@example.com`, location: "Java后端开发工程师", customFields: [],
              },
              skillContent: `<p>${"负责前端应用开发维护与性能优化。".repeat(90)}</p>`,
              globalSettings: { ...resume.globalSettings, baseFontSize: fontSize, fontFamily, useIconMode: true, pagePadding: 32, autoOnePage },
            });
            await preloadFontFamily(fontFamily);
            await document.fonts.ready;
          }, { template, fontSize, fontFamily, layout, autoOnePage });
          await page.waitForTimeout(200);
          const scenario = `${template}, ${fontSize}px, ${layout}, autoOnePage=${autoOnePage}`;
          const check = async (target, label) => {
            const fields = await target.locator("#resume-preview").evaluate(readAlignment);
            assert.equal(fields.length, 5, `${scenario}: ${JSON.stringify(fields)}`);
            assert.ok(fields.some((field) => field.lines > 1.5), `${scenario}: long email must wrap`);
            for (const field of fields) {
              assert.ok(Math.abs(field.delta) < 0.1, `${label} ${scenario}: ${JSON.stringify(field)}`);
              assert.ok(field.overflow <= 1, `${label} ${scenario}: field must not overflow`);
              assert.ok(Math.abs(field.iconWidth - (template === "editorial" ? 14 : 16)) < 0.1, `${scenario}: icon must not shrink`);
            }
          };
          await check(page, "preview");
          const download = page.waitForEvent("download");
          await page.evaluate(async () => {
            const { useResumeStore } = await import("/src/store/useResumeStore.ts");
            const { exportToPdf } = await import("/src/utils/export.ts");
            await exportToPdf({ elementId: "resume-preview", title: "alignment-test", pagePadding: 32, fontFamily: useResumeStore.getState().activeResume.globalSettings.fontFamily });
          });
          await download;
          await check(exported, "PDF HTML");
        }
      }
    });
  }
});
