# Markdown resume import

Open **My resumes → Import resume → Import Markdown**. Upload a UTF-8 `.md` or
`.markdown` file, or paste the complete document. The limit is 128 KiB and 30,000
characters. The selected text-assistant model is used; if none is configured, the
selected PDF model can process the document as text. No extra model setting is
stored or migrated.

## Model owns document interpretation

The entire source document is sent to `/api/resume-import` with
`format: "markdown"`. It is passed unchanged in the user message to the selected
model, alongside a system-level resume-content contract. No Markdown parser,
heading matcher, regular-expression field extraction, or local fallback is used.
Existing resumes are not sent as context. Document content is treated as data,
including any instructions inside that document. Referenced images and URLs are
not downloaded or recognized in this version.

The extraction contract contains basic/contact fields, education, experience,
projects, publications, skills, self-evaluation and additional sections. Contact
links use `basic.customFields`; awards, textual certificates and other content
use `customSections`. Unknown headings are interpreted by the model, not matched
against a hardcoded heading list.

`src/lib/resume-import-schema.ts` validates returned JSON against this contract;
its built-in field names are checked against the editor's TypeScript types.
Validation only checks structure and normalizes optional missing values. It does
not extract facts from the source or infer replacements for model fields.
Invalid/empty/truncated output reports an error and requires an explicit retry.

## Review before saving

All extracted text, including additional sections and detailed bullets, is shown
in a scrollable review. **Back to document** preserves the Markdown draft for
editing and another model request. Parsing can be cancelled; stale responses
cannot open a review or create a resume. Closing the review does not save data.

Only **Create resume** converts the validated content to a new editor document.
The app generates IDs and editor settings, escapes text before building rich-text
HTML, and leaves photos/logos empty. The current resume and other saved resumes
are not overwritten. PDF extraction shares the expanded content contract and
review, while exported JSON imports retain their existing restoration flow.

## Verification

```sh
pnpm test:markdown-import
pnpm test:ai
# Start a fresh dev server before browser checks:
pnpm test:markdown-import-ui
pnpm build
```

Tests mock model responses and do not use real API keys. They verify complete
source forwarding across all four API protocols, validation failure without
fallback extraction, safe editor conversion, preview/confirmation, cancellation,
draft preservation and retry. Actual extraction quality depends on the chosen
model and must be assessed with real resume documents separately.
