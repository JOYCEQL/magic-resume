# Loading performance

The default avatar is a 1024 × 1024 WebP (71,892 bytes), down from the original
PNG (1,497,069 bytes). `getResumePhotoSrc` resolves the legacy `/avatar.png` URL
when rendering templates, the editor photo selector, and the photo drawer.
Saved resume data and custom photo URLs are not rewritten. The original PNG
remains available for older clients.

Template picker thumbnails use 794 px wide WebP images instead of 1588 px wide
PNGs. The 18 Chinese/English thumbnails total 1,716,238 bytes, down from
9,514,179 bytes. The full template preview remains rendered from resume data;
only the grid thumbnails use these images. The pickers use native lazy image
loading and no longer prefetch every thumbnail when their trigger is hovered.

Both image types have content hashes in their filenames and one-year immutable
cache headers in Cloudflare's `public/_headers` and the standalone Node server.
Keep earlier hashed images available for existing backups and open browser tabs.

## Asset generation

With project dependencies installed and Node 22:

```sh
pnpm optimize:preview-images
```

This converts `public/avatar.png` and the original template PNGs and updates the
generated URL manifests. After changing template design, use
`pnpm generate:template-snapshots`; it captures fresh PNG sources and creates the
same WebP thumbnails. Resume fonts and exported document layout are unchanged.

## Hydration

Browser-only app services (local folder synchronization and toast UI) mount after
hydration. This avoids a server-rendered lazy Suspense boundary receiving theme
updates before its JavaScript arrives, which caused React error #421 on slow
connections. App font/editor/toast styles are declared in the document head so
their downloads do not wait for the service chunk. Public pages still omit them.

## Verification

The dashboard warms the rich-text editor as soon as it mounts. The workbench
route awaits the same cached request before showing editing controls, including
direct links and newly created resumes. Pending navigation has a loading message;
a failed download offers a reload. This avoids an apparently editable blank box
while the editor bundle is still downloading. Resume fonts remain nonblocking.

`tests/editor-loading.browser.mjs` works against either dev or production. It
holds the editor download to check the loading state, tests dashboard warm-up and
failed-download recovery, and verifies Chinese/English input and persisted
custom descriptions in desktop Chromium and mobile Chromium/WebKit emulation.

Use a production build for the slow-network regression (1.6 Mbps down, 150 ms
additional latency, cache disabled):

```sh
pnpm build
PORT=3012 HOSTNAME=127.0.0.1 pnpm start
PREVIEW_TEST_URL=http://127.0.0.1:3012 node --test tests/loading.browser.mjs
PREVIEW_TEST_URL=http://127.0.0.1:3012 node --test tests/editor-loading.browser.mjs
```

Against a fresh development server, run `tests/fonts.browser.mjs` and
`tests/preview.browser.mjs` to verify offscreen fonts, editing during stalled
downloads, pagination, and PDF parity. Restart the dev server after source edits:
these tests dynamically import the store and need the same module instance as
the UI, without stale HMR module URLs.

These changes reduce transferred resources and repeated rendering. They do not
change Cloudflare routing, DNS, or connectivity from mainland Chinese networks.
Domestic regional and carrier measurements must be repeated after deployment;
local network throttling is not a substitute for those measurements.
