import { describe, expect, it, beforeEach } from "vitest";
import {
  getCookieLocale,
  getPreferredLocale,
  isSupportedLocale,
  LOCALE_COOKIE_NAME,
  parseCookieLocale,
  setCookieLocale,
} from "./runtime";

describe("isSupportedLocale", () => {
  it("accepts supported locales", () => {
    expect(isSupportedLocale("zh")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("ru")).toBe(true);
  });

  it("rejects unknown locales", () => {
    expect(isSupportedLocale("de")).toBe(false);
    expect(isSupportedLocale("")).toBe(false);
  });
});

describe("cookie locale helpers", () => {
  beforeEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=; path=/; max-age=0`;
  });

  it("reads valid cookie locale", () => {
    document.cookie = `${LOCALE_COOKIE_NAME}=ru; path=/`;

    expect(parseCookieLocale(document.cookie)).toBe("ru");
    expect(getCookieLocale()).toBe("ru");
  });

  it("ignores invalid cookie locale", () => {
    document.cookie = `${LOCALE_COOKIE_NAME}=invalid; path=/`;

    expect(parseCookieLocale(document.cookie)).toBeNull();
    expect(getCookieLocale()).toBe("zh");
  });

  it("writes cookie locale", () => {
    setCookieLocale("en");

    expect(getCookieLocale()).toBe("en");
  });
});

describe("getPreferredLocale", () => {
  beforeEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=; path=/; max-age=0`;
  });

  it("prefers locale from pathname", () => {
    expect(getPreferredLocale("/ru")).toBe("ru");
    expect(getPreferredLocale("/en/about")).toBe("en");
  });

  it("uses cookie locale on app routes", () => {
    document.cookie = `${LOCALE_COOKIE_NAME}=ru; path=/`;

    expect(getPreferredLocale("/app/dashboard")).toBe("ru");
  });
});
