import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MAX_OUTPUT_BYTES = 1_000_000;
const SAFE_ENV_KEYS = [
  "HOME",
  "PATH",
  "CODEX_HOME",
  "TMPDIR",
  "LANG",
  "LC_ALL",
  "SSL_CERT_FILE",
  "SSL_CERT_DIR",
  "HTTPS_PROXY",
  "HTTP_PROXY",
  "NO_PROXY",
  "ALL_PROXY",
] as const;

export const codexEnvironment = (source: NodeJS.ProcessEnv) => {
  const result: NodeJS.ProcessEnv = { NO_COLOR: "1", TERM: "dumb" };
  for (const key of SAFE_ENV_KEYS) {
    if (source[key]) result[key] = source[key];
  }
  return result;
};

export const codexArguments = (
  model: string,
  schemaPath: string,
  outputPath: string,
  workdir: string,
) => [
  "exec",
  "--ephemeral",
  "--ignore-user-config",
  "--ignore-rules",
  "--skip-git-repo-check",
  "--sandbox", "read-only",
  "--disable", "shell_tool",
  "--disable", "apps",
  "--disable", "browser_use",
  "--disable", "computer_use",
  "--disable", "image_generation",
  "--disable", "multi_agent",
  "-c", "web_search=\"disabled\"",
  "--model", model,
  "--output-schema", schemaPath,
  "--output-last-message", outputPath,
  "--cd", workdir,
  "-",
];

interface CodexStructuredOutputOptions {
  prompt: string;
  schema: Record<string, unknown>;
  model: string;
  timeoutMs?: number;
}

export async function runCodexStructuredOutput({
  prompt,
  schema,
  model,
  timeoutMs = 300_000,
}: CodexStructuredOutputOptions) {
  if (!prompt || prompt.length > 250_000 || !/^[a-z0-9._-]+$/i.test(model)) {
    throw new Error("INVALID_CODEX_REQUEST");
  }

  const workdir = await mkdtemp(join(tmpdir(), "magic-resume-codex-"));
  const schemaPath = join(workdir, "schema.json");
  const outputPath = join(workdir, "result.json");
  await writeFile(schemaPath, JSON.stringify(schema), { mode: 0o600 });

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        "codex",
        codexArguments(model, schemaPath, outputPath, workdir),
        {
          cwd: workdir,
          env: codexEnvironment(process.env),
          stdio: ["pipe", "ignore", "pipe"],
        },
      );
      let stderrBytes = 0;
      child.stderr.on("data", (chunk: Buffer) => {
        stderrBytes += chunk.byteLength;
        if (stderrBytes > MAX_OUTPUT_BYTES) child.kill("SIGKILL");
      });
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("UPSTREAM_TIMEOUT"));
      }, timeoutMs);
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.once("close", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(stderrBytes > MAX_OUTPUT_BYTES ? "CODEX_OUTPUT_TOO_LARGE" : `CODEX_EXIT_${code}`));
      });
      child.stdin.end(prompt);
    });

    const output = await readFile(outputPath, "utf8");
    if (Buffer.byteLength(output) > MAX_OUTPUT_BYTES) throw new Error("CODEX_OUTPUT_TOO_LARGE");
    return JSON.parse(output) as Record<string, unknown>;
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}
