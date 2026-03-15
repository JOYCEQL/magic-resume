import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import { DEFAULT_TEMPLATES } from "../src/config";
import {
  TEMPLATE_PREVIEW_HEIGHT_PX,
  TEMPLATE_PREVIEW_LOCALES,
  TEMPLATE_PREVIEW_WIDTH_PX,
  TEMPLATE_SNAPSHOT_ROOT_SELECTOR,
  TEMPLATE_SNAPSHOT_VERSION,
  createEmptyTemplateSnapshotManifest,
  getTemplateSnapshotPath,
  type TemplatePreviewLocale,
} from "../src/lib/templatePreview";

const SNAPSHOT_SERVER_HOST = "127.0.0.1";
const SNAPSHOT_SERVER_PORT = 4173;
const SNAPSHOT_SERVER_URL = `http://${SNAPSHOT_SERVER_HOST}:${SNAPSHOT_SERVER_PORT}`;
const SNAPSHOT_PUBLIC_DIR = path.resolve(
  process.cwd(),
  "public",
  "template-snapshots"
);
const SNAPSHOT_MANIFEST_FILE = path.resolve(
  process.cwd(),
  "src",
  "generated",
  "templateSnapshotManifest.ts"
);
const VITE_CLI_FILE = path.resolve(
  process.cwd(),
  "node_modules",
  "vite",
  "bin",
  "vite.js"
);
const MIN_NODE_MAJOR = 20;
const MIN_NODE_MINOR = 19;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildTemplateSnapshotUrl = (
  locale: TemplatePreviewLocale,
  templateId: string
) =>
  `${SNAPSHOT_SERVER_URL}/app/preview-template/${templateId}?locale=${locale}&snapshot=1`;

const waitForServer = async (timeoutMs = 30_000) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(SNAPSHOT_SERVER_URL);
      if (response.ok) {
        return;
      }
    } catch {}

    await sleep(500);
  }

  throw new Error(`Timed out waiting for ${SNAPSHOT_SERVER_URL}`);
};

const assertSupportedNodeVersion = () => {
  const [major, minor] = process.versions.node
    .split(".")
    .map((segment) => Number(segment));

  if (
    Number.isNaN(major) ||
    Number.isNaN(minor) ||
    major < MIN_NODE_MAJOR ||
    (major === MIN_NODE_MAJOR && minor < MIN_NODE_MINOR)
  ) {
    throw new Error(
      `Node.js ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}+ is required. Current runtime is ${process.versions.node}.`
    );
  }
};

const startDevServer = (): ChildProcess => {
  const child = spawn(
    process.execPath,
    [
      VITE_CLI_FILE,
      "dev",
      "--host",
      SNAPSHOT_SERVER_HOST,
      "--port",
      String(SNAPSHOT_SERVER_PORT),
      "--strictPort",
    ],
    {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env,
    }
  );

  return child;
};

const stopProcess = (child: ChildProcess | null) => {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
};

const writeManifest = async (
  manifest: ReturnType<typeof createEmptyTemplateSnapshotManifest>
) => {
  const fileContent = `export const TEMPLATE_SNAPSHOT_MANIFEST = ${JSON.stringify(
    manifest,
    null,
    2
  )} as const;\n`;

  await writeFile(SNAPSHOT_MANIFEST_FILE, fileContent, "utf8");
};

const ensurePlaywrightBrowser = async () => {
  try {
    const browser = await chromium.launch();
    await browser.close();
  } catch (error) {
    throw new Error(
      "Playwright Chromium is not installed. Run `pnpm exec playwright install chromium` first.",
      { cause: error }
    );
  }
};

const main = async () => {
  assertSupportedNodeVersion();
  await ensurePlaywrightBrowser();

  await rm(SNAPSHOT_PUBLIC_DIR, { recursive: true, force: true });
  await mkdir(SNAPSHOT_PUBLIC_DIR, { recursive: true });

  const manifest = createEmptyTemplateSnapshotManifest();
  manifest.version = TEMPLATE_SNAPSHOT_VERSION;
  manifest.generatedAt = new Date().toISOString();

  const devServer = startDevServer();

  try {
    console.log("Starting preview server for template snapshots...");
    await waitForServer();
    console.log("Preview server is ready.");

    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: {
        width: TEMPLATE_PREVIEW_WIDTH_PX,
        height: TEMPLATE_PREVIEW_HEIGHT_PX,
      },
      deviceScaleFactor: 2,
      colorScheme: "light",
    });

    for (const locale of TEMPLATE_PREVIEW_LOCALES) {
      const localeOutputDir = path.join(SNAPSHOT_PUBLIC_DIR, locale);
      await mkdir(localeOutputDir, { recursive: true });

      for (const template of DEFAULT_TEMPLATES) {
        console.log(`Capturing ${locale}/${template.id}...`);
        const screenshotUrl = buildTemplateSnapshotUrl(locale, template.id);
        const outputFilePath = path.join(localeOutputDir, `${template.id}.png`);

        await page.goto(screenshotUrl, {
          waitUntil: "networkidle",
        });
        await page.waitForSelector(TEMPLATE_SNAPSHOT_ROOT_SELECTOR);
        await page.evaluate(async () => {
          if (document.fonts?.ready) {
            await document.fonts.ready;
          }
        });

        await page.locator(TEMPLATE_SNAPSHOT_ROOT_SELECTOR).screenshot({
          path: outputFilePath,
          type: "png",
        });

        manifest.locales[locale][template.id] = `${getTemplateSnapshotPath(
          locale,
          template.id
        )}?v=${encodeURIComponent(manifest.generatedAt)}`;
      }
    }

    await browser.close();
    await writeManifest(manifest);
    console.log("Template snapshots generated successfully.");
  } finally {
    stopProcess(devServer);
  }
};

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
