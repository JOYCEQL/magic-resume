import assert from "node:assert/strict";
import test from "node:test";
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const origin = process.env.LOGO_TEST_URL || "http://127.0.0.1:3000";
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function eventually(check) {
  const deadline = Date.now() + 15_000;
  while (true) {
    try { return await check(); } catch (error) {
      if (Date.now() >= deadline) throw error;
      await pause(50);
    }
  }
}

async function openSearch(page) {
  await page.goto(`${origin}/app/dashboard`);
  const id = await page.evaluate(async () => {
    const { useResumeStore } = await import("/src/store/useResumeStore.ts");
    const store = useResumeStore.getState();
    const id = store.createResume(null);
    const resume = useResumeStore.getState().resumes[id];
    store.updateResume(id, { activeSection: "education", education: resume.education.map(item => ({ ...item, logo: "", logoConfig: undefined })) });
    return id;
  });
  await page.goto(`${origin}/app/workbench/${id}`);
  await page.locator("h3").filter({ hasText: "北京大学", visible: true }).first().click();
  await page.getByRole("button", { name: "Logo 设置", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Logo 设置" });
  await drawer.getByRole("button", { name: "查找学校校徽", exact: true }).click();
  return { id, drawer, input: drawer.getByRole("textbox", { name: "搜索学校", exact: true }) };
}

test("school search debounces, cancels stale work, caches pages, handles IME and retries explicitly", { timeout: 90_000 }, async t => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const png = await readFile(new URL("../public/university.png", import.meta.url));
  const requests = [];
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("https://universitylogos.top/uni_logo/**", route => route.fulfill({ contentType: "image/png", body: png }));
  await page.route("**/api/proxy/image?url=https%3A%2F%2Funiversitylogos.top%2Funi_logo%2Ftest%2F*", route => route.fulfill({ contentType: "image/png", body: png }));
  let failCount = 0;
  await page.route("**/api/school-logos?*", async route => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get("q");
    const pageNumber = Number(url.searchParams.get("page"));
    requests.push({ query, page: pageNumber });
    if (query.startsWith("slow")) await pause(1200);
    if (query === "failure school" && failCount++ === 0) {
      await route.fulfill({ status: 502, json: { error: "unavailable" } });
      return;
    }
    const count = query === "分页大学" ? pageNumber === 1 ? 12 : 3 : query === "浙江大学" ? 3 : 1;
    const schools = Array.from({ length: count }, (_, i) => {
      const name = query === "分页大学" ? `分页大学 ${((pageNumber - 1) * 12) + i + 1}` : query === "浙江大学" && i ? `浙江大学分校 ${i}` : query.startsWith("slow") ? "过时大学" : query;
      return { id: `${pageNumber}-${i}`, name, nameEn: name, country: "中国", src: `https://universitylogos.top/uni_logo/test/${pageNumber}-${i}.png`, source: "https://universitylogos.top/" };
    });
    await route.fulfill({ json: { schools, page: pageNumber, hasNext: query === "分页大学" && pageNumber === 1 } }).catch(() => {});
  });

  const { drawer, input } = await openSearch(page);
  const list = drawer.getByRole("list", { name: "学校校徽候选" });
  await drawer.getByRole("button", { name: "使用北京大学校徽", exact: true }).waitFor();
  const beforeTyping = requests.length;
  await input.fill("");
  await input.pressSequentially("浙江大学", { delay: 40 });
  await drawer.getByRole("button", { name: "使用浙江大学校徽", exact: true }).waitFor();
  assert.deepEqual(requests.slice(beforeTyping), [{ query: "浙江大学", page: 1 }], "rapid input makes only one final query");

  await input.fill("分页大学");
  await drawer.getByRole("button", { name: "使用分页大学 1校徽", exact: true }).waitFor();
  assert.equal(await list.getByRole("listitem").count(), 6);
  const beforePaging = requests.length;
  await drawer.getByRole("button", { name: "下一页", exact: true }).click();
  await drawer.getByRole("button", { name: "使用分页大学 7校徽", exact: true }).waitFor();
  assert.equal(requests.length, beforePaging, "the second group of six uses the existing response");
  assert.equal(await list.getByRole("listitem").count(), 6);
  await drawer.getByRole("button", { name: "下一页", exact: true }).click();
  await drawer.getByRole("button", { name: "使用分页大学 13校徽", exact: true }).waitFor();
  assert.deepEqual(requests.at(-1), { query: "分页大学", page: 2 });
  assert.equal(await list.getByRole("listitem").count(), 3);
  const beforeBack = requests.length;
  await drawer.getByRole("button", { name: "上一页", exact: true }).click();
  await drawer.getByRole("button", { name: "使用分页大学 7校徽", exact: true }).waitFor();
  assert.equal(requests.length, beforeBack, "previous pages are cached");

  const slowRequest = page.waitForRequest(request => request.url().includes("q=slow+school"));
  await input.fill("slow school");
  const slow = await slowRequest;
  await eventually(() => assert.equal(requests.at(-1)?.query, "slow school"));
  const aborted = page.waitForEvent("requestfailed", { predicate: request => request === slow });
  const beforeCachedQuery = requests.length;
  await input.fill("浙江大学");
  await aborted;
  await drawer.getByRole("button", { name: "使用浙江大学校徽", exact: true }).waitFor();
  await pause(1300);
  assert.equal(requests.length, beforeCachedQuery, "a repeated query uses the client cache");
  assert.equal(await drawer.getByRole("button", { name: "使用过时大学校徽", exact: true }).count(), 0, "late results never overwrite the current query");

  const beforeIME = requests.length;
  await input.dispatchEvent("compositionstart");
  await input.fill("清华大学");
  await pause(450);
  assert.equal(requests.length, beforeIME, "IME composition does not launch searches");
  await input.dispatchEvent("compositionend");
  await drawer.getByRole("button", { name: "使用清华大学校徽", exact: true }).waitFor();
  assert.equal(requests.length, beforeIME + 1);

  await input.fill("failure school");
  await drawer.getByRole("alert").waitFor();
  await pause(450);
  assert.equal(failCount, 1, "failed searches do not retry automatically");
  await drawer.getByRole("button", { name: "重试搜索", exact: true }).click();
  await drawer.getByRole("button", { name: "使用failure school校徽", exact: true }).waitFor();
  assert.equal(failCount, 2);

  const beforeShort = requests.length;
  await input.fill("北");
  await pause(450);
  assert.equal(requests.length, beforeShort);
  const closingRequest = page.waitForRequest(request => request.url().includes("q=slow+closing"));
  await input.fill("slow closing");
  const closing = await closingRequest;
  const closingAborted = page.waitForEvent("requestfailed", { predicate: request => request === closing });
  await drawer.getByRole("button", { name: "关闭", exact: true }).click();
  await closingAborted;
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ rapidInputRequests: 1, maxCandidates: 6, secondGroupRequests: 0, cachedQueryRequests: 0, staleRequestsCanceled: true, imeRequestsBeforeCommit: 0 }));
});

