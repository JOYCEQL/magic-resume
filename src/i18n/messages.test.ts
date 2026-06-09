import { describe, expect, it } from "vitest";
import { getMessagesForLocale } from "./messages";

describe("getMessagesForLocale", () => {
  it("returns Russian messages for ru locale", () => {
    const messages = getMessagesForLocale("ru") as {
      common: { title: string };
    };

    expect(messages.common.title).toBeTruthy();
    expect(messages.common.title).not.toBe(
      (getMessagesForLocale("zh") as { common: { title: string } }).common.title
    );
  });

  it("falls back to default locale for unknown locale", () => {
    const fallback = getMessagesForLocale("zh");
    const unknown = getMessagesForLocale("xx" as "zh");

    expect(unknown).toBe(fallback);
  });
});
