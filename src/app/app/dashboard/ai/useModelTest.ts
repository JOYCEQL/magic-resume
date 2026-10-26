import { fetchAIClient } from "@/lib/ai-client";
import { useEffect, useRef, useState } from "react";
import { toAIConnection, type AIModelProfile } from "@/config/ai-models";
import { combineAbortSignals } from "@/lib/abort-signal";
import { ResumeImportError } from "@/lib/resume-import-schema";

export type ModelTestState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "success" }
  | { status: "error"; error: unknown };

export function useModelTest(profile: AIModelProfile) {
  const [state, setState] = useState<ModelTestState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const { provider, protocol, apiKey, model, baseUrl } = profile;
  useEffect(() => {
    revision.current += 1;
    controller.current?.abort();
    setState({ status: "idle" });
    return () => {
      revision.current += 1;
      controller.current?.abort();
    };
  }, [provider, protocol, apiKey, model, baseUrl]);

  const run = async () => {
    const currentRevision = ++revision.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setState({ status: "running" });
    try {
      const connection = toAIConnection(profile);
      const response = await fetchAIClient(profile, "/api/ai-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection }),
        signal: combineAbortSignals([
          abort.signal,
          AbortSignal.timeout(130_000),
        ]),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok)
        throw new ResumeImportError(data?.code || "upstreamError", response.status, data?.upstream);
      if (revision.current === currentRevision)
        setState({ status: "success" });
    } catch (error) {
      if (revision.current === currentRevision)
        setState({
          status: "error",
          error:
            error instanceof ResumeImportError
              ? error
              : new ResumeImportError(
                  error instanceof Error && error.name === "TimeoutError"
                    ? "timeout"
                    : "networkError",
                ),
        });
    }
  };
  return { state, run };
}
