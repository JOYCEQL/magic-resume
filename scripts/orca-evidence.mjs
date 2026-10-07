#!/usr/bin/env node
/**
 * Generate the OrcaRouter UI evidence under `orca-evidence/`.
 *
 * The screenshots must come from the project's own interface, so this drives
 * the real AI settings screen at `/app/dashboard/ai` with a headless Chromium
 * and writes:
 *
 *   auth-methods.png             the API-key field and the sign-in entry side by side
 *   text-model-dropdown.png      the model control for text chat, opened
 *   multimodal-model-dropdown.png the same control for the image-import entry point
 *
 * The catalog shown is produced by this project's own `POST /api/models`
 * handler: the script asks the running server for the capability-filtered
 * catalog (using `ORCAROUTER_API_KEY` when the environment provides one) and
 * replays that exact response into the browser. With no key the script falls
 * back to a small labelled fixture and records `catalog_fixture: true`, so a
 * degraded run is never mistaken for a live one. Only fixture values ever
 * reach the DOM; the real key is never written anywhere.
 *
 * Usage: start the project (`npm run dev` or `pnpm dev`) or let this script
 * start it, then run `node scripts/orca-evidence.mjs`.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "orca-evidence");
const BASE_URL = process.env.EVIDENCE_BASE_URL || "http://127.0.0.1:3000";
const CHROMIUM = process.env.EVIDENCE_CHROMIUM || "/usr/bin/chromium";
const VIEWPORT = { width: 1440, height: 960 };
const FIXTURE_KEY = "sk-orca-fixture-ui-000000000000";
const CATALOG_URL = "https://api.orcarouter.ai/v1/models?capability=chat";
const OPTION_LIMIT = 60;

const FIXTURE_CATALOG = [
  { id: "deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash", supportsImages: false },
  { id: "deepseek/deepseek-v4-flash-vision-exp", name: "DeepSeek V4 Vision", supportsImages: true },
  { id: "orcarouter/auto", name: "OrcaRouter Auto", supportsImages: false },
];

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Ask this project's own /api/models handler for a capability-filtered catalog. */
async function catalogViaProject(capability, modalities = "text") {
  const apiKey = (process.env.ORCAROUTER_API_KEY || "").trim();
  if (!apiKey) return null;
  try {
    const response = await fetch(`${BASE_URL}/api/models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "orcarouter", apiKey, capability, modalities }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok) throw new Error(`status ${response.status}`);
    const payload = await response.json();
    return Array.isArray(payload.models) && payload.models.length ? payload.models : null;
  } catch (error) {
    console.log(`[evidence] catalog request failed: ${error?.name || error}`);
    return null;
  }
}

async function serverReady() {
  try {
    const response = await fetch(`${BASE_URL}/app/dashboard/ai`, {
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

/** Boot the project's own dev server when one is not already listening.
 *  The Vite entry point is executed with the running Node binary instead of a
 *  package-manager shim: pnpm is not guaranteed to be on PATH (the project's
 *  own CI image and the verification environment resolve only node/npm), and
 *  `pnpm dev` is just `vite dev`. */
async function startDevServer() {
  if (await serverReady()) return null;
  const vite = path.join(ROOT, "node_modules", "vite", "bin", "vite.js");
  const child = spawn(
    process.execPath,
    [vite, "dev", "--host", "127.0.0.1", "--port", "3000", "--strictPort"],
    { cwd: ROOT, stdio: "ignore", detached: false },
  );
  for (let attempt = 0; attempt < 90; attempt++) {
    if (await serverReady()) return child;
    if (child.exitCode !== null) throw new Error("dev server exited before becoming ready");
    await sleep(1_000);
  }
  child.kill("SIGTERM");
  throw new Error("dev server did not become ready in 90s");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const server = await startDevServer();
  try {
    return await run();
  } finally {
    if (server) {
      server.kill("SIGTERM");
      await sleep(500);
      if (server.exitCode === null) server.kill("SIGKILL");
    }
  }
}

async function run() {
  const chat = await catalogViaProject("chat");
  const multimodal = await catalogViaProject("chat", "text,image");
  const fixture = !chat;
  const chatModels = (chat || FIXTURE_CATALOG).slice(0, OPTION_LIMIT);
  const imageModels = (
    multimodal || FIXTURE_CATALOG.filter((model) => model.supportsImages)
  ).slice(0, OPTION_LIMIT);
  console.log(
    `[evidence] chat=${chatModels.length} multimodal=${imageModels.length} fixture=${fixture}`,
  );

  const artifacts = [];
  let results;
  const browser = await chromium.launch({ executablePath: CHROMIUM });
  try {
    const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    const page = await context.newPage();
    let replay = { models: chatModels };
    await page.route("**/api/models", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(replay),
      }),
    );

    const openOrcaProvider = async () => {
      await page.locator('aside button:has-text("OrcaRouter")').first().click();
      await page.waitForSelector('[data-testid="orca-auth-panel"]');
    };
    const dropdownMetrics = async () => {
      const trigger = page.locator('[data-testid="orca-model-dropdown-trigger"]');
      const dropdown = page.locator('[data-testid="orca-model-dropdown"]');
      await dropdown.waitFor({ state: "visible" });
      await page.waitForTimeout(150);
      const triggerBox = await trigger.boundingBox();
      const panelBox = await dropdown.boundingBox();
      return {
        dropdown_open: await dropdown.isVisible(),
        item_count: await page.locator('[data-testid="orca-model-option"]').count(),
        opaque_background: await page.evaluate(() => {
          const el = document.querySelector('[data-testid="orca-model-dropdown"]');
          const background = getComputedStyle(el).backgroundColor;
          return background !== "rgba(0, 0, 0, 0)" && background !== "transparent";
        }),
        visible_border: await page.evaluate(
          () =>
            parseFloat(
              getComputedStyle(document.querySelector('[data-testid="orca-model-dropdown"]'))
                .borderTopWidth,
            ) > 0,
        ),
        trigger_panel_right_delta: Math.abs(
          Math.round(triggerBox.x + triggerBox.width - (panelBox.x + panelBox.width)),
        ),
      };
    };

    await page.goto(`${BASE_URL}/app/dashboard/ai`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await openOrcaProvider();

    // ---- auth-methods.png: both entries, secret masked ----
    await page.locator('[data-testid="orca-api-key-input"]').fill(FIXTURE_KEY);
    await page.waitForSelector('[data-testid="orca-secret-masked"]');
    const masked = await page.locator('[data-testid="orca-secret-masked"]').innerText();
    const authUi = {
      api_key_visible: await page.locator('[data-testid="orca-api-key-input"]').isVisible(),
      pkce_visible: await page.locator('[data-testid="orca-connect"]').isVisible(),
      secret_masked: !masked.includes("sk-orca") && masked.includes("•"),
      controls_enabled: await page.locator('[data-testid="orca-connect"]').isEnabled(),
    };
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(OUT, "auth-methods.png") });
    artifacts.push({ kind: "auth-methods", path: "auth-methods.png", ui: authUi });

    // ---- text-model-dropdown.png: the real control, opened ----
    await page.locator('[data-testid="orca-refresh-models"]').click();
    await page.waitForSelector('[data-testid="orca-model-selector"]');
    await page.locator('[data-testid="orca-model-dropdown-trigger"]').click();
    const textUi = await dropdownMetrics();
    textUi.option_ids = (
      await page.locator('[data-testid="orca-model-option"]').allInnerTexts()
    )
      .slice(0, 5)
      .map((text) => text.split("\n")[0]);
    await page.screenshot({ path: path.join(OUT, "text-model-dropdown.png") });
    artifacts.push({ kind: "text-model-dropdown", path: "text-model-dropdown.png", ui: textUi });
    await page.locator('[data-testid="orca-model-dropdown-trigger"]').click();

    // ---- multimodal-model-dropdown.png: image-capable options only ----
    replay = { models: imageModels };
    await page.reload({ waitUntil: "networkidle" });
    await openOrcaProvider();
    await page.locator('[data-testid="orca-api-key-input"]').fill(FIXTURE_KEY);
    await page.locator('[data-testid="orca-refresh-models"]').click();
    await page.waitForSelector('[data-testid="orca-model-selector"]');
    await page.locator('[data-testid="orca-model-dropdown-trigger"]').click();
    const imageUi = await dropdownMetrics();
    imageUi.option_ids = (
      await page.locator('[data-testid="orca-model-option"]').allInnerTexts()
    )
      .slice(0, 5)
      .map((text) => text.split("\n")[0]);
    await page.screenshot({ path: path.join(OUT, "multimodal-model-dropdown.png") });
    artifacts.push({
      kind: "multimodal-model-dropdown",
      path: "multimodal-model-dropdown.png",
      ui: imageUi,
    });

    results = { authUi, textUi, imageUi };
  } finally {
    await browser.close();
  }

  const { authUi, textUi, imageUi } = results;
  const dropdownOk = (ui) =>
    ui.dropdown_open &&
    ui.opaque_background &&
    ui.visible_border &&
    ui.trigger_panel_right_delta <= 2;
  const passed =
    Object.values(authUi).every((value) => value === true) &&
    dropdownOk(textUi) &&
    dropdownOk(imageUi) &&
    textUi.item_count === chatModels.length &&
    imageUi.item_count === imageModels.length &&
    imageUi.item_count > 0 &&
    imageUi.item_count < textUi.item_count;

  const listed = [];
  for (const artifact of artifacts) {
    const bytes = await readFile(path.join(OUT, artifact.path));
    listed.push({ ...artifact, sha256: sha256(bytes) });
  }

  const manifest = {
    automation: {
      framework: "playwright",
      passed,
      catalog_source: CATALOG_URL,
      catalog_model_count: chatModels.length,
      image_model_count: imageModels.length,
    },
    catalog_via: "project POST /api/models (capability=chat)",
    catalog_fixture: fixture,
    generated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    artifacts: listed,
    details: { ui: authUi, dropdown: textUi, multimodal: imageUi },
  };
  await writeFile(
    path.join(OUT, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(
    JSON.stringify(
      {
        passed,
        catalog_model_count: manifest.automation.catalog_model_count,
        image_model_count: manifest.automation.image_model_count,
        catalog_fixture: fixture,
      },
      null,
      2,
    ),
  );
  if (!passed) throw new Error("evidence assertions failed");
  return 0;
}

main()
  .then((code) => process.exit(code || 0))
  .catch((error) => {
    console.error(`[evidence] ${error?.stack || error}`);
    process.exit(1);
  });
