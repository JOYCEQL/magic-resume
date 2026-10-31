import assert from "node:assert/strict";
import test from "node:test";
import {
  createResumePersistence,
  RESUME_STORAGE_KEY as LEGACY,
  RESUME_INDEX_KEY as INDEX,
  RESUME_DOC_PREFIX as DOC,
} from "../src/store/resumePersistence";

type Resume = { id: string; content: string };
const snapshot = (resumes: Record<string, Resume>, activeResumeId = Object.keys(resumes)[0] ?? null) => ({
  state: { resumes, activeResumeId }, version: 0,
});
const resume = (id: string, size = 100): Resume => ({ id, content: id.repeat(size) });

function fixture(quota = Infinity) {
  const data = new Map<string, string>();
  const writes: string[] = [];
  const errors: string[] = [];
  const fail = new Set<string>();
  const local = {
    getItem: (key: string) => data.get(key) ?? null,
    removeItem: (key: string) => { data.delete(key); },
    setItem: (key: string, value: string) => {
      writes.push(key);
      const next = new Map(data).set(key, value);
      const size = [...next].reduce((total, [k, v]) => total + k.length + v.length, 0);
      if (fail.has(key) || size > quota) throw new Error("QuotaExceededError");
      data.set(key, value);
    },
  };
  const open = () => createResumePersistence<Resume>({
    getStorage: () => local, onError: key => errors.push(key), debounceMs: 10,
  });
  return { data, writes, errors, fail, local, open };
}

test("migration keeps the only original when quota cannot hold two copies", async () => {
  const f = fixture(1600);
  const original = snapshot({ A: resume("A", 1000) });
  f.local.setItem(LEGACY, JSON.stringify(original));
  const persistence = f.open();
  assert.deepEqual(await persistence.storage.getItem(LEGACY), original);
  assert.equal(f.data.get(LEGACY), JSON.stringify(original));
  assert.deepEqual([...f.data.keys()], [LEGACY]);
  const edited = snapshot({ A: { id: "A", content: "edited" } });
  persistence.storage.setItem(LEGACY, edited);
  assert.equal(persistence.flush(), true);
  assert.deepEqual(await f.open().storage.getItem(LEGACY), edited);
});

test("partial migration rolls back copies when a later document fails", async () => {
  const f = fixture();
  const original = snapshot({ A: resume("A"), B: resume("B") });
  f.data.set(LEGACY, JSON.stringify(original));
  f.fail.add(DOC + "B");
  assert.deepEqual(await f.open().storage.getItem(LEGACY), original);
  assert.deepEqual([...f.data.keys()], [LEGACY]);
});

test("index migration failure preserves the original and is retryable next visit", async () => {
  const f = fixture();
  const original = snapshot({ A: resume("A"), B: resume("B") }, "B");
  f.data.set(LEGACY, JSON.stringify(original));
  f.fail.add(INDEX);
  await f.open().storage.getItem(LEGACY);
  assert.deepEqual([...f.data.keys()], [LEGACY]);
  f.fail.clear();
  assert.deepEqual(await f.open().storage.getItem(LEGACY), original);
  assert.equal(f.data.has(LEGACY), false);
  assert.deepEqual(await f.open().storage.getItem(LEGACY), original);
});

test("deleting another resume frees quota and retries a previously failed edit", async () => {
  const f = fixture(2400);
  const p = f.open();
  const A = resume("A", 500), B = resume("B", 800);
  p.storage.setItem(LEGACY, snapshot({ A, B }));
  const changedA = resume("A", 1800);
  p.storage.setItem(LEGACY, snapshot({ A: changedA, B }));
  assert.equal(p.flush(), false);
  assert.equal(JSON.parse(f.data.get(DOC + "A")!).content.length, 500);
  p.storage.setItem(LEGACY, snapshot({ A: changedA }));
  assert.equal(p.flush(), true);
  assert.deepEqual(await f.open().storage.getItem(LEGACY), snapshot({ A: changedA }));
  assert.equal(f.data.has(DOC + "B"), false);
});

