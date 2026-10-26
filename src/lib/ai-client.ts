import type { AIConnection } from "@/config/ai-models";
import { useAIConfigStore } from "@/store/useAIConfigStore";

/** Shared client boundary; request bodies and error rendering stay with callers. */
export async function fetchAIClient(
  connection: Pick<AIConnection, "provider" | "apiKey">,
  url: string,
  options: RequestInit,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const apiKey = connection.apiKey.trim();
  const generations = new Set(
    connection.provider === "orcarouter" && apiKey
      ? useAIConfigStore.getState().models
          .filter((model) => model.provider === "orcarouter" && model.apiKey.trim() === apiKey)
          .map((model) => model.generation ?? 0)
      : [],
  );
  const response = await fetcher(url, options);
  // 402 is credit exhaustion and 403 is model access denial, neither revokes a key.
  if (response.status === 401 && !options.signal?.aborted) {
    for (const generation of Array.from(generations)) {
      const state = useAIConfigStore.getState();
      if (state.models.some((model) =>
        model.provider === "orcarouter" && model.apiKey.trim() === apiKey &&
        (model.generation ?? 0) === generation,
      )) {
        state.markNeedsReauth("orcarouter", generation);
      }
    }
  }
  return response;
}
