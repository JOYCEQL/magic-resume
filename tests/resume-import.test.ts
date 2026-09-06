import test from "node:test";
import assert from "node:assert/strict";
import {
  PDF_IMPORT_PRESETS,
  MAX_PDF_IMPORT_PAGES,
  MAX_PDF_REQUEST_BYTES,
  type PdfImportProvider,
} from "../src/config/pdf-import";
import {
  buildVisionRequest,
  handleResumeImport,
  readVisionOutput,
  validateImportInput,
} from "../src/lib/server/resume-import";
import {
  parseJsonPayload,
  validateResume,
} from "../src/lib/resume-import-schema";

const image = "data:image/png;base64,aGVsbG8=";
const sample = {
  title: "My resume",
  basic: { name: "张三", email: "a@example.com" },
  education: [],
  experience: [
    {
      company: "Example",
      position: "Engineer",
      date: "2020–2024",
      details: ["Built an app"],
    },
  ],
  projects: [],
  skills: ["TypeScript"],
};
function input(provider: PdfImportProvider = "qwen", overrides = {}) {
  return {
    ...PDF_IMPORT_PRESETS[provider],
    provider,
    apiKey: "test-key",
    model: "vision-test",
    images: [image],
    ...overrides,
  };
}
function request(body: unknown) {
  return new Request("http://localhost/api/resume-import", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

for (const provider of ["qwen", "doubao", "openai", "deepseek"] as const) {
  test(`${provider}: forwards page images and extracts a validated resume`, async () => {
    const response = await handleResumeImport(request(input(provider)), (async (
      url,
      init,
    ) => {
      assert.ok(String(url).endsWith("/chat/completions"));
      assert.equal(
        (init?.headers as Record<string, string>).Authorization,
        "Bearer test-key",
      );
      const body = JSON.parse(String(init?.body));
      assert.equal(body.messages[1].content[1].image_url.url, image);
      assert.equal(body.model, "vision-test");
      assert.equal(body.stream, false);
      return Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: { content: JSON.stringify(sample) },
          },
        ],
      });
    }) as typeof fetch);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.resume.basic.name, "张三");
    assert.deepEqual(data.resume.experience[0].details, ["Built an app"]);
    assert.deepEqual(data.warnings, []);
  });
}

test("Responses uses input_image and skips reasoning output", async () => {
  const response = await handleResumeImport(
    request(
      input("openai", {
        protocol: "responses",
        baseUrl: "https://example.com/v1/chat/completions/",
      }),
    ),
    (async (url, init) => {
      assert.equal(url, "https://example.com/v1/responses");
      const body = JSON.parse(String(init?.body));
      assert.equal(body.input[0].content[1].image_url, image);
      assert.equal(body.input[0].content[1].type, "input_image");
      assert.equal(body.store, false);
      return Response.json({
        status: "completed",
        output: [
          { type: "reasoning", summary: [] },
          {
            type: "message",
            content: [{ type: "output_text", text: JSON.stringify(sample) }],
          },
        ],
      });
    }) as typeof fetch,
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).resume.basic.name, "张三");
});

test("Anthropic uses native auth and image source blocks", async () => {
  const response = await handleResumeImport(
    request(input("anthropic")),
    (async (url, init) => {
      assert.equal(url, "https://api.anthropic.com/v1/messages");
      assert.equal((init?.headers as any)["x-api-key"], "test-key");
      assert.equal((init?.headers as any).Authorization, undefined);
      const body = JSON.parse(String(init?.body));
      assert.deepEqual(body.messages[0].content[0].source, {
        type: "base64",
        media_type: "image/png",
        data: "aGVsbG8=",
      });
      assert.equal(body.max_tokens, 8192);
      return Response.json({
        stop_reason: "end_turn",
        content: [
          { type: "thinking", thinking: "not JSON" },
          { type: "text", text: JSON.stringify(sample) },
        ],
      });
    }) as typeof fetch,
  );
  assert.equal(response.status, 200);
});

test("legacy Gemini payload still works and does not expose key in URL", async () => {
  const response = await handleResumeImport(
    request({ apiKey: "legacy-key", images: [image] }),
    (async (url, init) => {
      assert.equal(
        url,
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      );
      assert.equal((init?.headers as any)["x-goog-api-key"], "legacy-key");
      const body = JSON.parse(String(init?.body));
      assert.equal(body.contents[0].parts[1].inlineData.mimeType, "image/png");
      return Response.json({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [
                { thought: true, text: "reasoning" },
                { text: JSON.stringify(sample) },
              ],
            },
          },
        ],
      });
    }) as typeof fetch,
  );
  assert.equal(response.status, 200);
});