test("a failed new document is not published in the index", async () => {
  const f = fixture();
  const p = f.open();
  const A = resume("A"), B = resume("B");
  p.storage.setItem(LEGACY, snapshot({ A }));
  f.fail.add(DOC + "B");
  p.storage.setItem(LEGACY, snapshot({ A, B }, "B"));
  assert.deepEqual(await f.open().storage.getItem(LEGACY), snapshot({ A }));
  f.fail.clear();
  assert.equal(p.flush(), true);
  assert.deepEqual(await f.open().storage.getItem(LEGACY), snapshot({ A, B }, "B"));
});

test("index failure retains a retry without rewriting successful documents", async () => {
  const f = fixture();
  const p = f.open();
  const value = snapshot({ A: resume("A") });
  f.fail.add(INDEX);
  p.storage.setItem(LEGACY, value);
  f.fail.clear();
  f.writes.length = 0;
  assert.equal(p.flush(), true);
  assert.deepEqual(f.writes, [INDEX]);
  assert.deepEqual(await f.open().storage.getItem(LEGACY), value);
});

test("a failed deletion index keeps the previously referenced document", async () => {
  const f = fixture();
  const p = f.open();
  const A = resume("A"), B = resume("B");
  p.storage.setItem(LEGACY, snapshot({ A, B }));
  f.fail.add(INDEX);
  p.storage.setItem(LEGACY, snapshot({ A }));
  assert.equal(f.data.has(DOC + "B"), true);
  assert.deepEqual(await f.open().storage.getItem(LEGACY), snapshot({ A, B }));
  f.fail.clear();
  assert.equal(p.flush(), true);
  assert.deepEqual(await f.open().storage.getItem(LEGACY), snapshot({ A }));
});

test("rapid edits coalesce and lifecycle flush saves the latest value", async () => {
  const f = fixture();
  const p = f.open();
  p.storage.setItem(LEGACY, snapshot({ A: resume("A") }));
  f.writes.length = 0;
  for (let i = 0; i < 10; i++) p.storage.setItem(LEGACY, snapshot({ A: resume("A", i + 1) }));
  assert.deepEqual(f.writes, []);
  p.flush();
  assert.deepEqual(f.writes, [DOC + "A"]);
  assert.deepEqual(await f.open().storage.getItem(LEGACY), snapshot({ A: resume("A", 10) }));
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.deepEqual(f.writes, [DOC + "A"]);
});

test("debounce expiry persists without an explicit flush", async () => {
  const f = fixture();
  const p = f.open();
  p.storage.setItem(LEGACY, snapshot({ A: resume("A") }));
  const changed = snapshot({ A: resume("A", 50) });
  p.storage.setItem(LEGACY, changed);
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.deepEqual(await f.open().storage.getItem(LEGACY), changed);
});

test("clearStorage cancels a queued write instead of resurrecting deleted data", async () => {
  const f = fixture();
  const p = f.open();
  p.storage.setItem(LEGACY, snapshot({ A: resume("A") }));
  p.storage.setItem(LEGACY, snapshot({ A: resume("A", 50) }));
  p.storage.removeItem(LEGACY);
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(await f.open().storage.getItem(LEGACY), null);
  assert.equal(f.data.size, 0);
});

test("an unchanged resume is not rewritten when another resume is edited", () => {
  const f = fixture();
  const p = f.open();
  const resumes = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [String(i), resume(String(i), 1000)]));
  p.storage.setItem(LEGACY, snapshot(resumes));
  f.writes.length = 0;
  p.storage.setItem(LEGACY, snapshot({ ...resumes, "0": resume("0", 2000) }));
  p.flush();
  assert.deepEqual(f.writes, [DOC + "0"]);
});

test("blocked localStorage access does not throw during hydration or saving", async () => {
  const p = createResumePersistence<Resume>({
    getStorage: () => { throw new Error("SecurityError"); }, onError: () => {},
  });
  assert.equal(await p.storage.getItem(LEGACY), null);
  p.storage.setItem(LEGACY, snapshot({ A: resume("A") }));
  assert.equal(p.flush(), false);
});
