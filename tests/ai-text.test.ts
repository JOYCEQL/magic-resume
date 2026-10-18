import test from "node:test";
import assert from "node:assert/strict";
import { AI_PROVIDERS, createModelProfile, type AIProtocol } from "../src/config/ai-models";
import { handleTextRequest } from "../src/lib/server/ai-text";
import { buildAIRequest, readStreamDelta, textDeltas } from "../src/lib/server/ai-provider";

function payload(protocol: AIProtocol, text: string) {
  if (protocol === "gemini") return { candidates: [{ finishReason: "STOP", content: { parts: [{ text }] } }] };
  if (protocol === "anthropic") return { stop_reason: "end_turn", content: [{ type: "text", text }] };
  if (protocol === "responses") return { status: "completed", output: [{ type: "message", content: [{ type: "output_text", text }] }] };
  return { choices: [{ finish_reason: "stop", message: { content: text } }] };
}
for (const provider of AI_PROVIDERS) {
  test(`${provider}: same model configuration supports text testing and grammar`, async () => {
    const connection = { ...createModelProfile(provider, "test"), apiKey: "test-key", model: "test-model" };
    for (const task of ["test", "grammar"] as const) {
      const request = new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ connection, content: "简历正文" }) });
      const response = await handleTextRequest(request, task, (async (_url, options) => {
        assert.ok((String(_url) + String(options?.body)).includes("test-model"));
        assert.equal(options?.redirect, "manual");
        const upstream = JSON.parse(String(options?.body));
        if (provider === "deepseek" && task === "grammar") assert.deepEqual(upstream.thinking, { type: "disabled" });
        else assert.equal(upstream.thinking, undefined);
        return Response.json(payload(connection.protocol, task === "test" ? "OK" : '{"errors":[]}'));
      }) as typeof fetch);
      assert.equal(response.status, 200);
      const body = await response.json();
      if (task === "test") assert.equal(body.ok, true);
      else assert.deepEqual(JSON.parse(body.choices[0].message.content), { errors: [] });
    }
  });
}

test("Responses stream setup and extraction preserve Chinese across byte boundaries", async () => {
  const connection = { ...createModelProfile("openai", "test"), apiKey: "test", model: "test", protocol: "responses" as const };
  const built = buildAIRequest(connection, { system: "system", text: "text", stream: true });
  assert.equal(built.body.stream, true);
  assert.ok(built.url.endsWith("/responses"));
  const raw = 'event: response.output_text.delta\r\ndata: {"type":"response.output_text.delta","delta":"你好"}\r\n\r\ndata: {"type":"response.output_text.delta","delta":"世界"}';
  const bytes = new TextEncoder().encode(raw);
  const stream = new ReadableStream<Uint8Array>({ start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); } });
  const chunks: string[] = [];
  for await (const delta of textDeltas(stream, "responses")) chunks.push(delta);
  assert.equal(chunks.join(""), "你好世界");
});

test("all streaming adapters ignore reasoning and report truncation", () => {
  assert.equal(readStreamDelta("chat-completions", { choices: [{ delta: { reasoning_content: "private", content: "visible" } }] }), "visible");
  assert.equal(readStreamDelta("anthropic", { delta: { type: "thinking_delta", thinking: "private" } }), "");
  assert.equal(readStreamDelta("anthropic", { delta: { type: "text_delta", text: "visible" } }), "visible");
  assert.equal(readStreamDelta("gemini", { candidates: [{ content: { parts: [{ thought: true, text: "private" }, { text: "visible" }] } }] }), "visible");
  assert.throws(() => readStreamDelta("responses", { type: "response.incomplete" }), /truncatedOutput/);
  assert.throws(() => readStreamDelta("chat-completions", { choices: [{ finish_reason: "length" }] }), /truncatedOutput/);
  assert.throws(() => readStreamDelta("anthropic", { type: "error", error: {} }), /upstreamError/);
});

test("polish returns incremental plain text from the configured provider", async () => {
  const connection = { ...createModelProfile("qwen", "test"), apiKey: "test" };
  const request = new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ connection, content: "original", customInstructions: "Keep dates" }) });
  const response = await handleTextRequest(request, "polish", (async (_url, options) => {
    const body = JSON.parse(String(options?.body));
    assert.equal(body.stream, true);
    assert.ok(body.messages[0].content.includes("Keep dates"));
    return new Response('data: {"choices":[{"delta":{"content":"Updated "}}]}\n\ndata: {"choices":[{"delta":{"content":"resume"}}]}\n\ndata: [DONE]\n\n');
  }) as typeof fetch);
  assert.equal(await response.text(), "Updated resume");
});

test("legacy DeepSeek requests disable thinking only for grammar", async () => {
  for (const task of ["grammar", "polish", "test"] as const) {
    const request = new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify({ modelType: "deepseek", apiKey: "legacy-key", content: "original" }),
    });
    const response = await handleTextRequest(request, task, (async (url, options) => {
      const body = JSON.parse(String(options?.body));
      assert.equal(String(url), "https://api.deepseek.com/v1/chat/completions");
      assert.equal(body.model, "deepseek-flash");
      if (task === "grammar") assert.deepEqual(body.thinking, { type: "disabled" });
      else assert.equal(body.thinking, undefined);
      if (task === "polish") {
        assert.equal(body.stream, true);
        return new Response('data: {"choices":[{"delta":{"content":"Updated resume"}}]}\n\ndata: [DONE]\n\n');
      }
      return Response.json(payload("chat-completions", task === "test" ? "OK" : '{"errors":[]}'));
    }) as typeof fetch);
    assert.equal(response.status, 200);
    if (task === "polish") assert.equal(await response.text(), "Updated resume");
    else if (task === "test") assert.deepEqual(await response.json(), { ok: true });
    else assert.deepEqual(JSON.parse((await response.json()).choices[0].message.content), { errors: [] });
  }
});

test("configured DeepSeek Pro polish keeps the selected model and default thinking", async () => {
  const connection = { ...createModelProfile("deepseek", "pro"), apiKey: "key", model: "deepseek-v4-pro" };
  const response = await handleTextRequest(new Request("http://localhost/api", {
    method: "POST",
    body: JSON.stringify({ connection, content: "original" }),
  }), "polish", (async (_url, options) => {
    const body = JSON.parse(String(options?.body));
    assert.equal(body.model, "deepseek-v4-pro");
    assert.equal(body.thinking, undefined);
    return new Response('data: {"choices":[{"delta":{"reasoning_content":"Planning changes"}}]}\n\ndata: {"choices":[{"delta":{"content":"Updated"}}]}\n\ndata: [DONE]\n\n');
  }) as typeof fetch);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "Updated");
});

test("DeepSeek image parsing requests retain their default thinking behavior", () => {
  const connection = { ...createModelProfile("deepseek", "flash"), apiKey: "key" };
  const built = buildAIRequest(connection, { system: "Parse resume", text: "Read page", images: ["data:image/png;base64,AA=="], json: true });
  assert.equal("thinking" in built.body, false);
});
