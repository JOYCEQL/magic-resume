import { useEffect, useState } from "react";

let cachedStars: number | null = null;
let fetchedAt = 0;
let pending: Promise<number | null> | null = null;

function fetchStars() {
  if (Date.now() - fetchedAt < 10 * 60 * 1000) {
    return Promise.resolve(cachedStars);
  }
  // Both header variants can be mounted at once; share their request and bound
  // the wait so an unreachable GitHub API never keeps loading indefinitely.
  pending ??= fetch("https://api.github.com/repos/JOYCEQL/magic-resume", {
    signal: AbortSignal.timeout(4000),
  })
    .then(async (response) => {
      if (!response.ok) return cachedStars;
      const data = await response.json();
      if (typeof data.stargazers_count === "number") cachedStars = data.stargazers_count;
      return cachedStars;
    })
    .catch(() => cachedStars)
    .finally(() => {
      fetchedAt = Date.now();
      pending = null;
    });
  return pending;
}

export function useGitHubStars(defer = false) {
  // Keep the first render deterministic for static HTML hydration.
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => {
      void fetchStars().then((value) => { if (active) setStars(value); });
    };
    // This count is decorative; give the first paint and page resources priority.
    const timer = window.setTimeout(load, defer ? 2000 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [defer]);
  return stars;
}
