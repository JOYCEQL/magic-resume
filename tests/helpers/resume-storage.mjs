// Pass directly to page.evaluate. Exercise the real lifecycle flush instead of
// changing Storage.prototype to make old tests observe an in-memory snapshot.
export function readSavedResumeStorage() {
  window.dispatchEvent(new Event("pagehide"));
  const legacy = localStorage.getItem("resume-storage");
  if (legacy) return JSON.parse(legacy);
  const index = JSON.parse(localStorage.getItem("magic-resume-index") || "null");
  if (!index) return null;
  const resumes = Object.fromEntries(index.ids.flatMap(id => {
    const raw = localStorage.getItem(`magic-resume-doc:${id}`);
    return raw ? [[id, JSON.parse(raw)]] : [];
  }));
  return { state: { resumes, activeResumeId: index.activeResumeId }, version: index.version };
}
