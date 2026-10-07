import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

// Start `pnpm dev` first. All fixture data stays in an isolated browser context.
// Override PREVIEW_TEST_URL when the Vite development server uses another port.
const baseURL = process.env.PREVIEW_TEST_URL || "http://127.0.0.1:3000";

test("toast styling survives document hydration recovery and real toggle clicks", {
  timeout: 30_000,
}, async (t) => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${baseURL}/app/dashboard`);
  const id = await page.evaluate(async () => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    const store = useResumeStore.getState();
    const id = store.createResume(null);
    store.updateResume(id, {
      skillContent: `<p>${"负责前端开发与技术方案设计。".repeat(300)}</p>`,
      globalSettings: { ...useResumeStore.getState().activeResume.globalSettings, autoOnePage: false },
    });
    return id;
  });
  await page.route(`${baseURL}/app/workbench/${id}`, async route => {
    const response = await route.fetch();
    const html = await response.text();
    // Reproduce an extra DOM node before hydration, causing React 18 to replace
    // the document and discard styles injected only once by a library module.
    await route.fulfill({ response, body: html.replace("<head>", `<head><script>
      document.documentElement.insertBefore(document.createElement("div"), document.head);
    </script>`) });
  });
  await page.goto(`${baseURL}/app/workbench/${id}`);
  await page.waitForSelector("#resume-preview");
  assert.ok(errors.some(message => /hydrat/i.test(message)), "exercise actual hydration recovery");
  assert.equal(await page.evaluate(() => [...document.querySelectorAll("style")]
    .filter(style => style.textContent.includes("data-sonner-toaster")).length), 0,
  "the module-injected stylesheet was discarded");

  const toggle = page.locator("div[data-state] > .lucide-file-text").locator("..");
  await toggle.click();
  const warning = page.locator('[data-sonner-toast][data-type="warning"]');
  await warning.waitFor({ state: "visible" });
  assert.match(await warning.innerText(), /90%/);
  assert.equal(await page.locator("[data-sonner-toaster]").evaluate(el =>
    getComputedStyle(el).position), "fixed");
  await page.waitForFunction(() => {
    const toast = document.querySelector('[data-sonner-toast][data-type="warning"]');
    const rect = toast.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= innerHeight &&
      toast.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  });
  await toggle.click();
  await warning.waitFor({ state: "hidden" });
  await toggle.click();
  await warning.waitFor({ state: "visible" });
});

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
          baseFontSize: fontSize,
          pagePadding: padding,
        },
      });
    }, { count, enabled, fontSize, padding });
    await page.waitForTimeout(600);
  };

  const readLayout = () => page.locator("#resume-preview").evaluate((element) => {
    const content = element.querySelector("[data-resume-content]");
    const measurement = document.querySelector("[data-resume-measurement] [data-resume-content]");
    const paper = element.parentElement.getBoundingClientRect();
    const rect = content.getBoundingClientRect();
    const outerScale = paper.width / parseFloat(getComputedStyle(element.parentElement).width);
    return {
      height: element.clientHeight,
      width: element.clientWidth,
      scale: Number(content.style.zoom),
      naturalHeight: parseFloat(getComputedStyle(measurement).height),
      naturalWidth: measurement.clientWidth,
      renderedHeight: rect.height / outerScale,
      padding: parseFloat(getComputedStyle(element).paddingTop),
      left: (rect.left - paper.left) / outerScale,
      right: (paper.right - rect.right) / outerScale,
      breaks: element.querySelectorAll(".page-break-line").length,
    };
  });

  const assertSettled = async () => {
    const first = await readLayout();
    assert.ok(first.scale >= 0.9 && first.scale <= 1);
    if (first.scale < 1 && first.scale > 0.9) {
      assert.ok(first.renderedHeight <= 297 * 96 / 25.4 - 2 * first.padding,
        "a fitting scale must not overflow the page");
    }
    assert.ok(Math.abs(first.left - first.padding) < 0.1);
    assert.ok(Math.abs(first.right - first.padding) < 0.1);
    assert.equal(await page.locator("[data-resume-measurement]").count(), 1);
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
      assert.ok(after.height < before.height);
      assert.equal(after.naturalHeight, before.naturalHeight);
      assert.equal(after.naturalWidth, before.naturalWidth);
      assert.equal(after.width, before.width);
      assert.ok(after.scale < 1 && after.scale > 0.9);
      assert.equal(after.breaks, 0);
    });
  }

  await t.test("repeated toggles and viewport changes preserve the measurement", async () => {
    await configure();
    const expected = await readLayout();
    for (let i = 0; i < 3; i++) {
      await configure({ enabled: false });
      await configure();
      assert.deepEqual(await readLayout(), expected);
    }
    await page.setViewportSize({ width: 1280, height: 1200 });
    await page.waitForTimeout(300);
    assert.deepEqual(await readLayout(), expected);
    await page.setViewportSize({ width: 1280, height: 720 });
  });

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

  await t.test("PDF export and browser print preserve the preview's line breaks and scale", async () => {
    await configure({ count: 72, padding: 40 });
    const readContent = (element) => {
      const content = element.querySelector("[data-resume-content]");
      const paragraph = content.querySelector('[data-resume-section-id="skills"] p');
      const node = paragraph.firstChild;
      const lines = [];
      let lastTop = -1;
      for (let i = 0; i < node.length; i++) {
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const top = range.getBoundingClientRect().top;
        if (Math.abs(top - lastTop) > 0.1) {
          lines.push("");
          lastTop = top;
        }
        lines[lines.length - 1] += node.textContent[i];
      }
      return {
        width: parseFloat(getComputedStyle(content).width),
        height: content.clientHeight,
        scale: Number(content.style.zoom),
        lines,
      };
    };
    const expected = await page.locator("#resume-preview").evaluate(readContent);
    const assertMatchingLayout = (actual) => {
      assert.equal(actual.width, expected.width);
      assert.equal(actual.scale, expected.scale);
      assert.deepEqual(actual.lines, expected.lines);
      // clientHeight is an integer; separate screen/print documents can round
      // fractional font and image metrics to neighbouring CSS pixels.
      assert.ok(Math.abs(actual.height - expected.height) <= 1);
    };
    const exportPage = await browser.newPage();
    // Font requests must have the app's origin; about:blank would fail CORS and
    // silently render the fixture with a different font.
    await exportPage.route("**/__pdf-regression__", (route) => route.fulfill({
      contentType: "text/html", body: "<!doctype html><html><head></head><body></body></html>",
    }));
    await exportPage.goto(`${baseURL}/__pdf-regression__`);
    const fontCss = await page.evaluate(async () => {
      const { getFontFaceCss } = await import("/src/utils/fonts.ts");
      return getFontFaceCss();
    });
    let payload;
    // Render the actual export request locally so this regression test does not
    // depend on the external PDF service's availability.
    await page.route("**/generate-pdf", async (route) => {
      payload = route.request().postDataJSON();
      await exportPage.setContent(`<!doctype html><html><head><base href="${baseURL}/">
        <style>${fontCss}\n${payload.styles}
        html, body { margin: 0; padding: 0; }
        body { width: calc(210mm - ${2 * payload.margin}px); }
        </style></head><body>${payload.content}</body></html>`);
      await exportPage.evaluate(() => document.fonts.ready);
      const pdf = await exportPage.pdf({
        format: "A4", printBackground: true,
        margin: { top: "40px", bottom: "40px", left: "40px", right: "40px" },
      });
      await route.fulfill({ status: 200, contentType: "application/pdf", body: pdf });
    });
    try {
      const downloaded = page.waitForEvent("download");
      await page.evaluate(async () => {
        const { exportToPdf } = await import("/src/utils/export.ts");
        await exportToPdf({ elementId: "resume-preview", title: "parity-test", pagePadding: 40 });
      });
      await downloaded;
      assert.equal(payload.margin, 40);
      const exported = await exportPage.locator("#resume-preview").evaluate(readContent);
      assertMatchingLayout(exported);
      assert.equal(await exportPage.locator(".page-break-line").count(), 0);

      const printHtml = await page.evaluate(async () => {
        const { exportResumeToBrowserPrint } = await import("/src/utils/print.ts");
        await exportResumeToBrowserPrint(document.getElementById("resume-preview"), 40);
        const frame = document.querySelector("iframe");
        frame.contentWindow.print = () => {};
        return frame.contentDocument.documentElement.outerHTML;
      });
      await exportPage.setContent(printHtml.replace("<head>", `<head><base href="${baseURL}/">`));
      await exportPage.evaluate(() => document.fonts.ready);
      assertMatchingLayout(await exportPage.locator("#resume-preview").evaluate(readContent));
    } finally {
      await page.unroute("**/generate-pdf");
      await exportPage.close();
    }
  });
});

// Issue #392: real list spacing disappeared only in the off-screen measurement.
// Keep lists, nested lists and template headings in the regression matrix.
test("list layout, page indicators and exported PDF agree", { timeout: 120_000 }, async (t) => {
  const { readFile } = await import("node:fs/promises");
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const fixture = JSON.parse(await readFile(new URL("./fixtures/one-page-lists.json", import.meta.url)));
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${baseURL}/app/dashboard`);
  const id = await page.evaluate(async () => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    return useResumeStore.getState().createResume(null);
  });
  await page.goto(`${baseURL}/app/workbench/${id}`);
  await page.waitForSelector("#resume-preview");
  await page.evaluate(() => document.fonts.ready);

  // Retain the module handle while exercising rapid state updates.
  const resumeStore = await page.evaluateHandle(async () =>
    (await import("/src/store/useResumeStore.ts")).useResumeStore);
  t.after(() => resumeStore.dispose());
  const configure = async (templateId, enabled, withEmptySections = true) => {
    await resumeStore.evaluate((useResumeStore, { fixture, templateId, enabled, withEmptySections }) => {
      const store = useResumeStore.getState();
      store.updateResume(store.activeResumeId, {
        ...fixture, templateId,
        menuSections: fixture.menuSections.filter(s => withEmptySections || !["experience", "education"].includes(s.id)),
        globalSettings: { ...fixture.globalSettings, autoOnePage: enabled },
      });
    }, { fixture, templateId, enabled, withEmptySections });
    await page.waitForFunction(() => document.querySelector("#resume-preview")
      .getAnimations({ subtree: true }).every(animation => animation.playState !== "running"));
    // Mutation/Resize observers publish their result on the next frame.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  const read = () => page.evaluate(() => {
    const root = document.querySelector("#resume-preview");
    const content = root.querySelector("[data-resume-content]");
    const measurement = document.querySelector("[data-resume-measurement]");
    const outerScale = root.getBoundingClientRect().width / parseFloat(getComputedStyle(root).width);
    const styleOf = el => {
      const s = getComputedStyle(el);
      return [s.fontFamily, s.fontSize, s.lineHeight, s.margin, s.padding, s.display, s.listStyleType];
    };
    return {
      scale: Number(content.style.zoom),
      height: content.getBoundingClientRect().height / outerScale,
      measuredHeight: measurement.querySelector("[data-resume-content]").getBoundingClientRect().height,
      pageCount: Number(root.dataset.pageCount),
      breaks: [...root.querySelectorAll(".page-break-line")].map(el => parseFloat(el.style.top)),
      styles: [...root.querySelectorAll("h1,h2,h3,ul,ol,li,p")].map(styleOf),
      measuredStyles: [...measurement.querySelectorAll("h1,h2,h3,ul,ol,li,p")].map(styleOf),
    };
  });

  const templates = await page.evaluate(async () => {
    const { DEFAULT_TEMPLATES } = await import("/src/components/templates/registry.ts");
    return DEFAULT_TEMPLATES.map(t => t.id);
  });
  for (const template of templates) {
    await t.test(`${template}: measurement retains document styling`, async () => {
      await configure(template, false);
      const result = await read();
      assert.deepEqual(result.styles, result.measuredStyles);
      assert.ok(Math.abs(result.height - result.measuredHeight) < 0.01, JSON.stringify({template,actual:result.height,measured:result.measuredHeight}));
    });
  }

  await t.test("nested numbered lists keep the same measurement and counters", async () => {
    await configure("classic", false);
    await page.evaluate(async () => {
      const { useResumeStore } = await import("/src/store/useResumeStore.ts");
      const store = useResumeStore.getState();
      store.updateResume(store.activeResumeId, {
        skillContent: '<ol><li><p>First item</p><ol><li><p>Nested item</p></li></ol></li><li><p>Second item</p></li></ol>',
      });
    });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const result = await read();
    assert.deepEqual(result.styles, result.measuredStyles);
    const counters = await page.evaluate(() => ["#resume-preview", "[data-resume-measurement]"]
      .map(selector => [...document.querySelector(selector).querySelectorAll("ol > li")]
        .map(li => getComputedStyle(li, "::before").content)));
    assert.deepEqual(counters[0], counters[1]);
  });

  const pdfPage = await browser.newPage();
  await pdfPage.route("**/__pdf-regression__", route => route.fulfill({
    contentType: "text/html", body: "<!doctype html><html><head></head><body></body></html>",
  }));
  await pdfPage.goto(`${baseURL}/__pdf-regression__`);
  // The service provides these fonts. The local renderer loads the same assets.
  const fonts = await page.evaluate(async () => (await import("/src/utils/fonts.ts")).getFontFaceCss());
  let pdfBytes;
  await page.route("**/generate-pdf", async route => {
    const payload = route.request().postDataJSON();
    await pdfPage.setContent(`<!doctype html><html><head><base href="${baseURL}/"><style>
      ${fonts}\n${payload.styles}
      html,body { margin:0; padding:0; }
      body { width:calc(210mm - ${2 * payload.margin}px); }
      </style></head><body>${payload.content}</body></html>`);
    await pdfPage.evaluate(() => document.fonts.ready);
    pdfBytes = await pdfPage.pdf({ format: "A4", printBackground: true,
      margin: Object.fromEntries(["top","bottom","left","right"].map(k => [k, `${payload.margin}px`])) });
    await route.fulfill({ status: 200, contentType: "application/pdf", body: pdfBytes });
  });
  for (const enabled of [false, true]) {
    for (const withEmptySections of [true, false]) {
      await t.test(`PDF parity: auto=${enabled}, empty sections=${withEmptySections}`, async () => {
        await configure("left-right", enabled, withEmptySections);
        const layout = await read();
        const available = Math.floor((297 * 96 / 25.4 - 64) * 64) / 64;
        assert.equal(layout.breaks.length, layout.pageCount - 1);
        layout.breaks.forEach((top, i) => assert.ok(Math.abs(top - (32 + (i + 1) * available)) < 0.01));
        if (enabled && layout.pageCount === 1) assert.ok(layout.height <= available + 0.001);
        if (enabled && layout.pageCount > 1) {
          assert.equal(layout.scale, 0.9);
          const warning = page.locator('[data-sonner-toast][data-type="warning"]').filter({ hasText: /90%/ });
          await warning.waitFor({ state: "visible" });
          assert.equal(await warning.count(), 1);
          await page.waitForFunction(() => {
            const toast = document.querySelector('[data-sonner-toast][data-type="warning"]');
            if (!toast) return false;
            const rect = toast.getBoundingClientRect();
            return rect.top >= 0 && rect.bottom <= innerHeight &&
              toast.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
          });
        }
        const download = page.waitForEvent("download");
        await page.evaluate(async () => {
          const { exportToPdf } = await import("/src/utils/export.ts");
          await exportToPdf({ elementId: "resume-preview", title: "list-regression", pagePadding: 32 });
        });
        await download;
        const pdf = await getDocument({ data: new Uint8Array(pdfBytes) }).promise;
        assert.equal(pdf.numPages, layout.pageCount, "PDF page count must match the preview");
        const text = [];
        for (let n = 1; n <= pdf.numPages; n++) {
          text.push(...(await (await pdf.getPage(n)).getTextContent()).items.map(item => item.str));
        }
        assert.ok(text.join("").replace(/\s/g, "").includes("技术选型和架构设计"),
          "the last list item must survive export, not be cropped to achieve one page");
        await pdf.destroy();
      });
    }
  }
});
