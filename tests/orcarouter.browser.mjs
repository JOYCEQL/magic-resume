import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { chromium, webkit } from "playwright";

const origin = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const readState = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("ai-config-storage"))?.state ?? { models: [], textModelId: null, pdfModelId: null });
const catalog = [
  { id: "fixture/text-only", name: "Fixture Text", supportsImages: false },
  { id: "fixture/new-vision", name: "Fixture Vision", supportsImages: true },
];

for (const engine of [chromium, webkit]) {
  test(`${engine.name()}: manual discovery stays visible, searches names and retries`, { timeout: 60_000 }, async (t) => {
    const browser = await engine.launch();
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(10000);
    let requests = 0;
    let mode = "success";
    await page.route("**/api/models", async (route) => {
      requests++;
      assert.equal(route.request().postDataJSON().apiKey, "sk-orca-manual-fixture");
      await route.fulfill({ status: mode === "failure" ? 502 : 200,
        json: mode === "failure" ? { code: "upstreamError" } : { models: catalog } });
    });
    await page.goto(`${origin}/app/dashboard/ai?provider=orcarouter`);
    const refresh = page.getByTestId("orca-refresh-models");
    await refresh.waitFor();
    assert.equal(await refresh.isEnabled(), false);
    await page.getByText("授权连接或填写密钥后，获取可用模型。", { exact: true }).waitFor();
    assert.equal(await page.getByTestId("orca-model-dropdown-trigger").count(), 0);
    assert.equal(await page.getByTestId("provider-header").getByRole("button", { name: "授权连接", exact: true }).count(), 1);
    assert.equal(await page.getByTestId("orca-auth-panel").getByTestId("orca-connect").count(), 0);
    await page.getByTestId("orca-api-key-input").fill("sk-orca-manual-fixture");
    assert.equal(requests, 0);
    await refresh.click();
    await page.getByTestId("orca-model-dropdown-trigger").click();
    await page.getByTestId("orca-model-search").fill("Fixture Vision");
    await page.getByTestId("orca-model-option").filter({ hasText: "fixture/new-vision" }).waitFor();
    assert.equal(await page.getByTestId("orca-model-option").count(), 1);
    assert.equal(await page.getByTestId("orca-model-count").innerText(), "2 个模型");
    await page.getByTestId("orca-model-option").click();
    await page.getByTestId("orca-model-dropdown-trigger").click();
    assert.equal(await page.getByTestId("orca-model-option").count(), 2);
    mode = "failure";
    await refresh.click();
    await page.locator('[data-testid="orca-model-selector"][data-source="error"]').waitFor();
    assert.equal(await refresh.innerText(), "重新获取模型列表");
    assert.equal(await page.getByTestId("orca-model-dropdown").count(), 0);
    mode = "success";
    await refresh.click();
    await page.getByTestId("orca-model-dropdown-trigger").click();
    assert.equal(await page.getByTestId("orca-model-option").count(), 2);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.getByRole("button", { name: "清除密钥", exact: true }).click();
    assert.equal(await refresh.isVisible(), true);
    assert.equal(await refresh.isEnabled(), false);
  });
}

