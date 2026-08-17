import assert from "node:assert/strict";
import test from "node:test";

import { codexArguments, codexEnvironment } from "./codexStructuredOutput";

test("Codex invocation is ephemeral, isolated, tool-free, and schema constrained", () => {
  const args = codexArguments("gpt-5.6-sol", "/tmp/schema.json", "/tmp/result.json", "/tmp/work");

  assert.deepEqual(args.slice(0, 5), ["exec", "--ephemeral", "--ignore-user-config", "--ignore-rules", "--skip-git-repo-check"]);
  assert.ok(args.includes("read-only"));
  assert.ok(args.includes("shell_tool"));
  assert.ok(args.includes("web_search=\"disabled\""));
  assert.ok(args.includes("--output-schema"));
  assert.ok(args.includes("--output-last-message"));
  assert.equal(args.at(-1), "-");
});

test("Codex child environment excludes application and provider secrets", () => {
  const environment = codexEnvironment({
    HOME: "/Users/test",
    PATH: "/bin",
    CODEX_HOME: "/Users/test/.codex",
    RESUME_STUDIO_ACCESS_TOKEN: "secret",
    OPENAI_API_KEY: "secret",
    RANDOM_SECRET: "secret",
  });

  assert.equal(environment.HOME, "/Users/test");
  assert.equal(environment.CODEX_HOME, "/Users/test/.codex");
  assert.equal(environment.RESUME_STUDIO_ACCESS_TOKEN, undefined);
  assert.equal(environment.OPENAI_API_KEY, undefined);
  assert.equal(environment.RANDOM_SECRET, undefined);
  assert.equal(environment.NO_COLOR, "1");
});
