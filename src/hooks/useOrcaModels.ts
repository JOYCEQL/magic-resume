import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AI_PROVIDER_DEFINITIONS, createModelProfile, type AIModelProfile } from "@/config/ai-models";
import { useTranslations } from "@/i18n/compat/client";
import { fetchAIClient } from "@/lib/ai-client";
import { orcaChatOption, type OrcaOptionModel } from "@/lib/orcarouter/catalog";
import { useAIConfigStore } from "@/store/useAIConfigStore";

/** Owns OrcaRouter credentials, live discovery and model selection for settings. */
export function useOrcaModels(active: boolean) {
  const t = useTranslations("dashboard.settings.ai.workspace");
  const models = useAIConfigStore((state) => state.models);
  const textModelId = useAIConfigStore((state) => state.textModelId);
  const saveCredential = useAIConfigStore((state) => state.saveOrcaCredential);
  const [catalog, setCatalog] = useState<OrcaOptionModel[]>([]);
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const revision = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const autoFetched = useRef("");
  const credential = models.find((model) => model.provider === "orcarouter")
    ?? createModelProfile("orcarouter", "credential:orcarouter");
  const { apiKey, generation, needsReauth } = credential;
  const method = credential.authMethod ?? "api-key";

  useEffect(() => {
    revision.current += 1;
    controller.current?.abort();
    controller.current = null;
    autoFetched.current = "";
    setCatalog([]);
    setStatus("idle");
    setQuery("");
    setLoading(false);
    return () => {
      revision.current += 1;
      controller.current?.abort();
      controller.current = null;
      autoFetched.current = "";
    };
  }, [active, apiKey, generation, needsReauth, method]);

  const options = useMemo(() => {
    const search = query.trim().toLowerCase();
    return catalog.filter((entry) => orcaChatOption(entry)
      && `${entry.id} ${entry.name ?? ""}`.toLowerCase().includes(search));
  }, [catalog, query]);
  const selectedId = models.find((model) => model.provider === "orcarouter" && model.id === textModelId)?.model ?? "";

  const refresh = async () => {
    if (!active) return;
    if (!apiKey.trim()) {
      toast.error(t("orca.noCredential"));
      return;
    }
    if (needsReauth) {
      toast.error(t("orca.needsReauth"));
      return;
    }
    const requestRevision = ++revision.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setCatalog([]);
    try {
      const response = await fetchAIClient(credential, "/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "orcarouter", apiKey, capability: "chat", modalities: "text" }),
        signal: abort.signal,
      });
      const data = await response.json() as { models?: OrcaOptionModel[]; code?: string };
      if (requestRevision !== revision.current) return;
      if (!response.ok || !Array.isArray(data.models)) {
        setStatus("error");
        toast.error(data.code && typeof t.raw(`fetchModels.errors.${data.code}`) === "string"
          ? t(`fetchModels.errors.${data.code}`) : t("fetchModels.failed"));
        return;
      }
      setCatalog(data.models);
      setStatus("ready");
      const state = useAIConfigStore.getState();
      for (const profile of state.models) {
        if (profile.provider !== "orcarouter" || !profile.model) continue;
        const entry = data.models.find((model) => model.id === profile.model);
        if (entry) state.saveModel({ ...profile, supportsPdf: entry.supportsImages === true });
      }
      if (data.models.length) toast.success(t("fetchModels.success"));
      else toast.info(t("fetchModels.empty"));
    } catch (error) {
      if (requestRevision !== revision.current || abort.signal.aborted) return;
      setStatus("error");
      toast.error(t("fetchModels.failed"));
    } finally {
      if (requestRevision === revision.current) {
        controller.current = null;
        setLoading(false);
      }
    }
  };

  // A signed-in key arrives complete, so its catalog can be fetched right away.
  // Pasted keys are not auto-fetched: partial input would be rejected upstream.
  useEffect(() => {
    const key = `${apiKey}:${generation ?? 0}`;
    if (!active || method !== "oauth" || !apiKey.trim() || needsReauth) return;
    if (status !== "idle" || loading || autoFetched.current === key) return;
    autoFetched.current = key;
    void refresh();
  });

  const selectModel = (id: string) => {
    if (!active || status !== "ready" || needsReauth) return;
    const entry = catalog.find((model) => model.id === id && orcaChatOption(model));
    if (!entry) return;
    const state = useAIConfigStore.getState();
    const existing = state.models.find((model) => model.provider === "orcarouter" && model.model === id);
    const profile: AIModelProfile = {
      ...credential,
      id: existing?.id ?? `custom:orcarouter:${entry.id}`,
      name: entry.name ?? entry.id,
      model: entry.id,
      baseUrl: AI_PROVIDER_DEFINITIONS.orcarouter.baseUrl,
      protocol: "chat-completions",
      supportsPdf: entry.supportsImages === true,
    };
    state.saveModel(profile);
    state.assignModel("text", profile.id);
  };

  return {
    catalogCount: catalog.filter(orcaChatOption).length,
    credential, options, selectedId, status, query, setQuery, loading, refresh, selectModel,
    setApiKey: (key: string) => saveCredential(key, "api-key"),
    clearCredential: () => saveCredential("", method),
  };
}