test("no network call for invalid config, images, oversized files or mismatched protocol", async () => {
  for (const [patch, code] of [
    [{ apiKey: "" }, "configRequired"],
    [{ provider: "__proto__" }, "invalidProvider"],
    [{ baseUrl: "file:///etc/passwd" }, "invalidEndpoint"],
    [{ baseUrl: "https://user:pass@example.com" }, "invalidEndpoint"],
    [{ images: ["not an image"] }, "invalidImages"],
    [{ images: Array(MAX_PDF_IMPORT_PAGES + 1).fill(image) }, "tooManyPages"],
    [{ protocol: "anthropic" }, "invalidProvider"],
  ] as const) {
    const response = await handleResumeImport(
      request(input("qwen", patch)),
      (() => {
        assert.fail("must not call provider");
      }) as typeof fetch,
    );
    assert.equal((await response.json()).code, code);
  }
  const response = await handleResumeImport(
    request({ ...input(), padding: "x".repeat(MAX_PDF_REQUEST_BYTES) }),
    (() => {
      assert.fail("must not call provider");
    }) as typeof fetch,
  );
  assert.equal(response.status, 413);
});

test("upstream errors are actionable and do not echo private data", async () => {
  for (const [status, code] of [
    [401, "authenticationFailed"],
    [403, "modelAccessDenied"],
    [429, "rateLimited"],
    [400, "modelOrEndpointError"],
    [500, "upstreamError"],
  ] as const) {
    const response = await handleResumeImport(request(input()), (async () =>
      Response.json(
        { error: "test-key and private resume" },
        { status },
      )) as typeof fetch);
    const body = await response.json();
    assert.deepEqual(body, { code });
  }
  const timeout = await handleResumeImport(request(input()), (async () => {
    throw new DOMException("timeout", "TimeoutError");
  }) as typeof fetch);
  assert.equal(timeout.status, 504);
  assert.equal((await timeout.json()).code, "timeout");
});

test("retries transient upstream failures before returning an error", async () => {
  let calls = 0;
  const response = await handleResumeImport(
    request(input("gemini")),
    (async () => {
      calls += 1;
      if (calls < 3)
        return Response.json({ error: "temporary" }, { status: 503 });
      return Response.json({
        candidates: [
          {
            finishReason: "STOP",
            content: { parts: [{ text: JSON.stringify(sample) }] },
          },
        ],
      });
    }) as typeof fetch,
  );

  assert.equal(response.status, 200);
  assert.equal(calls, 3);
  assert.equal((await response.json()).resume.basic.name, sample.basic.name);
});

test("rejects partial, refused, invalid and empty model output", () => {
  assert.throws(
    () =>
      readVisionOutput("chat-completions", {
        choices: [
          {
            finish_reason: "length",
            message: { content: JSON.stringify(sample) },
          },
        ],
      }),
    /truncatedOutput/,
  );
  assert.throws(
    () => readVisionOutput("responses", { status: "incomplete" }),
    /truncatedOutput/,
  );
  assert.throws(
    () => readVisionOutput("anthropic", { stop_reason: "refusal" }),
    /refused/,
  );
  assert.throws(() => validateResume({}), /emptyOutput/);
  assert.throws(
    () => validateResume({ ...sample, basic: { name: 42 } }),
    /invalidOutput/,
  );
  assert.throws(
    () =>
      validateResume({ ...sample, experience: [{ details: "wrong type" }] }),
    /invalidOutput/,
  );
  assert.throws(() => parseJsonPayload("not json"), /invalidOutput/);
  assert.equal(
    validateResume(
      parseJsonPayload("```json\n" + JSON.stringify(sample) + "\n```"),
    ).resume.basic.name,
    "张三",
  );
  assert.deepEqual(
    validateResume({ ...sample, basic: { email: "a@example.com" } }).warnings,
    ["missingName"],
  );
});

test("vision test prompt does not disclose expected digits or create a resume", async () => {
  const built = buildVisionRequest(
    validateImportInput(input("qwen", { test: true })),
  );
  assert.ok(!JSON.stringify(built.body).includes("739281"));
  const response = await handleResumeImport(
    request(input("qwen", { test: true })),
    (async () =>
      Response.json({
        choices: [{ message: { content: '{"code":"739281"}' } }],
      })) as typeof fetch,
  );
  assert.deepEqual(await response.json(), { code: "739281" });
});

test("malformed successful responses report invalid output, not a network error", async () => {
  for (const [response, expected] of [
    [new Response("<html>gateway</html>"), "invalidOutput"],
    [
      Response.json({ candidates: [{ content: { parts: {} } }] }),
      "emptyOutput",
    ],
  ] as const) {
    const result = await handleResumeImport(
      request(input("gemini")),
      (async () => response) as typeof fetch,
    );
    assert.equal((await result.json()).code, expected);
  }
});
