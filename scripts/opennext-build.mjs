import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const proxyPath = path.join(root, "src/proxy.ts");
const middlewarePath = path.join(root, "src/middleware.ts");
const backupPath = path.join(root, "src/proxy.ts.__opennext_backup__");

const middlewareContent = [
  'import handler from "./intl-proxy";',
  "",
  "export default handler;",
  'export const runtime = "experimental-edge";',
  "export const config = {",
  '  matcher: ["/", "/(zh|en)/:path*"],',
  "};",
  "",
].join("\n");

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed: ${command} ${args.join(" ")}`));
      }
    });
    child.on("error", reject);
  });
}

async function restoreProxy() {
  if (await fileExists(middlewarePath)) {
    await fs.unlink(middlewarePath);
  }

  if (await fileExists(backupPath)) {
    await fs.rename(backupPath, proxyPath);
  }
}

async function main() {
  if (!(await fileExists(proxyPath))) {
    throw new Error("Expected src/proxy.ts to exist before OpenNext build.");
  }

  if (await fileExists(middlewarePath)) {
    throw new Error("Expected src/middleware.ts to not exist before OpenNext build.");
  }

  if (await fileExists(backupPath)) {
    throw new Error("Found stale backup file: src/proxy.ts.__opennext_backup__");
  }

  await fs.rename(proxyPath, backupPath);
  await fs.writeFile(middlewarePath, middlewareContent, "utf8");

  try {
    await run("pnpm", ["opennextjs-cloudflare", "build"]);
  } finally {
    await restoreProxy();
  }
}

main().catch(async (error) => {
  try {
    await restoreProxy();
  } catch (restoreError) {
    console.error("Failed to restore proxy file after OpenNext build.", restoreError);
  }
  console.error(error);
  process.exit(1);
});