for (const engine of [chromium, webkit]) {
  test(`${engine.name()}: mocked OAuth login, catalog, assignments and persistence`, { timeout: 60_000 }, async (t) => {
    const browser = await engine.launch();
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let challenge;
    let exchanges = 0;
    await page.route("https://www.orcarouter.ai/auth?**", async (route) => {
      const auth = new URL(route.request().url());
      const callback = new URL(auth.searchParams.get("callback_url"));
      assert.equal(callback.origin, new URL(origin).origin);
      assert.equal(callback.pathname, "/auth/orcarouter/callback");
      assert.equal(auth.searchParams.get("code_challenge_method"), "S256");
      assert.equal(auth.searchParams.get("scope"), "api");
      assert.equal(auth.searchParams.get("ref"), "ref_54dd337f5d343624a551");
      assert.ok(auth.searchParams.get("state"));
      challenge = auth.searchParams.get("code_challenge");
      callback.searchParams.set("code", "review-code");
      callback.searchParams.set("state", auth.searchParams.get("state"));
      await route.fulfill({ contentType: "text/html", body: `<script>location.replace(${JSON.stringify(callback.href)})</script>` });
    });
    await page.route("**/api/orcarouter/exchange", async (route) => {
      exchanges++;
      const body = route.request().postDataJSON();
      assert.equal(body.code, "review-code");
      assert.equal(body.code_challenge_method, "S256");
      assert.equal(createHash("sha256").update(body.code_verifier).digest("base64url"), challenge);
      await route.fulfill({ json: { key: "sk-orca-browser-fixture", scope: "api" } });
    });
    let responseMode = "success";
    await page.route("**/api/ai-test", async (route) => {
      const request = route.request().postDataJSON();
      assert.deepEqual(Object.keys(request), ["connection"]);
      assert.equal(request.connection.provider, "orcarouter");
      await route.fulfill({ status: 402, json: {
        code: "upstreamError",
        upstream: { status: 402, code: "insufficient_user_quota", message: "Insufficient credits" },
      } });
    });
    await page.route("**/api/models", async (route) => {
      const request = route.request().postDataJSON();
      assert.equal(request.provider, "orcarouter");
      assert.equal(request.modalities, "text");
      assert.equal(request.apiKey, "sk-orca-browser-fixture");
      await route.fulfill({ status: responseMode === "failure" ? 502 : 200,
        json: responseMode === "failure" ? { code: "upstreamError" } : { models: responseMode === "empty" ? [] : catalog } });
    });
    await page.goto(`${origin}/app/dashboard/ai`);
    await page.getByRole("button", { name: /^OrcaRouter/ }).click();
    assert.equal(await page.getByRole("link", { name: "获取密钥", exact: true }).getAttribute("href"), "https://www.orcarouter.ai/ref/ref_54dd337f5d343624a551");
    assert.equal(await page.getByTestId("orca-model-option").count(), 0);
    // Keep discovery visible before connecting, and explain why it is disabled.
    assert.equal(await page.getByTestId("orca-refresh-models").isVisible(), true);
    assert.equal(await page.getByTestId("orca-refresh-models").isEnabled(), false);
    await page.getByTestId("orca-connect").click();
    await page.waitForURL("**/app/dashboard/ai?provider=orcarouter");
    assert.equal(exchanges, 1);
    assert.equal(await page.evaluate(() => sessionStorage.getItem("orcarouter-pkce-attempt")), null);
    await page.waitForFunction(() => document.querySelector('[data-testid="orca-api-key-input"]')?.value === "sk-orca-browser-fixture");
    assert.equal(await page.getByTestId("orca-api-key-input").getAttribute("type"), "password");
    assert.equal(await page.getByTestId("orca-api-key-input").isVisible(), true);
    assert.equal(await page.getByTestId("provider-header").getByRole("button", { name: "重新授权", exact: true }).count(), 1);
    await page.getByRole("button", { name: "显示密钥", exact: true }).click();
    assert.equal(await page.getByTestId("orca-api-key-input").getAttribute("type"), "text");
    assert.equal(await page.getByRole("link", { name: "管理已授权应用", exact: true }).getAttribute("href"), "https://www.orcarouter.ai/console/authorized-apps");
    let state = await readState(page);
    assert.equal(state.models[0].authMethod, "oauth");
    assert.equal(state.models[0].model, "");
    assert.equal(state.textModelId, null);
    // OAuth should discover automatically, including after leaving the provider.
    await page.locator('[data-testid="orca-model-selector"][data-source="live"]').waitFor();
    await page.getByRole("button", { name: /^DeepSeek/ }).click();
    await page.getByRole("button", { name: /^OrcaRouter/ }).click();
    assert.equal(await page.getByTestId("orca-api-key-input").getAttribute("type"), "password");
    await page.locator('[data-testid="orca-model-selector"][data-source="live"]').waitFor();
    await page.getByTestId("orca-model-dropdown-trigger").click();
    assert.equal(await page.getByTestId("orca-model-option").count(), 2);
    await page.getByTestId("orca-model-option").filter({ hasText: "fixture/text-only" }).click();
    assert.match(await page.getByTestId("orca-model-dropdown-trigger").innerText(), /fixture\/text-only/);
    state = await readState(page);
    assert.equal(state.models.find((m) => m.id === state.textModelId).model, "fixture/text-only");
    const textCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "fixture/text-only", exact: true }) });
    await textCard.getByRole("button", { name: "检测连接", exact: true }).click();
    await textCard.getByRole("status").filter({ hasText: "HTTP 402 · insufficient_user_quota · Insufficient credits" }).waitFor();
    assert.equal(await textCard.getByText("模型服务暂时不可用，请稍后重试", { exact: true }).count(), 0);
    await page.getByTestId("orca-model-dropdown-trigger").click();
    await page.getByTestId("orca-model-option").filter({ hasText: "fixture/new-vision" }).click();
    await page.getByRole("combobox", { name: "选择 PDF 解析模型" }).click();
    assert.equal(await page.getByRole("option", { name: "Fixture Text", exact: true }).count(), 0);
    await page.getByRole("option", { name: "Fixture Vision", exact: true }).click();
    state = await readState(page);
    assert.equal(state.models.find((m) => m.id === state.pdfModelId).supportsPdf, true);
    const assignments = { text: state.textModelId, pdf: state.pdfModelId };
    await page.reload();
    await page.getByTestId("orca-auth-panel").waitFor();
    assert.equal(await page.getByTestId("orca-api-key-input").inputValue(), "sk-orca-browser-fixture");
    assert.match(await page.getByTestId("orca-model-dropdown-trigger").innerText(), /fixture\/new-vision/);
    assert.match(await page.getByRole("combobox", { name: "选择 PDF 解析模型" }).innerText(), /Fixture Vision/);
    state = await readState(page);
    assert.deepEqual({ text: state.textModelId, pdf: state.pdfModelId }, assignments);
    assert.equal(state.models.find((m) => m.id === state.textModelId).model, "fixture/new-vision");
    responseMode = "failure";
    await page.getByTestId("orca-refresh-models").click();
    await page.locator('[data-testid="orca-model-selector"][data-source="error"]').waitFor();
    assert.equal(await page.getByTestId("orca-model-option").count(), 0);
    assert.equal((await readState(page)).textModelId, assignments.text);
    responseMode = "empty";
    await page.getByTestId("orca-refresh-models").click();
    await page.getByTestId("orca-model-dropdown-trigger").click();
    assert.equal(await page.getByTestId("orca-model-option").count(), 0);
    assert.equal((await readState(page)).pdfModelId, assignments.pdf);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
  });
}