test("live school search selects a remote logo and persists compressed pixels", { timeout: 60_000, skip: process.env.SCHOOL_LOGOS_LIVE !== "1" }, async t => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const { id, drawer, input } = await openSearch(page);
  await input.fill("浙江大学");
  const result = drawer.getByRole("button", { name: "使用浙江大学校徽", exact: true });
  await result.waitFor();
  await eventually(async () => assert.ok(await result.locator("img").evaluate(image => image.complete && image.naturalWidth > 0)));
  await result.click();
  const saved = () => page.evaluate(id => JSON.parse(localStorage.getItem("resume-storage")).state.resumes[id].education[0].logo, id);
  await eventually(async () => assert.match(await saved(), /^data:image\/png;base64,/));
  const logo = await saved();
  const size = await page.evaluate(src => new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve([image.naturalWidth, image.naturalHeight]);
    image.src = src;
  }), logo);
  assert.ok(Math.max(...size) <= 200);
  await mkdir("node_modules/.cache/logo-upload", { recursive: true });
  await page.screenshot({ path: "node_modules/.cache/logo-upload/school-search-live.png" });
  await drawer.getByRole("button", { name: "关闭", exact: true }).click();
  await page.reload();
  await page.waitForSelector("#resume-preview");
  assert.equal(await saved(), logo);
  console.log(JSON.stringify({ liveSchool: "浙江大学", savedImageDimensions: size, persisted: true }));
});
