import {
  AI_PROVIDERS,
  AI_PROVIDER_DEFINITIONS,
  BUILTIN_AI_MODELS,
  canModelParsePdf,
  createModelProfile,
  modelSupportsPdf,
  profileAuthMethod,
  supportsAuthMethod,
  type AIAuthMethod,
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
/** Unknown credential states must not be resurrected as trusted. */
const generation = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
const isAuthMethod = (value: unknown): value is AIAuthMethod =>
  value === "api-key" || value === "oauth";

function isOfficialDeepSeekUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (
      url.origin === "https://api.deepseek.com" &&
      !url.username && !url.password && !url.search && !url.hash &&
      ["", "/v1"].includes(url.pathname.replace(/\/+$/, ""))
    );
  } catch {
    return false;
  }
}

/** Upgrade official Flash aliases without rewriting third-party model IDs. */
function migrateDeepSeekFlash(state: AISettingsData): AISettingsData {
  const flash = BUILTIN_AI_MODELS.deepseek.find((model) => model.id === "deepseek-flash")!;
  const oldNames: Record<string, string> = {
    "deepseek-v4-flash": "DeepSeek V4 Flash",
    "deepseek-v4-flash-vision-exp": "DeepSeek V4 Vision",
  };
  const models: AIModelProfile[] = [];
  const ids = new Map<string, string>();
  const equivalent = new Map<string, AIModelProfile>();
  for (const original of state.models) {
    let profile = original;
    if (original.provider === "deepseek" && isOfficialDeepSeekUrl(original.baseUrl)) {
      if (Object.hasOwn(oldNames, original.model)) {
        profile = {
          ...original,
          model: flash.id,
          name: original.name === oldNames[original.model] ? flash.name : original.name,
          supportsPdf: flash.supportsPdf,
        };
      }
      if (profile.model === flash.id) {
        // Merge only identical connections and labels; distinct credentials and
        // user-named profiles must remain independently selectable.
        const key = JSON.stringify([profile.apiKey, profile.protocol, profile.name]);
        const existing = equivalent.get(key);
        if (existing) {
          ids.set(original.id, existing.id);
          continue;
        }
        equivalent.set(key, profile);
      }
    }
    models.push(profile);
    ids.set(original.id, profile.id);
  }
  return {
    models,
    textModelId: state.textModelId === null ? null : ids.get(state.textModelId) ?? null,
    pdfModelId: state.pdfModelId === null ? null : ids.get(state.pdfModelId) ?? null,
  };
}

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
        supportsPdf: entry.provider === "orcarouter"
          ? entry.supportsPdf === true
          : modelSupportsPdf(entry.provider, model),
        ...(supportsAuthMethod(entry.provider, "oauth")
          ? {
              authMethod: isAuthMethod(entry.authMethod)
                ? profileAuthMethod({
                    provider: entry.provider,
                    authMethod: entry.authMethod,
                  })
                : "api-key",
              generation: generation(entry.generation),
              needsReauth: entry.needsReauth === true,
            }
          : {}),
      });
    }
    return migrateDeepSeekFlash({
      models,
      textModelId:
        models.find((model) => model.id === old.textModelId)?.id ?? null,
      pdfModelId:
        models.find(
          (model) => model.id === old.pdfModelId && canModelParsePdf(model),
        )?.id ?? null,
    });
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
  return migrateDeepSeekFlash(state);
}