for (const engine of [chromium, webkit]) {
  test(`${engine.name()}: rejected credentials require reauthentication and replacement restores assignments`, { timeout: 60_000 }, async (t) => {
    const browser = await engine.launch();
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let rejectCatalog = false;
    await page.route("**/api/models", (route) => route.fulfill({
      status: rejectCatalog ? 401 : 200,
      json: rejectCatalog ? { code: "authenticationFailed" } : { models: catalog },
    }));
    await page.route("**/api/ai-test", (route) => route.fulfill({
      status: 401,
      json: { code: "authenticationFailed", upstream: { status: 401, message: "Invalid API key" } },
    }));
    await page.goto(`${origin}/app/dashboard/ai?provider=orcarouter`);
    const keyInput = page.getByTestId("orca-api-key-input");
    await keyInput.fill("sk-orca-rejected-fixture");
    await page.getByTestId("orca-refresh-models").click();
    await page.getByTestId("orca-model-dropdown-trigger").click();
    await page.getByTestId("orca-model-option").filter({ hasText: "fixture/new-vision" }).click();
    await page.getByRole("combobox", { name: "选择 PDF 解析模型" }).click();
    await page.getByRole("option", { name: "Fixture Vision", exact: true }).click();
    const assigned = await readState(page);
    const card = page.locator("article").filter({ has: page.getByRole("heading", { name: "fixture/new-vision", exact: true }) });
    await card.getByRole("button", { name: "检测连接", exact: true }).click();
    await page.getByTestId("orca-needs-reauth").waitFor();
    assert.equal(await page.getByText("需要重新登录", { exact: true }).count(), 2);
    let state = await readState(page);
    assert.ok(state.models.filter((model) => model.provider === "orcarouter").every((model) => model.needsReauth));
    assert.deepEqual([state.textModelId, state.pdfModelId], [assigned.textModelId, assigned.pdfModelId]);
    await keyInput.fill("sk-orca-replacement-fixture");
    await page.getByTestId("orca-needs-reauth").waitFor({ state: "hidden" });
    state = await readState(page);
    assert.ok(state.models.filter((model) => model.provider === "orcarouter").every((model) => !model.needsReauth));
    assert.deepEqual([state.textModelId, state.pdfModelId], [assigned.textModelId, assigned.pdfModelId]);
    rejectCatalog = true;
    await page.getByTestId("orca-refresh-models").click();
    await page.getByTestId("orca-needs-reauth").waitFor();
    assert.equal(await page.getByTestId("orca-model-option").count(), 0);
    rejectCatalog = false;
    await keyInput.fill("sk-orca-final-fixture");
    await page.getByTestId("orca-refresh-models").click();
    await page.getByTestId("orca-model-dropdown-trigger").click();
    assert.equal(await page.getByTestId("orca-model-option").count(), 2);
    assert.deepEqual(errors, []);
  });
}

