import assert from "node:assert/strict";
import test from "node:test";

import { resumeStudioOutputSchema } from "./resumeStudioSchemas";

test("resume output schema requires claim-level requirement provenance", () => {
  assert.ok(
    (resumeStudioOutputSchema.required as readonly string[]).includes("requirementMap"),
  );
  assert.deepEqual(resumeStudioOutputSchema.properties.requirementMap, {
    type: "array",
    items: {
      type: "object",
      additionalProperties: false,
      required: ["claim", "requirementIds"],
      properties: {
        claim: { type: "string" },
        requirementIds: {
          type: "array",
          items: { type: "string" },
          maxItems: 20,
        },
      },
    },
  });
});
