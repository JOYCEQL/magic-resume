import { describe, expect, it } from "vitest";
import { toStringArray } from "./utils";

describe("toStringArray", () => {
  it("preserves leading numbers in resume content (regression)", () => {
    // These lines start with digits that are part of the actual content.
    // The previous strip regex /^[-*•\d.)\s]+/ greedily ate the leading
    // numbers, corrupting "3.5 GPA" -> "GPA", "5 years..." -> "years...".
    const input = [
      "3.5 GPA",
      "5 years of experience with Python",
      "10x improvement in latency",
      "1000+ users served",
      "2019 - present"
    ].join("\n");

    expect(toStringArray(input)).toEqual([
      "3.5 GPA",
      "5 years of experience with Python",
      "10x improvement in latency",
      "1000+ users served",
      "2019 - present"
    ]);
  });

  it("still strips genuine bullet and ordered-list markers", () => {
    const input = [
      "- Built a thing",
      "* Did another",
      "• Owned the platform",
      "1. Led the migration",
      "2) Shipped the feature"
    ].join("\n");

    expect(toStringArray(input)).toEqual([
      "Built a thing",
      "Did another",
      "Owned the platform",
      "Led the migration",
      "Shipped the feature"
    ]);
  });

  it("trims an array input and drops empty entries", () => {
    expect(toStringArray(["  a  ", "", "b", "   "])).toEqual(["a", "b"]);
  });

  it("returns an empty array for non-string, non-array input", () => {
    expect(toStringArray(undefined)).toEqual([]);
    expect(toStringArray(null)).toEqual([]);
    expect(toStringArray(42)).toEqual([]);
  });
});
