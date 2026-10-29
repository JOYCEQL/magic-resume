import { mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Keep the original public images for social previews and reproducible exports.
const output = new URL("../src/assets/landing/", import.meta.url);
await mkdir(output, { recursive: true });
for (const width of [640, 1280, 2560]) {
  const result = await sharp(fileURLToPath(new URL("../public/web-shot.png", import.meta.url)))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 85, effort: 6 })
    .toFile(fileURLToPath(new URL(`editor-${width}.webp`, output)));
  console.log(`editor-${width}.webp: ${result.size} bytes`);
}
await sharp(fileURLToPath(new URL("../public/landing/unfold.webp", import.meta.url)))
  .resize({ width: 768 })
  .webp({ quality: 85, effort: 6 })
  .toFile(fileURLToPath(new URL("unfold-768.webp", output)));
await copyFile(
  new URL("../public/landing/unfold.webp", import.meta.url),
  new URL("unfold-1536.webp", output),
);
