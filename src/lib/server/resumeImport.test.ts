import assert from "node:assert/strict";
import test from "node:test";

import {
  DEEPSEEK_VISION_MODEL,
  ResumeImportUpstreamError,
  buildDeepSeekVisionPayload,
  normalizeResumeImportModelType,
  parseResumeJson,
  requestDeepSeekResumeImport,
} from "./resumeImport";

const images = [
  "data:image/jpeg;base64,first-page",
  "data:image/jpeg;base64,second-page",
];

const makeDeepSeekResponse = (content: unknown, init?: ResponseInit) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content } }],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
      ...init,
    },
  );

test("normalizeResumeImportModelType defaults missing values to Gemini", () => {
  assert.equal(normalizeResumeImportModelType(undefined), "gemini");
  assert.equal(normalizeResumeImportModelType(null), "gemini");
  assert.equal(normalizeResumeImportModelType(""), "gemini");
});

test("normalizeResumeImportModelType accepts Gemini and DeepSeek", () => {
  assert.equal(normalizeResumeImportModelType("gemini"), "gemini");
  assert.equal(normalizeResumeImportModelType("deepseek"), "deepseek");
});

test("normalizeResumeImportModelType rejects unsupported providers", () => {
  assert.equal(normalizeResumeImportModelType("openai"), null);
  assert.equal(normalizeResumeImportModelType("doubao"), null);
  assert.equal(normalizeResumeImportModelType(123), null);
});

test("buildDeepSeekVisionPayload uses the fixed vision model", () => {
  const payload = buildDeepSeekVisionPayload({ images });

  assert.equal(payload.model, DEEPSEEK_VISION_MODEL);
  assert.equal(payload.model, "deepseek-v4-flash-vision-exp");
});

test("DeepSeek payload keeps the system message text-only", () => {
  const payload = buildDeepSeekVisionPayload({ images, locale: "en" });
  const systemMessage = payload.messages.find((message) => message.role === "system");

  assert.ok(systemMessage);
  assert.ok(typeof systemMessage.content === "string");
  assert.match(systemMessage.content, /English/);
});

test("DeepSeek user content starts with the import instruction and maps every image", () => {
  const payload = buildDeepSeekVisionPayload({ images });
  const userMessage = payload.messages.find((message) => message.role === "user");

  assert.ok(userMessage);
  assert.ok(Array.isArray(userMessage.content));
  assert.deepEqual(userMessage.content[0], {
    type: "text",
    text: "请识别以下简历页面图片中的信息，并严格按 JSON 结构输出。",
  });
  assert.deepEqual(userMessage.content.slice(1), images.map((url) => ({
    type: "image_url",
    image_url: { url, detail: "original" },
  })));
});

test("DeepSeek payload uses disabled thinking, JSON output, and import limits", () => {
  const payload = buildDeepSeekVisionPayload({ images });

  assert.deepEqual(payload.thinking, { type: "disabled" });
  assert.equal(payload.temperature, 0.2);
  assert.equal(payload.max_tokens, 8192);
  assert.deepEqual(payload.response_format, { type: "json_object" });
});

test("parseResumeJson parses plain, fenced, and surrounding-text JSON", () => {
  const resume = { title: "Resume", skills: ["TypeScript"] };

  assert.deepEqual(parseResumeJson(JSON.stringify(resume)), resume);
  assert.deepEqual(parseResumeJson(`\`\`\`json\n${JSON.stringify(resume)}\n\`\`\``), resume);
  assert.deepEqual(parseResumeJson(`Here is the resume:\n${JSON.stringify(resume)}\nThank you.`), resume);
});

test("parseResumeJson returns null for empty content and invalid JSON", () => {
  assert.equal(parseResumeJson(""), null);
  assert.equal(parseResumeJson("not JSON"), null);
  assert.equal(parseResumeJson("```json\n{invalid}\n```"), null);
});

