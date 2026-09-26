# Tests

## Existing Node tests

```sh
pnpm test:ai
```

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
