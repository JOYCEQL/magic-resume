import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LOGO_CONFIG } from "../src/types/resume";
import { logoImageSource, normalizeLogoConfig, updateLogoConfig } from "../src/utils/logo";

test("old resumes and visibility-only logo settings receive complete defaults", () => {
  assert.deepEqual(normalizeLogoConfig(), DEFAULT_LOGO_CONFIG);
  assert.deepEqual(normalizeLogoConfig({ visible: false }), { ...DEFAULT_LOGO_CONFIG, visible: false });
  assert.equal(normalizeLogoConfig({ width: NaN, height: Infinity }).width, 20);
  assert.equal(normalizeLogoConfig({ width: NaN, height: Infinity }).height, 20);
});

test("changing the logo ratio preserves width and calculates with the new ratio", () => {
  const wide = updateLogoConfig(DEFAULT_LOGO_CONFIG, { aspectRatio: "4:3" });
  assert.equal(wide.width, 20);
  assert.equal(wide.height, 15);
  const square = updateLogoConfig(wide, { aspectRatio: "1:1" });
  assert.equal(square.width, 20);
  assert.equal(square.height, 20);
  const tall = updateLogoConfig(square, { aspectRatio: "3:4" });
  assert.equal(tall.width, 20);
  assert.equal(tall.height, 27);
  const resized = updateLogoConfig(wide, { height: 30 });
  assert.equal(resized.width, 40);
  assert.equal(resized.height, 30);
});

test("logo dimensions stay within limits, including after a ratio switch", () => {
  const tall = updateLogoConfig({ ...DEFAULT_LOGO_CONFIG, width: 60 }, { aspectRatio: "3:4" });
  assert.equal(tall.width, 45);
  assert.equal(tall.height, 60);
  const custom = updateLogoConfig(DEFAULT_LOGO_CONFIG, { aspectRatio: "custom", width: 45, height: 12 });
  assert.equal(custom.width, 45);
  assert.equal(custom.height, 12);
  assert.equal(updateLogoConfig(custom, { customBorderRadius: 100 }).customBorderRadius, 6);
});

test("remote logo previews and exports use the proxy without double-wrapping stored images", () => {
  const url = "https://images.example.com/logo.png?size=64&color=blue";
  const proxied = `/api/proxy/image?url=${encodeURIComponent(url)}`;
  assert.equal(logoImageSource(url), proxied);
  assert.equal(logoImageSource(proxied), proxied);
  assert.equal(logoImageSource("data:image/png;base64,AA=="), "data:image/png;base64,AA==");
  assert.equal(logoImageSource("/company.png"), "/company.png");
});
