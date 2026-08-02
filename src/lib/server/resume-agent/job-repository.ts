import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type {
  ResumeAgentJob,
  ResumeAgentJobEvent,
  ResumeAgentJobStatus,
} from "@/types/resume-agent";

const STORE_DIRECTORY =
  process.env.RESUME_AGENT_STORE_DIRECTORY ||
  join(process.cwd(), ".data", "resume-agent");
const JOBS_FILE = join(STORE_DIRECTORY, "jobs.json");
const EVENTS_FILE = join(STORE_DIRECTORY, "events.json");

interface StoreData {
  jobs: Record<string, ResumeAgentJob>;
  events: Record<string, ResumeAgentJobEvent[]>;
}

const emptyStore = (): StoreData => ({ jobs: {}, events: {} });
let queue: Promise<unknown> = Promise.resolve();

const serialized = <T>(operation: () => Promise<T>) => {
  const result = queue.then(operation, operation);
  queue = result.catch(() => undefined);
  return result;
};

const readJson = async <T>(path: string, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || error instanceof SyntaxError) return fallback;
    throw error;
  }
};

const readStore = async (): Promise<StoreData> => {
  const [jobs, events] = await Promise.all([
    readJson<Record<string, ResumeAgentJob>>(JOBS_FILE, {}),
    readJson<Record<string, ResumeAgentJobEvent[]>>(EVENTS_FILE, {}),
  ]);
  return { jobs, events };
};

const writeAtomic = async (path: string, value: unknown) => {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, path);
};

const writeStore = async (store: StoreData) => {
  await Promise.all([
    writeAtomic(JOBS_FILE, store.jobs),
    writeAtomic(EVENTS_FILE, store.events),
  ]);
};

const clone = <T>(value: T): T => structuredClone(value);

export const createJob = (job: ResumeAgentJob) =>
  serialized(async () => {
    const store = await readStore();
    store.jobs[job.id] = clone(job);
    store.events[job.id] = [];
    await writeStore(store);
    return clone(job);
  });

export const getJob = (jobId: string) =>
  serialized(async () => {
    const store = await readStore();
    return store.jobs[jobId] ? clone(store.jobs[jobId]) : null;
  });

export const listJobEvents = (jobId: string, afterSequence = 0) =>
  serialized(async () => {
    const store = await readStore();
    return clone(
      (store.events[jobId] || []).filter(
        (event) => event.sequence > afterSequence
      )
    );
  });

export const saveJob = (job: ResumeAgentJob) =>
  serialized(async () => {
    const store = await readStore();
    if (!store.jobs[job.id]) throw new Error("Resume Agent Job 不存在");
    store.jobs[job.id] = clone(job);
    await writeStore(store);
    return clone(job);
  });

export const updateJob = (
  jobId: string,
  update: (job: ResumeAgentJob) => ResumeAgentJob
) =>
  serialized(async () => {
    const store = await readStore();
    const current = store.jobs[jobId];
    if (!current) throw new Error("Resume Agent Job 不存在");
    const next = update(clone(current));
    store.jobs[jobId] = clone(next);
    await writeStore(store);
    return clone(next);
  });

export const appendJobEvent = (
  jobId: string,
  type: ResumeAgentJobEvent["type"],
  payload: Record<string, unknown>
) =>
  serialized(async () => {
    const store = await readStore();
    if (!store.jobs[jobId]) throw new Error("Resume Agent Job 不存在");
    const events = store.events[jobId] || [];
    const event: ResumeAgentJobEvent = {
      id: crypto.randomUUID(),
      jobId,
      sequence: (events.at(-1)?.sequence || 0) + 1,
      type,
      createdAt: new Date().toISOString(),
      payload,
    };
    events.push(event);
    store.events[jobId] = events.slice(-1000);
    await writeStore(store);
    return clone(event);
  });

export const setJobStatus = (
  jobId: string,
  status: ResumeAgentJobStatus,
  extra: Partial<ResumeAgentJob> = {}
) =>
  updateJob(jobId, (job) => ({
    ...job,
    ...extra,
    status,
    updatedAt: new Date().toISOString(),
  }));

export const resetJobStoreForTests = () =>
  serialized(async () => writeStore(emptyStore()));
