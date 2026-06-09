import { describe, expect, it } from "vitest";
import { getInitialResumeStateForLocale } from "./localeResumeData";
import { initialResumeStateRu } from "./initialResumeData";

describe("getInitialResumeStateForLocale", () => {
  it("returns Russian demo resume for ru locale", () => {
    const resume = getInitialResumeStateForLocale("ru");

    expect(resume.basic.name).toBe(initialResumeStateRu.basic.name);
    expect(resume.basic.name).not.toBe(
      getInitialResumeStateForLocale("zh").basic.name
    );
  });
});
