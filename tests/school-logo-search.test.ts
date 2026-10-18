import test from "node:test";
import assert from "node:assert/strict";
import { createSchoolLogoHandler } from "../src/lib/server/school-logos";
import { createSchoolLogoSearch } from "../src/utils/schoolLogoSearch";

const item = { id: 8266, zh_name: "浙江大学", en_name: "Zhejiang University", cn_country: "中国", dir: "uni_logo\\ur\\ur_zgdx\\ZtZmtLNQ.png" };
const upstream = () => Response.json({ result_list: [item], total_page: [1, 2] });
const request = (query = "浙江大学", page = 1, signal?: AbortSignal) => new Request(`http://localhost/api/school-logos?${new URLSearchParams({ q: query, page: String(page) })}`, { signal });

test("school search adapts upstream paths, pagination and required request parameters", async () => {
  let body: any;
  const handler = createSchoolLogoHandler(async (url, options) => {
    assert.equal(url, "https://universitylogos.top/superone/uni_logos");
    assert.equal(options.method, "POST");
    assert.equal(new Headers(options.headers).get("X-Requested-With"), "XMLHttpRequest");
    body = JSON.parse(options.body as string);
    return upstream();
  });
  const response = await handler(request());
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.schools[0].src, "https://universitylogos.top/uni_logo/ur/ur_zgdx/ZtZmtLNQ.png");
  assert.equal(result.schools[0].country, "中国");
  assert.equal(result.hasNext, true);
  assert.equal(body.page_size, 12);
  assert.deepEqual(body.total_page, ["搜索校徽"]);
  assert.match(response.headers.get("Cache-Control")!, /max-age=300/);
});

test("invalid searches never contact upstream", async () => {
  let calls = 0;
  const handler = createSchoolLogoHandler(async () => { calls++; return upstream(); });
  for (const [query, page] of [["", 1], ["北", 1], ["x".repeat(101), 1], ["北京大学", 0], ["Harvard", 1.5], ["Harvard", 10001]] as const)
    assert.equal((await handler(request(query, page))).status, 400);
  assert.equal(calls, 0);
});

test("duplicate requests share a fetch; canceling one waiter preserves the other", async () => {
  let calls = 0;
  let release!: () => void;
  let signal!: AbortSignal;
  const handler = createSchoolLogoHandler(async (_, options) => {
    calls++;
    signal = options.signal!;
    await new Promise<void>(resolve => { release = resolve; });
    return upstream();
  });
  const controller = new AbortController();
  const first = handler(request("浙江大学", 1, controller.signal));
  const second = handler(request());
  controller.abort();
  assert.equal((await first).status, 499);
  assert.equal(signal.aborted, false);
  release();
  assert.equal((await second).status, 200);
  assert.equal((await handler(request())).status, 200);
  assert.equal(calls, 1);
});

test("last waiter cancellation aborts upstream and permits a fresh request", async () => {
  let calls = 0;
  let signal!: AbortSignal;
  const handler = createSchoolLogoHandler(async (_, options) => {
    calls++;
    signal = options.signal!;
    if (calls === 1) await new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason), { once: true }));
    return upstream();
  });
  const controller = new AbortController();
  const pending = handler(request("浙江大学", 1, controller.signal));
  controller.abort();
  assert.equal((await pending).status, 499);
  assert.equal(signal.aborted, true);
  assert.equal((await handler(request())).status, 200);
  assert.equal(calls, 2);
});

test("server cache expires and remains bounded under many distinct queries", async () => {
  let clock = 0;
  let calls = 0;
  const handler = createSchoolLogoHandler(async () => { calls++; return upstream(); }, () => clock);
  await handler(request());
  await handler(request());
  assert.equal(calls, 1);
  clock = 10 * 60 * 1000 + 1;
  await handler(request());
  assert.equal(calls, 2);
  for (let i = 0; i < 65; i++) await handler(request(`school ${i}`));
  const before = calls;
  await handler(request("school 64"));
  assert.equal(calls, before);
  await handler(request());
  assert.equal(calls, before + 1, "oldest cache entries are evicted");
});

