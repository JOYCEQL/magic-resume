# Font loading

Resume families, characters, outlines and layout metrics remain unchanged. The
browser and export helpers both use the same full-character WOFF2 files. The
original TTF/OTF files remain available for existing references and regeneration.
Homepage font subsets are separate and must not be used for user resume text.

## Loading behavior

- Dashboard chrome uses its existing system font and the locally hosted Newsreader
  heading font. There are no runtime requests to Google Fonts.
- There is no unconditional resume font preload in the document head.
- Resume cards mount their real preview within 200 px of the viewport, retaining
  it after its first appearance. CSS loads only the families/weights used there.
- Pointer entry or keyboard focus on a card warms its selected family. Direct
  workbench entry and changing the selected font also warm that family, without
  awaiting downloads before rendering the editor.
- Repeated warm requests share a promise; failed loads can be retried. CSS and the
  browser's font set reuse the same font URLs during client-side navigation.
- Print and export CSS resolve to the same WOFF2 files as the on-screen preview.
  Existing asset/font readiness checks remain in place before capturing output.

Cold font downloads still depend on the visitor's network. A fallback can appear
briefly with `font-display: swap`; loading does not gate editor controls. This
change does not establish the cause of any particular visitor's loading spinner.

## Regeneration

Install `fonttools` and `brotli` in a Python virtual environment, then run:

```sh
python scripts/generate-resume-fonts.py
```

The script packages all ten existing resume faces without subsetting, verifies
the full character map and advance widths, and writes `src/app/font.css` plus
`src/generated/resume-fonts.json`. Use the manifest from `src/utils/fonts.ts` so
CSS and export URLs cannot drift. MiSans weight 700 uses the existing Medium
file, matching the original on-screen CSS (there is no `MiSans-Bold.ttf`).

Newsreader v26 files are the same Google Fonts WOFF2 responses used by the live
site, with normal/italic styles, weight and optical-size axes, and all three
Unicode subsets retained. Original URLs are recorded in
`public/fonts/ui/newsreader-sources.json`; the OFL license is alongside them.

WOFF2 filenames contain their SHA-256 prefix. `public/_headers` gives these assets
a one-year immutable cache on Cloudflare Workers Static Assets; `server.mjs`
applies the same policy when self-hosted. When font bytes change, regenerate the
filename and update references rather than replacing a cached file in place.

With the dev server running, `pnpm test:fonts` checks empty-list requests,
offscreen fonts, reuse on editor navigation, and editing during a stalled font
download. `pnpm test:preview` checks document layout and export/print agreement.
