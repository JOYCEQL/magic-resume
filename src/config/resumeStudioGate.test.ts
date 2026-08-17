import assert from "node:assert/strict";
import test from "node:test";
import { isResumeStudioEnabled } from "./resumeStudioGate";

test("personal Resume Studio is opt-in outside development", () => {
  assert.equal(isResumeStudioEnabled(false, undefined), false);
  assert.equal(isResumeStudioEnabled(false, "false"), false);
  assert.equal(isResumeStudioEnabled(false, "true"), true);
});

test("personal Resume Studio remains available in local development", () => {
  assert.equal(isResumeStudioEnabled(true, undefined), true);
});
