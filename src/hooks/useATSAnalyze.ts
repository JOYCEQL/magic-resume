import { useCallback } from "react";
import { useTranslations } from "@/i18n/compat/client";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { useResumeStore } from "@/store/useResumeStore";
import { useATSStore, type ATSResult } from "@/store/useATSStore";
import { AI_MODEL_CONFIGS } from "@/config/ai";
import { extractATSSections, hasContent } from "@/lib/ats";

interface RawATSResponse {
  overall?: number;
  language?: string;
  sections?: Record<
    string,
    {
      score?: number;
      summary?: string;
      suggestions?: string[];
    }
  >;
}

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function useATSAnalyze() {
  const t = useTranslations("atsAnalyzer");
  const {
    selectedModel,
    doubaoApiKey,
    doubaoModelId,
    deepseekApiKey,
    deepseekModelId,
    openaiApiKey,
    openaiModelId,
    openaiApiEndpoint,
    geminiApiKey,
    geminiModelId,
    isConfigured
  } = useAIConfigStore();
  const { setAnalyzing, setResult, setError } = useATSStore();
  const { activeResume } = useResumeStore();

  const run = useCallback(async () => {
    if (!activeResume?.id) return;
    if (!isConfigured()) {
      setError(null);
      return false;
    }

    setAnalyzing(true);
    try {
      const allSections = extractATSSections(activeResume);
      const sections: Record<string, string> = {};
      for (const [k, v] of Object.entries(allSections)) {
        if (hasContent(v)) sections[k] = v;
      }

      if (Object.keys(sections).length === 0) {
        setError(t("error.generic"));
        return false;
      }

      const config = AI_MODEL_CONFIGS[selectedModel];
      const apiKey =
        selectedModel === "doubao"
          ? doubaoApiKey
          : selectedModel === "openai"
          ? openaiApiKey
          : selectedModel === "gemini"
          ? geminiApiKey
          : deepseekApiKey;
      const modelId =
        selectedModel === "doubao"
          ? doubaoModelId
          : selectedModel === "openai"
          ? openaiModelId
          : selectedModel === "gemini"
          ? geminiModelId
          : deepseekModelId;

      const response = await fetch("/api/ats-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          model: config.requiresModelId ? modelId : config.defaultModel,
          modelType: selectedModel,
          apiEndpoint: selectedModel === "openai" ? openaiApiEndpoint : undefined,
          sections
        })
      });

      if (!response.ok) {
        let msg = t("error.generic");
        try {
          const data = await response.json();
          if (data?.error?.message) msg = data.error.message;
        } catch {
          /* ignore */
        }
        setError(msg);
        return false;
      }

      const payload = (await response.json()) as { result?: RawATSResponse };
      const raw = payload.result;
      if (!raw || !raw.sections) {
        setError(t("error.parse"));
        return false;
      }

      const normalizedSections: ATSResult["sections"] = {};
      for (const [id, value] of Object.entries(raw.sections)) {
        normalizedSections[id] = {
          score: clampScore(value?.score),
          summary: typeof value?.summary === "string" ? value.summary : "",
          suggestions: Array.isArray(value?.suggestions)
            ? value.suggestions.filter((s) => typeof s === "string" && s.trim().length > 0)
            : []
        };
      }

      const overall = clampScore(raw.overall);

      setResult(activeResume.id, {
        overall,
        language: raw.language,
        sections: normalizedSections
      });
      return true;
    } catch (e) {
      setError(t("error.generic"));
      return false;
    }
  }, [
    activeResume,
    isConfigured,
    selectedModel,
    doubaoApiKey,
    doubaoModelId,
    deepseekApiKey,
    deepseekModelId,
    openaiApiKey,
    openaiModelId,
    openaiApiEndpoint,
    geminiApiKey,
    geminiModelId,
    setAnalyzing,
    setResult,
    setError,
    t
  ]);

  return { run };
}
