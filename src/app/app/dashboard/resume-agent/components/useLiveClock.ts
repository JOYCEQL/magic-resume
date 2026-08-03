import { useEffect, useState } from "react";

/**
 * running 步骤需要秒表效果；步骤结束后由 step.durationMs 冻结，不再依赖本 hook。
 * 所有运行中的步骤共用同一个 1s tick，避免每个步骤各起一个 interval。
 */
export const useLiveClock = (enabled: boolean) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return now;
};
