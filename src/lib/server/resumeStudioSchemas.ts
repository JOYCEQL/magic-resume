const string = { type: "string" } as const;
const requiredString = { type: "string", minLength: 1 } as const;
const stringArray = { type: "array", items: string, maxItems: 20 } as const;
const nonEmptyStringArray = {
  type: "array",
  items: { type: "string", minLength: 1 },
  minItems: 1,
  maxItems: 20,
} as const;

export const vacancyAnalysisOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["requirements", "outcomes", "context", "risks"],
  properties: {
    requirements: {
      type: "array",
      minItems: 1,
      maxItems: 30,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "text", "sourceText", "priority", "weight", "evidenceExpected"],
        properties: {
          category: { type: "string", enum: ["platform", "portfolio", "governance", "delivery", "domain", "language", "location"] },
          text: requiredString,
          sourceText: requiredString,
          priority: { type: "string", enum: ["must", "important", "optional"] },
          weight: { type: "integer", minimum: 0, maximum: 100 },
          evidenceExpected: { type: "string", enum: ["direct", "adjacent-acceptable"] },
        },
      },
    },
    outcomes: stringArray,
    context: stringArray,
    risks: stringArray,
  },
} as const;

export const evidenceMatchingOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["mappings"],
  properties: {
    mappings: {
      type: "array",
      minItems: 1,
      maxItems: 30,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirementId", "matches"],
        properties: {
          requirementId: requiredString,
          matches: {
            type: "array",
            minItems: 1,
            maxItems: 8,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["evidenceId", "support", "relevanceScore", "reason"],
              properties: {
                evidenceId: string,
                support: { type: "string", enum: ["direct", "adjacent", "unsupported"] },
                relevanceScore: { type: "integer", minimum: 0, maximum: 100 },
                reason: requiredString,
              },
            },
          },
        },
      },
    },
  },
} as const;

export const resumeStudioOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "language", "targetRole", "basic", "summary", "experience", "projects", "education", "skills", "evidenceMap", "requirementMap", "audit"],
  properties: {
    title: string,
    language: { type: "string", enum: ["ru", "en"] },
    targetRole: string,
    basic: {
      type: "object",
      additionalProperties: false,
      required: ["name", "title", "email", "phone", "location", "employementStatus"],
      properties: {
        name: string,
        title: string,
        email: string,
        phone: string,
        location: string,
        employementStatus: string,
      },
    },
    summary: string,
    experience: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["company", "position", "date", "details"],
        properties: {
          company: requiredString,
          position: requiredString,
          date: requiredString,
          details: nonEmptyStringArray,
        },
      },
    },
    projects: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "role", "date", "description", "link"],
        properties: {
          name: requiredString,
          role: requiredString,
          date: requiredString,
          description: stringArray,
          link: string,
        },
      },
    },
    education: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["school", "major", "degree", "startDate", "endDate", "description"],
        properties: {
          school: requiredString,
          major: requiredString,
          degree: string,
          startDate: requiredString,
          endDate: requiredString,
          description: stringArray,
        },
      },
    },
    skills: nonEmptyStringArray,
    evidenceMap: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim", "refs"],
        properties: { claim: string, refs: stringArray },
      },
    },
    requirementMap: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim", "requirementIds"],
        properties: {
          claim: string,
          requirementIds: stringArray,
        },
      },
    },
    audit: {
      type: "object",
      additionalProperties: false,
      required: ["score", "summary", "directEvidence", "adjacentEvidence", "gaps", "excludedClaims"],
      properties: {
        score: { type: "integer", minimum: 0, maximum: 100 },
        summary: string,
        directEvidence: stringArray,
        adjacentEvidence: stringArray,
        gaps: stringArray,
        excludedClaims: stringArray,
      },
    },
  },
} as const;

export const verifierOutputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["verdicts"],
  properties: {
    verdicts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "supported"],
        properties: {
          id: string,
          supported: { type: "boolean" },
        },
      },
    },
  },
} as const;
