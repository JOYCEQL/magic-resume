import assert from "node:assert/strict";
import test from "node:test";
import {
  createResumeFromAIResult,
  toStringArray,
} from "../src/app/app/dashboard/resumes/utils";

test("import preserves leading numbers that belong to resume content", () => {
  const lines = [
    "3.5 GPA",
    "5 years of experience with Python",
    "10x improvement in latency",
    "1000+ users served",
    "2019 - present",
  ];
  assert.deepEqual(toStringArray(lines.join("\r\n")), lines);
});

test("import removes bullet and numbered list markers without eating content", () => {
  assert.deepEqual(
    toStringArray("- Built a thing\n* Did another\n• Owned the platform\n1. 3.5 GPA\n2) 5 years of experience\n\n"),
    ["Built a thing", "Did another", "Owned the platform", "3.5 GPA", "5 years of experience"],
  );
});

test("array input preserves numbers and removes empty entries", () => {
  assert.deepEqual(toStringArray(["  3.5 GPA  ", "", "5 years", "   "]), ["3.5 GPA", "5 years"]);
  for (const value of [undefined, null, 42]) {
    assert.deepEqual(toStringArray(value), []);
  }
});

test("resume conversion keeps numeric achievements in each rich text section", () => {
  const resume = createResumeFromAIResult({
    education: [{ school: "Example", description: "3.5 GPA" }],
    experience: [{ company: "Example", details: "1. 5 years of experience" }],
    projects: [{ name: "Example", description: "- 1000+ users served" }],
    skills: ["10x improvement", "TypeScript & <React>"],
  }, "Resume");
  assert.equal(resume.education[0].description, "<ul><li>3.5 GPA</li></ul>");
  assert.equal(resume.experience[0].details, "<ul><li>5 years of experience</li></ul>");
  assert.equal(resume.projects[0].description, "<ul><li>1000+ users served</li></ul>");
  assert.equal(resume.skillContent, "<ul><li>10x improvement</li><li>TypeScript &amp; &lt;React&gt;</li></ul>");
});
