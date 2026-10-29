import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Run against `wrangler dev --local` after building, so these checks exercise
// Cloudflare's asset routing rather than Vite's development SSR middleware.
const origin = process.env.LANDING_TEST_URL ?? "http://localhost:4311";

for (const locale of ["zh", "en"]) {
  test(`${locale} document is served from the prerendered asset`, async () => {
    const html = await readFile(new URL(`../dist/client/${locale}.html`, import.meta.url), "utf8");
    const response = await fetch(`${origin}/${locale}?source=static-test`, {
      headers: { cookie: `NEXT_LOCALE=${locale === "zh" ? "en" : "zh"}` },
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.equal(await response.text(), html);
    assert.match(html, new RegExp(`<html[^>]+lang="${locale}"`));
    assert.ok(!html.includes("__name("), "inline theme script must be self-contained");
    assert.ok(!html.includes("app-providers"), "landing must not preload editor providers");
    assert.ok(!html.includes("useResumeStore"), "landing must not preload resume data");
    assert.match(html, new RegExp(`rel="canonical" href="https://magicv.art/${locale}"`));
    const head = await fetch(`${origin}/${locale}`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    const canonical = await fetch(`${origin}/${locale}/`, { redirect: "manual" });
    assert.equal(canonical.status, 307);
    assert.equal(new URL(canonical.headers.get("location"), origin).pathname, `/${locale}`);
  });
}

test("versioned landing image is cached and the full PNG is not in the page", async () => {
  const html = await readFile(new URL("../dist/client/zh.html", import.meta.url), "utf8");
  const imagePath = html.match(/src="(\/assets\/editor-1280-[^"]+\.webp)"/)?.[1];
  assert.ok(imagePath);
  assert.ok(!html.includes('src="/web-shot.png"'));
  const image = await fetch(`${origin}${imagePath}`);
  assert.equal(image.status, 200);
  assert.match(image.headers.get("cache-control"), /max-age=31536000.*immutable/);
  assert.match(image.headers.get("content-type"), /image\/webp/);
  assert.ok((await image.arrayBuffer()).byteLength < 100_000);
});

test("dynamic authorization API still executes and remains uncacheable", async () => {
  const response = await fetch(`${origin}/api/orcarouter/exchange`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_request" });
  assert.match(response.headers.get("cache-control"), /no-store/);
  const unknown = await fetch(`${origin}/nonexistent/performance-test`);
  assert.equal(unknown.status, 404, "unknown routes must not become a static SPA fallback");
});

test("search engine verification keeps its literal HTML URL", async () => {
  const path = "/baidu_verify_codeva-us6tyoiVto.html";
  const response = await fetch(`${origin}${path}`, { redirect: "manual" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("location"), null);
  assert.equal(await response.text(), await readFile(new URL(`../public${path}`, import.meta.url), "utf8"));
});
