import {
  AI_PROVIDERS,
  AI_PROVIDER_DEFINITIONS,
  canModelParsePdf,
  createModelProfile,
  modelSupportsPdf,
  type AIModelProfile,
  type AIProvider,
  type AISettingsData,
} from "@/config/ai-models";

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const string = (value: unknown) => (typeof value === "string" ? value : "");
const isProvider = (value: unknown): value is AIProvider =>
  AI_PROVIDERS.some((provider) => provider === value);

export function migrateAISettings(value: unknown): AISettingsData {
  const old = record(value);
  if (Array.isArray(old.models)) {
    const models: AIModelProfile[] = [];
    for (const item of old.models) {
      const entry = record(item);
      if (
        !isProvider(entry.provider) ||
        !string(entry.id) ||
        models.some((model) => model.id === entry.id)
      )
        continue;
      const preset = createModelProfile(entry.provider, string(entry.id));
      const protocol =
        AI_PROVIDER_DEFINITIONS[entry.provider].protocols.find(
          (protocol) => protocol === entry.protocol,
        ) ?? preset.protocol;
      const model = string(entry.model);
      models.push({
        ...preset,
        name: string(entry.name),
        apiKey: string(entry.apiKey),
        model,
        baseUrl: string(entry.baseUrl),
        protocol,
        supportsPdf: modelSupportsPdf(entry.provider, model),
      });
    }
    return {
      models,
      textModelId:
        models.find((model) => model.id === old.textModelId)?.id ?? null,
      pdfModelId:
        models.find(
          (model) => model.id === old.pdfModelId && canModelParsePdf(model),
        )?.id ?? null,
    };
  }

  const state: AISettingsData = {
    models: [],
    textModelId: null,
    pdfModelId: null,
  };
  const legacyText = new Map<AIProvider, AIModelProfile>();
  for (const provider of ["doubao", "deepseek", "openai", "gemini"] as const) {
    const apiKey = string(old[`${provider}ApiKey`]);
    const model = string(old[`${provider}ModelId`]);
    const baseUrl = provider === "openai" ? string(old.openaiApiEndpoint) : "";
    if (!apiKey && !baseUrl && (!model || model === "gemini-flash-latest"))
      continue;
    const profile = createModelProfile(provider, `migrated-${provider}`);
    profile.apiKey = apiKey;
    // Preserve the model actually used by the old text routes.
    profile.model =
      provider === "deepseek" ? "deepseek-chat" : model || profile.model;
    profile.baseUrl = baseUrl || profile.baseUrl;
    state.models.push(profile);
    legacyText.set(provider, profile);
    if (old.selectedModel === provider) state.textModelId = profile.id;
  }

  const overrides = record(old.pdfImportProfiles);
  for (const provider of AI_PROVIDERS) {
    const saved = record(overrides[provider]);
    const inherited = legacyText.get(provider);
    const selected = (old.pdfImportProvider ?? "gemini") === provider;
    if (!Object.keys(saved).length && !(selected && inherited)) continue;
    const preset = createModelProfile(provider, `migrated-pdf-${provider}`);
    const profile: AIModelProfile = {
      ...preset,
      apiKey: string(saved.apiKey ?? inherited?.apiKey),
      model: string(
        saved.model ??
          (provider === "deepseek"
            ? AI_PROVIDER_DEFINITIONS.deepseek.pdfModel
            : (inherited?.model ?? AI_PROVIDER_DEFINITIONS[provider].pdfModel)),
      ),
      baseUrl: string(saved.baseUrl ?? inherited?.baseUrl ?? preset.baseUrl),
      protocol:
        AI_PROVIDER_DEFINITIONS[provider].protocols.find(
          (protocol) => protocol === saved.protocol,
        ) ?? preset.protocol,
      supportsPdf: modelSupportsPdf(
        provider,
        string(
          saved.model ??
            (provider === "deepseek"
              ? AI_PROVIDER_DEFINITIONS.deepseek.pdfModel
              : (inherited?.model ??
                AI_PROVIDER_DEFINITIONS[provider].pdfModel)),
        ),
      ),
    };
    const existing = state.models.find((model) =>
      ["provider", "protocol", "apiKey", "model", "baseUrl"].every(
        (field) =>
          model[field as keyof AIModelProfile] ===
          profile[field as keyof AIModelProfile],
      ),
    );
    if (existing)
      existing.supportsPdf = modelSupportsPdf(
        existing.provider,
        existing.model,
      );
    else state.models.push(profile);
    if (selected) state.pdfModelId = existing?.id ?? profile.id;
  }
  return state;
}