test("requestDeepSeekResumeImport returns the parsed resume object", async () => {
  let requestBody: Record<string, unknown> | undefined;
  const fetcher: typeof fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return makeDeepSeekResponse(JSON.stringify({ title: "Imported resume" }));
  };

  const resume = await requestDeepSeekResumeImport(
    { apiKey: "deepseek-key", images },
    fetcher,
  );

  assert.deepEqual(resume, { title: "Imported resume" });
  assert.equal(requestBody?.model, DEEPSEEK_VISION_MODEL);
});

test("requestDeepSeekResumeImport prepares the proxy before fetch", async () => {
  const events: string[] = [];
  const fetcher: typeof fetch = async () => {
    events.push("fetch");
    return makeDeepSeekResponse(JSON.stringify({ title: "Imported resume" }));
  };

  await requestDeepSeekResumeImport(
    { apiKey: "deepseek-key", images },
    fetcher,
    () => events.push("proxy"),
  );

  assert.deepEqual(events, ["proxy", "fetch"]);
});

test("requestDeepSeekResumeImport keeps upstream details server-side", async () => {
  const fetcher: typeof fetch = async () =>
    new Response(JSON.stringify({
      error: { message: "Invalid API key", code: "invalid_api_key" },
    }), {
      status: 401,
      statusText: "Unauthorized",
      headers: { "Content-Type": "application/json" },
    });

  await assert.rejects(
    requestDeepSeekResumeImport({ apiKey: "bad-key", images }, fetcher),
    (error: unknown) => {
      assert.ok(error instanceof ResumeImportUpstreamError);
      assert.equal(error.status, 401);
      assert.equal(error.message, "DeepSeek API request failed");
      assert.equal(error.code, "invalid_api_key");
      assert.equal(error.details, "Invalid API key");
      return true;
    },
  );
});

test("requestDeepSeekResumeImport maps an invalid 200 response body to status 502", async () => {
  const fetcher: typeof fetch = async () => new Response("not JSON", { status: 200 });

  await assert.rejects(
    requestDeepSeekResumeImport({ apiKey: "deepseek-key", images }, fetcher),
    (error: unknown) => {
      assert.ok(error instanceof ResumeImportUpstreamError);
      assert.equal(error.status, 502);
      return true;
    },
  );
});

test("requestDeepSeekResumeImport maps missing content to status 502", async () => {
  const fetcher: typeof fetch = async () =>
    new Response(JSON.stringify({ choices: [] }), { status: 200 });

  await assert.rejects(
    requestDeepSeekResumeImport({ apiKey: "deepseek-key", images }, fetcher),
    (error: unknown) => {
      assert.ok(error instanceof ResumeImportUpstreamError);
      assert.equal(error.status, 502);
      return true;
    },
  );
});

test("requestDeepSeekResumeImport maps unparseable content to status 502", async () => {
  const fetcher: typeof fetch = async () => makeDeepSeekResponse("not JSON");

  await assert.rejects(
    requestDeepSeekResumeImport({ apiKey: "deepseek-key", images }, fetcher),
    (error: unknown) => {
      assert.ok(error instanceof ResumeImportUpstreamError);
      assert.equal(error.status, 502);
      return true;
    },
  );
});

test("requestDeepSeekResumeImport maps connection failures to 502", async () => {
  const networkError = Object.assign(
    new TypeError("fetch failed"),
    {
      cause: Object.assign(new Error("connect EACCES"), {
        code: "EACCES",
      }),
    },
  );

  const fetcher: typeof fetch = async () => {
    throw networkError;
  };

  await assert.rejects(
    requestDeepSeekResumeImport(
      { apiKey: "deepseek-key", images },
      fetcher,
      () => undefined,
    ),
    (error: unknown) => {
      assert.ok(error instanceof ResumeImportUpstreamError);
      assert.equal(error.status, 502);
      assert.equal(error.message, "Unable to reach DeepSeek API");
      assert.equal(error.code, "network_error");
      assert.equal(error.cause, networkError);
      return true;
    },
  );
});
