# School logo search

Education → Logo settings → Find a school logo opens the lazily loaded search.
It searches University Logos by Chinese or English school name through our
`GET /api/school-logos?q=...&page=...` adapter. No school catalog is bundled.
New Chinese and English resumes have no prefilled education or company logos.
On local-storage hydration, only the old `/university.png` and `/company.png`
defaults are cleared; uploaded and explicitly selected images are retained.

The source website currently uses `POST https://universitylogos.top/superone/uni_logos`.
Its request parameters and headers are isolated in `src/lib/server/school-logos.ts`;
this is an internal website endpoint, so changes may require updating the adapter.
The source page for each result is linked from the search. University logos remain
the property of their institutions; see https://universitylogos.top/about.html.

## Request and rendering limits

- Search starts after 300 ms without input; fewer than two characters and active
  IME composition do not issue requests. Changing queries or closing the drawer
  cancels the previous request. A stale response cannot replace a newer query.
- The source's 12 results per page are shown in two groups of six. Showing the
  second group needs no additional metadata request. Only visible candidates
  are mounted, with lazy image loading and fixed thumbnail dimensions.
- Client memory cache: 40 pages, five minutes. Server cache: 64 pages, ten minutes
  per instance. Successful HTTP responses cache for five minutes. Failures are
  not cached or automatically retried; the user can retry or upload an image.
- Matching concurrent requests share an upstream fetch on Node. Workers share
  completed cached data only, respecting request-scoped I/O. At most 16 upstream
  requests can be active per server instance. Canceling the last waiter aborts
  upstream. The server timeout is eight seconds, the client timeout ten seconds,
  and upstream JSON responses are limited to 128 KiB.
- Selecting a logo fetches it through the existing same-origin image proxy,
  compresses it to a maximum of 200 × 200 px, and persists pixels in the resume.
  Previews and exports therefore do not repeat school searches or image downloads.
- Candidate thumbnails use that same proxy, so browsers never need to contact the
  source image host directly. Successful school images cache for one day in the
  browser and Cloudflare's upstream fetch cache; unsuccessful upstream statuses
  are not cached. Other image proxy requests keep their existing no-store policy.
- Node respects HTTP(S)_PROXY for public school metadata/images; Workers use
  native fetch. The API host and image paths in metadata are restricted to the
  source site. The application adds no new runtime dependencies.

## Sample logo provenance

`public/university.png` is a small preview of the public-domain
[Peking University seal](https://commons.wikimedia.org/wiki/File:Peking_University_seal.svg).
It remains a legacy asset and browser-test fixture, independently of online search.

## Verification

`pnpm test:ai` includes the adapter/client cache and cancellation tests.
With Vite running, `LOGO_TEST_URL=http://127.0.0.1:3000 node --test tests/logo.browser.mjs tests/school-logos.browser.mjs`
checks the drawer, search request counts, stale responses, pagination, retry,
IME input, persistence, all templates, and local PDF export in isolated contexts.
