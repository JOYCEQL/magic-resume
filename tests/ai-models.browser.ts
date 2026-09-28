import assert from "node:assert/strict";
import test from "node:test";
import { mkdir } from "node:fs/promises";
import { chromium, webkit, type Route } from "playwright";

const origin = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const artifacts = "node_modules/.cache/ai-models";
await mkdir(artifacts, { recursive: true });

for (const engine of [chromium, webkit]) {
  test(`${engine.name()}: discover, assign, persist and remove custom models`, { timeout: 90_000 }, async (t) => {
    const browser = await engine.launch();
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let mode: "success" | "failure" | "delayed" = "success";
    let delayed: Route | undefined;
    let modelRequests = 0;
    await page.route("**/api/models", async (route) => {
      modelRequests++;
      const body = route.request().postDataJSON();
      assert.equal(body.provider, "openai");
      assert.ok(body.apiKey.startsWith("local-test-key"));
      if (mode === "delayed") { delayed = route; return; }
      await route.fulfill({ status: mode === "failure" ? 502 : 200, json: mode === "failure"
        ? { code: "unexpectedCode" }
        : { models: [{ id: "local-review-chat", description: "Local test fixture" }, { id: "gpt-4.1-local-review" }] } });
    });
    await page.route("**/api/ai-test", async (route) => {
      assert.equal(route.request().postDataJSON().connection.model, "local-review-chat");
      await route.fulfill({ json: { ok: true } });
    });
    await page.goto(`${origin}/app/dashboard/ai`);
    const fetchButton = page.getByRole("button", { name: "获取模型列表", exact: true });
    await page.getByRole("button", { name: /OpenAI \/ 兼容服务/ }).click();
    await fetchButton.click();
    await page.getByText("请先填写 API Key", { exact: true }).waitFor();
    assert.equal(modelRequests, 0);
    await page.getByLabel("API Key", { exact: true }).fill("local-test-key");
    await fetchButton.click();
    const addChat = page.getByRole("button", { name: "添加模型 local-review-chat", exact: true });
    await addChat.click();
    await page.getByRole("button", { name: "添加模型 gpt-4.1-local-review", exact: true }).click();
    assert.equal(await addChat.count(), 0);
    const chatCard = page.locator("article").filter({ has: page.getByRole("heading", { name: "local-review-chat", exact: true }) });
    await chatCard.getByRole("button", { name: "检测连接", exact: true }).click();
    await chatCard.getByRole("status").filter({ hasText: "连接正常" }).waitFor();
    await page.getByRole("combobox", { name: "选择文字助手模型" }).click();
    await page.getByRole("option", { name: "gpt-4.1-local-review", exact: true }).click();
    await page.getByRole("combobox", { name: "选择 PDF 解析模型" }).click();
    assert.equal(await page.getByRole("option", { name: "local-review-chat", exact: true }).count(), 0);
    await page.getByRole("option", { name: "gpt-4.1-local-review", exact: true }).click();
    await page.screenshot({ path: `${artifacts}/${engine.name()}-models.png`, fullPage: true });
    await page.reload();
    await page.getByRole("button", { name: "删除模型 gpt-4.1-local-review", exact: true }).waitFor();
    assert.match(await page.getByRole("combobox", { name: "选择文字助手模型" }).innerText(), /gpt-4.1-local-review/);
    assert.match(await page.getByRole("combobox", { name: "选择 PDF 解析模型" }).innerText(), /gpt-4.1-local-review/);
    const deleteVision = page.getByRole("button", { name: "删除模型 gpt-4.1-local-review", exact: true });
    await deleteVision.click();
    await page.getByRole("alertdialog").getByRole("button", { name: "取消", exact: true }).click();
    await deleteVision.waitFor();
    assert.equal(await deleteVision.count(), 1);
    await deleteVision.click();
    await page.getByRole("alertdialog").getByRole("button", { name: "删除模型", exact: true }).click();
    await deleteVision.waitFor({ state: "detached" });
    assert.match(await page.getByRole("combobox", { name: "选择文字助手模型" }).innerText(), /未选择模型/);
    assert.match(await page.getByRole("combobox", { name: "选择 PDF 解析模型" }).innerText(), /未选择模型/);
    await fetchButton.click();
    await page.getByRole("button", { name: "添加模型 gpt-4.1-local-review", exact: true }).waitFor();
    mode = "failure";
    await fetchButton.click();
    await page.getByText("获取模型列表失败", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "添加模型 gpt-4.1-local-review", exact: true }).count(), 0);

    // Credential edits and provider switches must invalidate in-flight results.
    for (const change of ["key", "endpoint", "provider"]) {
      mode = "delayed";
      delayed = undefined;
      const request = page.waitForRequest("**/api/models");
      await fetchButton.click();
      await request;
      await page.waitForFunction(() => document.querySelector<HTMLButtonElement>('button:has(svg.animate-spin)')?.disabled);
      if (change === "key") await page.getByLabel("API Key", { exact: true }).fill("local-test-key-updated");
      if (change === "endpoint") {
        await page.locator("summary").click();
        await page.getByLabel("API Endpoint", { exact: true }).fill("https://example.invalid/v1");
      }
      if (change === "provider") await page.getByRole("button", { name: /^DeepSeek/ }).click();
      assert.ok(delayed);
      await delayed!.fulfill({ json: { models: [{ id: "stale-result-must-not-appear" }] } }).catch(() => {});
      await page.waitForTimeout(150);
      assert.equal(await page.getByText("stale-result-must-not-appear", { exact: true }).count(), 0);
      assert.equal(await fetchButton.isEnabled(), true);
    }
    assert.deepEqual(errors, []);
  });
}
