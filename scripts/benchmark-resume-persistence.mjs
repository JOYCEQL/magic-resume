// Run against a fresh Vite dev server. Each strategy uses the same fixture and
// real Chromium localStorage; forced flushes exclude debounce's extra savings.
import { chromium } from "playwright";

const origin = process.env.PREVIEW_TEST_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.route("**/__resume-benchmark__", route => route.fulfill({
    contentType: "text/html", body: "<!doctype html><title>Persistence benchmark</title>",
  }));
  await page.goto(`${origin}/__resume-benchmark__`);
  const result = await page.evaluate(async () => {
    const { initialResumeState } = await import("/src/config/initialResumeData.ts");
    const { createResumePersistence } = await import("/src/store/resumePersistence.ts");
    const fixture = Object.fromEntries(Array.from({ length: 24 }, (_, i) => {
      const id = `resume-${i}`;
      return [id, { ...structuredClone(initialResumeState), id }];
    }));
    const trials = { wholeStore: [], incremental: [] };
    for (let trial = 0; trial < 5; trial++) {
      for (const strategy of trial % 2 ? ["incremental", "wholeStore"] : ["wholeStore", "incremental"]) {
        localStorage.clear();
        let resumes = structuredClone(fixture);
        let bytes = 0, writes = 0;
        const local = {
          getItem: key => localStorage.getItem(key),
          removeItem: key => localStorage.removeItem(key),
          setItem: (key, value) => {
            bytes += new TextEncoder().encode(value).length;
            writes++;
            localStorage.setItem(key, value);
          },
        };
        const persistence = createResumePersistence({ getStorage: () => local, onError: (_key, error) => { throw error; } });
        const snapshot = () => ({ state: { resumes, activeResumeId: "resume-0" }, version: 0 });
        const save = () => {
          if (strategy === "wholeStore") local.setItem("resume-storage", JSON.stringify(snapshot()));
          else {
            persistence.storage.setItem("resume-storage", snapshot());
            persistence.flush();
          }
        };
        save();
        bytes = writes = 0;
        const started = performance.now();
        for (let edit = 0; edit < 100; edit++) {
          resumes = { ...resumes, "resume-0": { ...resumes["resume-0"], title: `Edit ${edit}` } };
          save();
        }
        trials[strategy].push({ milliseconds: performance.now() - started, bytes, writes });
      }
    }
    const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
    return {
      fixture: "24 default resumes, 100 title edits, 5 alternating trials, explicit flush after every edit",
      ...Object.fromEntries(Object.entries(trials).map(([name, rows]) => [name, {
        medianMs: Number(median(rows.map(row => row.milliseconds)).toFixed(2)),
        bytesWritten: rows[0].bytes,
        writes: rows[0].writes,
      }])),
    };
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
