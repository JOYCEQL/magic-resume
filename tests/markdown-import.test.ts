import test from "node:test";
import assert from "node:assert/strict";
import {
  PDF_IMPORT_PRESETS,
  type PdfImportProvider,
} from "../src/config/pdf-import";
import { handleMarkdownImport, validateMarkdownImportInput } from "../src/lib/server/resume-import";
import { MARKDOWN_IMPORT_PROMPT, MAX_MARKDOWN_IMPORT_BYTES, ResumeImportError } from "../src/lib/resume-import-schema";

function expectError(fn: () => unknown, code: string, status?: number) {
  try {
    fn();
    assert.fail(`expected ResumeImportError(${code})`);
  } catch (error) {
    assert.ok(error instanceof ResumeImportError, `expected ResumeImportError, got ${error}`);
    assert.equal(error.code, code);
    if (status !== undefined) assert.equal(error.status, status);
  }
}

const markdown = `# 张三的简历

## 基本信息
- 邮箱: zhang@example.com

## 工作经历
### Example | Engineer
_2020–2024_
- Built an app

## 专业技能
- TypeScript
`;

const sample = {
  title: "My resume",
  basic: { name: "张三", email: "zhang@example.com" },
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
    model: "text-test",
    text: markdown,
    ...overrides,
  };
}

function request(body: unknown) {
  return new Request("http://localhost/api/markdown-import", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

test("forwards markdown text and extracts a validated resume", async () => {
  const response = await handleMarkdownImport(request(input("deepseek")), (async (
    url,
    init,
  ) => {
    assert.ok(String(url).endsWith("/chat/completions"));
    assert.equal(
      (init?.headers as Record<string, string>).Authorization,
      "Bearer test-key",
    );
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, "text-test");
    // No images: user content must be a plain text string containing the markdown.
    assert.equal(typeof body.messages[1].content, "string");
    assert.ok(body.messages[1].content.includes("张三的简历"));
    assert.equal(body.messages[0].content, MARKDOWN_IMPORT_PROMPT);
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

test("fenced JSON output from the model still parses", async () => {
  const response = await handleMarkdownImport(
    request(input("qwen")),
    (async () =>
      Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: { content: "```json\n" + JSON.stringify(sample) + "\n```" },
          },
        ],
      })) as typeof fetch,
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).resume.basic.email, "zhang@example.com");
});

test("empty or non-string text is rejected without a network call", async () => {
  for (const text of [undefined, "", "   "]) {
    expectError(() => validateMarkdownImportInput(input("qwen", { text })), "invalidRequest");
  }
});

test("oversized markdown is rejected", () => {
  expectError(
    () => validateMarkdownImportInput(input("qwen", { text: "a".repeat(MAX_MARKDOWN_IMPORT_BYTES + 1) })),
    "markdownFileTooLarge",
    413,
  );
});

test("missing connection fields are rejected", () => {
  expectError(() => validateMarkdownImportInput(input("qwen", { apiKey: "" })), "configRequired");
});

test("upstream failures surface their error code", async () => {
  const response = await handleMarkdownImport(
    request(input("deepseek")),
    (async () => new Response("Unauthorized", { status: 401 })) as typeof fetch,
  );
  assert.equal(response.status, 401);
  assert.equal((await response.json()).code, "authenticationFailed");
});