test("timeouts terminate requests and failures are not cached or automatically retried", async () => {
  let calls = 0;
  const handler = createSchoolLogoHandler(async (_, options) => {
    calls++;
    if (calls > 1) return upstream();
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 1000);
      options.signal!.addEventListener("abort", () => { clearTimeout(timer); reject(options.signal!.reason); }, { once: true });
    });
    return upstream();
  }, Date.now, 10);
  const failed = await handler(request());
  assert.equal(failed.status, 504);
  assert.equal(failed.headers.get("Cache-Control"), "no-store");
  assert.equal(calls, 1);
  assert.equal((await handler(request())).status, 200);
  assert.equal(calls, 2);
});

test("upstream work has a concurrency limit", async () => {
  let calls = 0;
  const handler = createSchoolLogoHandler(async (_, options) => {
    calls++;
    await new Promise((_, reject) => options.signal!.addEventListener("abort", () => reject(options.signal!.reason), { once: true }));
    return upstream();
  });
  const controllers = Array.from({ length: 16 }, () => new AbortController());
  const pending = controllers.map((controller, i) => handler(request(`school ${i}`, 1, controller.signal)));
  assert.equal((await handler(request("another school"))).status, 503);
  assert.equal(calls, 16);
  controllers.forEach(controller => controller.abort());
  await Promise.all(pending);
});

test("unsafe paths and duplicates are filtered; malformed and oversized payloads fail", async () => {
  const handler = createSchoolLogoHandler(async () => Response.json({
    result_list: [item, item, { ...item, id: 2, dir: "https://evil.example/logo.png" }, { ...item, id: 3, dir: "uni_logo/../logo.png" }], total_page: [1],
  }));
  assert.equal((await (await handler(request())).json()).schools.length, 1);
  for (const response of [Response.json({ bad: true }), new Response("x".repeat(128 * 1024 + 1)), new Response("error", { status: 500 })]) {
    const invalid = createSchoolLogoHandler(async () => response);
    assert.equal((await invalid(request())).status, 502);
  }
});

test("client cache normalizes queries, separates pages, expires and skips short inputs", async () => {
  let calls = 0;
  let clock = 0;
  const search = createSchoolLogoSearch((async url => {
    calls++;
    return Response.json({ schools: [], page: Number(new URL(String(url), "http://localhost").searchParams.get("page")), hasNext: false });
  }) as typeof fetch, () => clock);
  const signal = new AbortController().signal;
  await search("H", 1, signal);
  assert.equal(calls, 0);
  await search(" Harvard ", 1, signal);
  await search("harvard", 1, signal);
  assert.equal(calls, 1);
  await search("Harvard", 2, signal);
  assert.equal(calls, 2);
  clock = 5 * 60 * 1000 + 1;
  await search("Harvard", 1, signal);
  assert.equal(calls, 3);
  for (let i = 0; i < 41; i++) await search(`school ${i}`, 1, signal);
  const before = calls;
  await search("school 40", 1, signal);
  assert.equal(calls, before);
  await search("Harvard", 1, signal);
  assert.equal(calls, before + 1);
});

test("client failures can be retried, and canceled requests never populate its cache", async () => {
  let calls = 0;
  const controller = new AbortController();
  const search = createSchoolLogoSearch((async () => {
    calls++;
    if (calls === 1) return new Response(null, { status: 502 });
    if (calls === 2) controller.abort();
    return Response.json({ schools: [], page: 1, hasNext: false });
  }) as typeof fetch);
  await assert.rejects(search("Harvard", 1, new AbortController().signal));
  await assert.rejects(search("Harvard", 1, controller.signal));
  await search("Harvard", 1, new AbortController().signal);
  assert.equal(calls, 3);
});
