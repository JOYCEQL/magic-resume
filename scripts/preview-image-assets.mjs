import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Hashed URLs are safe to cache immutably. Keep originals for older clients.
export async function writeWebpAsset(input, stem, width, quality) {
  const bytes = await sharp(input)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toBuffer();
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
  const url = `${stem}.${digest}.webp`;
  const output = path.join(process.cwd(), "public", url);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bytes);
  return { url, bytes: bytes.length };
}
