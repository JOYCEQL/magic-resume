# Tests

## Existing Node tests

```sh
pnpm test:ai
```

This includes the numeric-content import regression tests in
`resume-import-content.test.ts` and the existing AI/import tests.

## OrcaRouter provider

`tests/orcarouter-auth.test.ts` and `tests/orcarouter-catalog.test.ts` are part of
`pnpm test:ai` and run with fake credentials only: they cover the API-key and PKCE
credential adapters, the authorize/exchange contract, catalog parsing and the
per-capability model filters.

`tests/orcarouter-live.test.ts` is part of the same command but skips itself unless
`ORCAROUTER_API_KEY` is set, and then talks to `https://api.orcarouter.ai/v1`. It
checks that the live catalog is namespaced, that the multimodal filter is a strict
subset of the text list, that a request through the server's own OrcaRouter path
succeeds, and that a rejected key is reported as an authentication error. Live
counts are printed by the suite itself rather than asserted, so the catalog can
grow without breaking the tests.

## Mobile workbench regression

With a production server running (`pnpm build && pnpm start`), install both
browsers and run:

```sh
pnpm exec playwright install chromium webkit
pnpm test:mobile
```

Use production mode to avoid the development-only React Grab overlay intercepting
touch input. Set `TEST_BASE_URL` to use another server address. The suite checks tab switching,
short and narrow viewports, simulated 34px bottom insets, editing, desktop layout,
and releasing the page scroll lock when leaving the workbench in Chromium and
WebKit. Viewport resizing approximates available-space changes; physical iOS
keyboard and Safari toolbar behavior still require a device check.

## Body font size browser regression

Requires Node.js 20.19+ (or a supported newer release), the project's pnpm
dependencies, and a Playwright Chromium browser:

```sh
pnpm install --frozen-lockfile
pnpm install:playwright
```

On Linux CI, install browser system dependencies with
`pnpm exec playwright install --with-deps chromium`.

Start the **development** server in one terminal, then run the test in another:

```sh
pnpm dev --host 127.0.0.1 --port 3000 --strictPort
```

```sh
pnpm test:font-size
```

The test uses Vite module imports to exercise existing export and import functions,
so a production/preview server cannot replace the development server. Set
`TEST_BASE_URL` if the development server uses a different address. Optionally set
`TEST_BROWSER_CHANNEL` to `msedge` or `chrome` to use an installed browser instead
of Playwright's bundled Chromium. For example, in PowerShell:

```powershell
$env:TEST_BROWSER_CHANNEL = 'msedge'
pnpm test:font-size
```

Each run creates an isolated browser context and synthetic resume data; it does
not modify resumes in an existing browser session. Screenshots are written under
`node_modules/.cache/font-size/` and should not be committed. The test requires
the local application to load; font and image assets referenced by its sample
resume may require network access.

Coverage includes mouse selection, partial and mixed sizes, default/reset,
formatting preservation, cross-list selections, undo/redo, persistence, global
size inheritance, unchanged section headings, English labels, narrow toolbars,
all nine templates and six body editor entry points. JSON export is downloaded
and passed back through the store's import function. The test also checks a local
long-page PDF download and captures the browser-print document without opening a
print dialog.

The PDF check validates download generation, not visual correctness of every PDF
page. The external PDF service is not contacted. Review screenshots and actual
export layout separately when changing typography or pagination.
