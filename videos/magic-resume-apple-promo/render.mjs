// 逐帧渲染宣传片：Playwright 截帧 → ffmpeg 编码
// 用法：
//   node videos/magic-resume-apple-promo/render.mjs landscape [fps]
//   node videos/magic-resume-apple-promo/render.mjs portrait [fps]
//   node videos/magic-resume-apple-promo/render.mjs landscape --stills 1,4.2,9.5   (输出静帧用于检查)
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const orientation = args[0] === "portrait" ? "portrait" : "landscape";
const stillsIdx = args.indexOf("--stills");
const stills = stillsIdx >= 0 ? args[stillsIdx + 1].split(",").map(Number) : null;
const fps = Number(args.find((a, i) => i > 0 && /^\d+$/.test(a) && args[i - 1] !== "--stills") || 60);

const MIME = { ".html": "text/html; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".otf": "font/otf", ".js": "text/javascript" };
const server = createServer(async (req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = path.join(ROOT, rel === "/" ? "index.html" : rel);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const buf = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" }).end(buf);
  } catch {
    res.writeHead(404).end();
  }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const port = server.address().port;

const [W, H] = orientation === "portrait" ? [1080, 1920] : [1920, 1080];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => { console.error("[pageerror]", e); process.exitCode = 1; });
page.on("console", (m) => { if (m.type() === "error") console.error("[console]", m.text()); });
await page.goto(`http://127.0.0.1:${port}/index.html?o=${orientation}&render=1`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
const { DURATION } = await page.evaluate(() => window.__meta);

const outDir = path.join(ROOT, "renders");
await mkdir(outDir, { recursive: true });

if (stills) {
  const dir = path.join(outDir, "stills");
  await mkdir(dir, { recursive: true });
  for (const t of stills) {
    await page.evaluate((tt) => window.renderFrame(tt), t);
    const file = path.join(dir, `${orientation}-${t.toFixed(2)}.png`);
    await page.screenshot({ path: file });
    console.log(file);
  }
} else {
  const out = path.join(outDir, `magic-resume-promo-${orientation}-${fps}fps.mp4`);
  const ff = spawn("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    "-movflags", "+faststart", out,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const total = Math.round(DURATION * fps);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    await page.evaluate((tt) => window.renderFrame(tt), i / fps);
    const buf = await page.screenshot({ type: "png" });
    if (!ff.stdin.write(buf)) await once(ff.stdin, "drain");
    if (i % fps === 0) process.stdout.write(`\r${orientation}: ${i}/${total} 帧  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  const [code] = await once(ff, "close");
  if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
  console.log(`\n完成：${out}`);
}

await browser.close();
server.close();
