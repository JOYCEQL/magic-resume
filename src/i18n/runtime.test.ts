import assert from "node:assert/strict";
import test from "node:test";

import { getPreferredLocale } from "./runtime";

test("private app routes default to English instead of Chinese", () => {
  assert.equal(getPreferredLocale("/app/dashboard/resumes"), "en");
});