for (const engine of [chromium, webkit]) {
  test(`${engine.name()}: denied and invalid callbacks never exchange credentials`, { timeout: 60_000 }, async (t) => {
    const browser = await engine.launch();
    t.after(() => browser.close());
    for (const mode of ["wrong-state", "missing-state", "denied", "expired"]) {
      const page = await browser.newPage();
      let exchanges = 0;
      await page.route("**/api/orcarouter/exchange", async (route) => {
        exchanges++;
        await route.fulfill({ status: 500, json: {} });
      });
      await page.route("https://www.orcarouter.ai/auth?**", async (route) => {
        const auth = new URL(route.request().url());
        const callback = new URL(auth.searchParams.get("callback_url"));
        callback.searchParams.set("state", mode === "wrong-state" ? "wrong" : auth.searchParams.get("state"));
        if (mode === "missing-state") callback.searchParams.delete("state");
        callback.searchParams.set(mode === "denied" ? "error" : "code", mode === "denied" ? "access_denied" : "fixture-code");
        await route.fulfill({ contentType: "text/html", body: `<script>location.replace(${JSON.stringify(callback.href)})</script>` });
      });
      if (mode === "expired") await page.addInitScript(() => {
        if (location.pathname === "/auth/orcarouter/callback") {
          const pending = JSON.parse(sessionStorage.getItem("orcarouter-pkce-attempt"));
          pending.createdAt = Date.now() - 600001;
          sessionStorage.setItem("orcarouter-pkce-attempt", JSON.stringify(pending));
        }
      });
      await page.goto(`${origin}/app/dashboard/ai`);
      await page.getByRole("button", { name: /^OrcaRouter/ }).click();
      if (mode === "denied") {
        await page.getByTestId("orca-api-key-input").fill("sk-orca-preserved-manual-fixture");
      }
      await page.getByTestId("orca-connect").click();
      await page.getByRole("heading", { name: "未能完成登录" }).waitFor();
      assert.equal(exchanges, 0);
      assert.equal(new URL(page.url()).search, "");
      assert.equal(await page.evaluate(() => sessionStorage.getItem("orcarouter-pkce-attempt")), null);
      const state = await readState(page);
      if (mode === "denied") {
        assert.equal(state.models[0].apiKey, "sk-orca-preserved-manual-fixture");
        assert.equal(state.models[0].authMethod, "api-key");
      } else {
        assert.ok(state.models.every((model) => !model.apiKey));
      }
      await page.getByRole("link", { name: "返回 AI 设置" }).click();
      await page.getByTestId("orca-connect").waitFor();
      assert.equal(await page.getByTestId("orca-connect").isEnabled(), true);
      await page.close();
    }
  });
}
