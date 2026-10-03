import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  RefreshCw,
  Trash2,
  Wifi,
  Eye,
  EyeOff,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/i18n/compat/client";
import {
  AI_PROVIDERS,
  AI_PROVIDER_DEFINITIONS,
  BUILTIN_AI_MODELS,
  createBuiltinModelProfile,
  isModelConfigured,
  modelSupportsPdf,
  type AIModelProfile,
  type AIProvider,
  type BuiltinAIModel,
} from "@/config/ai-models";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { cn } from "@/lib/utils";
import { ResumeImportError } from "@/lib/resume-import-schema";
import { ModelAssignment } from "./ModelAssignment";
import { ProviderMark } from "./ProviderMark";
import { useModelTest } from "./useModelTest";

interface ModelCardProps {
  model: BuiltinAIModel;
  profile: AIModelProfile;
  textModelId: string | null;
  pdfModelId: string | null;
  onDelete?: () => void;
}

function ModelCard({
  model,
  profile,
  textModelId,
  pdfModelId,
  onDelete,
}: ModelCardProps) {
  const t = useTranslations("dashboard.settings.ai.workspace");
  const tError = useTranslations("dashboard.resumes.importDialog.errors");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const test = useModelTest(profile);
  const assignedToText = profile.id === textModelId;
  const assignedToPdf = profile.id === pdfModelId;

  const message = (() => {
    if (test.state.status === "idle") return null;
    if (test.state.status === "running") return t("detecting");
    if (test.state.status === "success") return t("connectionSuccess");
    return test.state.error instanceof ResumeImportError
      ? tError(test.state.error.code as never)
      : t("connectionFailed");
  })();

  return (
    <>
      <article className="rounded-xl border border-border/70 bg-background/30 p-4">
        <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-all font-sans text-sm font-semibold leading-5 text-foreground">{model.name}</h3>
            {model.recommended && (
              <Badge variant="secondary" className="px-2 py-0 text-[10px] font-normal">
                {t("recommended")}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {t(model.descriptionKey)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="secondary" className="px-2 py-0 text-[10px] font-normal">
            {t("textTag")}
          </Badge>
          {model.supportsPdf && (
            <Badge
              variant="outline"
              className="px-2 py-0 text-[10px] font-medium text-primary"
            >
              PDF
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-4 flex min-h-9 flex-wrap items-center gap-2 border-t border-border/50 pt-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={
            !isModelConfigured(profile) || test.state.status === "running"
          }
          onClick={() => test.run(model.supportsPdf ? "pdf" : "text")}
          className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium shadow-none"
        >
          {test.state.status === "running" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wifi className="h-3.5 w-3.5" />
          )}
          <span>{t("detectConnection")}</span>
        </Button>
        {onDelete && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowDeleteDialog(true)}
            aria-label={t("deleteModel", { model: model.name })}
            className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium shadow-none text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t("delete")}</span>
          </Button>
        )}
        {assignedToText && (
          <span className="text-xs text-muted-foreground">
            {t("usedByText")}
          </span>
        )}
        {assignedToPdf && (
          <span className="text-xs text-muted-foreground">
            {t("usedByPdf")}
          </span>
        )}
        {message && (
          <span
            role="status"
            className={cn(
              "text-xs font-medium",
              test.state.status === "success"
                ? "text-emerald-600 dark:text-emerald-400"
                : test.state.status === "error"
                  ? "text-destructive"
                  : "text-muted-foreground",
            )}
          >
            {message}
          </span>
        )}
      </div>
      </article>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteTitle", { name: model.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete?.();
                setShowDeleteDialog(false);
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AISettingsPage() {
  const t = useTranslations("dashboard.settings.ai.workspace");
  const models = useAIConfigStore((state) => state.models);
  const textModelId = useAIConfigStore((state) => state.textModelId);
  const pdfModelId = useAIConfigStore((state) => state.pdfModelId);
  const saveModel = useAIConfigStore((state) => state.saveModel);
  const assignModel = useAIConfigStore((state) => state.assignModel);
  const deleteModel = useAIConfigStore((state) => state.deleteModel);

  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<AIProvider>(() => {
    const selected = models.find((model) => model.id === textModelId);
    return selected?.provider ?? models[0]?.provider ?? "deepseek";
  });
  const [fetchedModels, setFetchedModels] = useState<
    { id: string; description?: string }[]
  >([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelListOpen, setModelListOpen] = useState(false);
  const modelFetchRevision = useRef(0);
  const modelFetchController = useRef<AbortController | null>(null);

  const getProviderKey = (item: AIProvider) =>
    models.find((model) => model.provider === item && model.apiKey.trim())
      ?.apiKey ??
    models.find((model) => model.provider === item)?.apiKey ??
    "";

  const getProviderBaseUrl = (item: AIProvider) => {
    const official = AI_PROVIDER_DEFINITIONS[item].baseUrl;
    return (
      models.find(
        (model) =>
          model.provider === item &&
          model.baseUrl.trim() &&
          model.baseUrl !== official,
      )?.baseUrl ??
      models.find((model) => model.provider === item && model.baseUrl.trim())
        ?.baseUrl ??
      official
    );
  };

  const syncProviderModels = (
    item: AIProvider,
    apiKey: string,
    baseUrl = getProviderBaseUrl(item),
  ) => {
    const catalog = BUILTIN_AI_MODELS[item];
    const providerModels = models.filter((model) => model.provider === item);

    for (const model of catalog) {
      const existing = providerModels.find(
        (profile) => profile.model === model.id,
      );
      saveModel(
        existing
          ? {
              ...existing,
              name: model.name,
              apiKey,
              baseUrl,
              protocol:
                model.protocol ?? AI_PROVIDER_DEFINITIONS[item].protocol,
              supportsPdf: model.supportsPdf,
            }
          : { ...createBuiltinModelProfile(item, model, apiKey), baseUrl },
      );
    }

    for (const profile of providerModels) {
      if (!catalog.some((model) => model.id === profile.model)) {
        saveModel({ ...profile, apiKey, baseUrl });
      }
    }
  };

  useEffect(() => {
    for (const item of AI_PROVIDERS) {
      const apiKey = getProviderKey(item);
      const baseUrl = getProviderBaseUrl(item);
      if (
        apiKey &&
        BUILTIN_AI_MODELS[item].some(
          (model) =>
            !models.some(
              (profile) =>
                profile.provider === item &&
                profile.model === model.id &&
                profile.baseUrl === baseUrl,
            ),
        )
      ) {
        syncProviderModels(item, apiKey, baseUrl);
      }
    }
  }, [models]);

  const providerKey = getProviderKey(provider);
  const providerDefinition = AI_PROVIDER_DEFINITIONS[provider];
  const providerBaseUrl = getProviderBaseUrl(provider);

  useEffect(() => {
    modelFetchRevision.current += 1;
    modelFetchController.current?.abort();
    modelFetchController.current = null;
    setFetchedModels([]);
    setModelListOpen(false);
    setFetchingModels(false);

    return () => {
      modelFetchRevision.current += 1;
      modelFetchController.current?.abort();
      modelFetchController.current = null;
    };
  }, [provider, providerKey, providerBaseUrl]);

  const providerProfiles = BUILTIN_AI_MODELS[provider].map((model) => ({
    model,
    profile: {
      ...(models.find(
        (profile) =>
          profile.provider === provider && profile.model === model.id,
      ) ?? createBuiltinModelProfile(provider, model, providerKey)),
      apiKey: providerKey,
      baseUrl: providerBaseUrl,
    },
  }));
  const customProfiles = models.filter(
    (profile) =>
      profile.provider === provider &&
      !BUILTIN_AI_MODELS[provider].some((model) => model.id === profile.model),
  );

  const fetchProviderModels = async () => {
    if (!providerKey.trim()) {
      toast.error(t("fetchModels.noKey"));
      return;
    }

    const requestProvider = provider;
    const requestKey = providerKey;
    const requestBaseUrl = providerBaseUrl;
    const requestRevision = ++modelFetchRevision.current;
    modelFetchController.current?.abort();
    const controller = new AbortController();
    modelFetchController.current = controller;
    setFetchingModels(true);
    setFetchedModels([]);
    setModelListOpen(false);

    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: requestProvider,
          apiKey: requestKey,
          baseUrl: requestBaseUrl,
        }),
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => null)) as {
        models?: { id: string; description?: string }[];
        code?: string;
      } | null;
      if (requestRevision !== modelFetchRevision.current) return;
      if (!response.ok || !Array.isArray(data?.models)) {
        toast.error(
          data?.code && typeof t.raw(`fetchModels.errors.${data.code}`) === "string"
            ? t(`fetchModels.errors.${data.code}`)
            : t("fetchModels.failed"),
        );
        return;
      }
      setFetchedModels(data.models);
      setModelListOpen(true);
      if (data.models.length) {
        toast.success(t("fetchModels.success"));
      } else {
        toast.info(t("fetchModels.empty"));
      }
    } catch (error) {
      if (requestRevision !== modelFetchRevision.current) return;
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error(t("fetchModels.failed"));
    } finally {
      if (requestRevision === modelFetchRevision.current) {
        modelFetchController.current = null;
        setFetchingModels(false);
      }
    }
  };

  const addCustomModel = (modelId: string) => {
    saveModel({
      id: `custom:${provider}:${modelId}`,
      provider,
      name: "",
      apiKey: providerKey,
      model: modelId,
      baseUrl: providerBaseUrl,
      protocol: AI_PROVIDER_DEFINITIONS[provider].protocol,
      supportsPdf: modelSupportsPdf(provider, modelId),
    });
    toast.success(t("fetchModels.added"));
  };

  const configuredCount = AI_PROVIDERS.filter((item) =>
    getProviderKey(item).trim(),
  ).length;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
      <header className="mb-8">
        <div className="flex min-h-[50px] flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/60 px-3 py-1.5 text-xs text-muted-foreground dark:bg-secondary/50">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              configuredCount > 0 ? "bg-emerald-500" : "bg-muted-foreground/40",
            )} />
            <span>
              {configuredCount > 0
                ? t("configuredProviders", { count: configuredCount, total: AI_PROVIDERS.length })
                : t("noConfiguredProviders")}
            </span>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {t("catalogDescription")}
        </p>
      </header>

      {/* Model Assignment Section */}
      <ModelAssignment
        models={models}
        textModelId={textModelId}
        pdfModelId={pdfModelId}
        onAssign={(task, id) => {
          assignModel(task, id);
          toast.success(t("assignmentSaved"));
        }}
      />

      {/* Provider configuration */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-border/80 bg-white/90 shadow-[0_1px_2px_rgba(28,28,24,0.025),0_8px_24px_rgba(28,28,24,0.025)] dark:bg-card">
        <div className="grid min-h-[560px] grid-cols-[230px_minmax(0,1fr)] md:grid-cols-[270px_minmax(0,1fr)]">
          {/* Left Sidebar: Providers Navigation */}
          <aside className="border-r border-border/60 bg-background/80 p-4">
            <div>
              <div className="px-3 pb-4 pt-1">
                <h2 className="font-sans text-xs font-medium tracking-wide text-muted-foreground">
                  {t("providersTitle")}
                </h2>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("providersHint")}
                </p>
              </div>

              <div className="space-y-1">
                {AI_PROVIDERS.map((item) => {
                  const configured = !!getProviderKey(item).trim();
                  const active = item === provider;

                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setProvider(item);
                        setShowKey(false);
                        setFetchedModels([]);
                        setModelListOpen(false);
                      }}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.985] motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2",
                        active
                          ? "border border-border/70 bg-white text-foreground shadow-[0_1px_2px_rgba(28,28,24,0.04),0_3px_8px_rgba(28,28,24,0.035)] dark:bg-secondary"
                          : "border border-transparent text-foreground/75 hover:bg-secondary/50 hover:text-foreground",
                      )}
                    >
                      <ProviderMark provider={item} compact />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between">
                          <span className={cn("truncate text-sm", active ? "font-semibold" : "font-medium")}>
                            {t(`providers.${item}`)}
                          </span>
                          {active && (
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full transition-all",
                              configured
                                ? "bg-emerald-500"
                                : "bg-muted-foreground/30",
                            )}
                          />
                          <span className="text-[11px] text-muted-foreground">
                            {configured ? t("configured") : t("incomplete")}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Right Workspace */}
          <div className="min-w-0 p-6 sm:p-8">
            {/* Header of Active Provider */}
            <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <ProviderMark provider={provider} />
                <div>
                  <h2 className="font-sans text-xl font-semibold tracking-tight text-foreground">
                    {t(`providers.${provider}`)}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("providerModelsHint")}
                  </p>
                </div>
              </div>

              <a
                href={providerDefinition.keyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-lg border border-border bg-white/70 px-3 text-xs font-medium text-foreground/80 transition-colors hover:border-foreground/20 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-secondary/50 sm:self-auto"
              >
                <span>{t("getKey")}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* API Key Input Section */}
            <div className="mt-6 space-y-3">
              <Label htmlFor="provider-key" className="text-xs font-medium text-foreground">
                {t("apiKey")}
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="provider-key"
                  type={showKey ? "text" : "password"}
                  autoComplete="off"
                  value={providerKey}
                  onChange={(event) =>
                    syncProviderModels(provider, event.target.value)
                  }
                  placeholder={t("providerKeyPlaceholder")}
                  className="h-11 rounded-lg border-border/80 bg-background/70 pr-11 text-sm shadow-[inset_0_1px_2px_rgba(28,28,24,0.03)] transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-muted-foreground/80 hover:border-foreground/25 focus-visible:border-foreground/30 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-foreground/10 focus-visible:ring-offset-0 motion-reduce:transition-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t(showKey ? "hideKey" : "showKey")}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                {t("keySharedHint")}
              </p>

              {/* OpenAI Compatible Service Endpoint */}
              {provider === "openai" && (
                <details className="group rounded-lg border border-border/60 bg-background/50 p-3.5">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 list-none">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>
                      {providerBaseUrl === providerDefinition.baseUrl
                        ? t("compatibleService")
                        : t("customEndpointActive")}
                    </span>
                    <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none" />
                  </summary>
                  <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
                    <Label htmlFor="provider-endpoint" className="text-xs text-foreground">
                      {t("apiEndpoint")}
                    </Label>
                    <Input
                      id="provider-endpoint"
                      value={providerBaseUrl}
                      onChange={(event) =>
                        syncProviderModels(
                          provider,
                          providerKey,
                          event.target.value,
                        )
                      }
                      placeholder="https://api.openai.com/v1"
                      className="h-10 rounded-lg border-border/80 bg-background/70 font-mono text-xs shadow-[inset_0_1px_2px_rgba(28,28,24,0.03)] transition-[background-color,border-color,box-shadow] duration-150 hover:border-foreground/25 focus-visible:border-foreground/30 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-foreground/10 focus-visible:ring-offset-0 motion-reduce:transition-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("compatibleServiceHint")}
                    </p>
                  </div>
                </details>
              )}
            </div>

            {/* Built-in Models Grid */}
            <div className="mt-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-sans text-sm font-semibold tracking-tight text-foreground">
                    {t("availableModels")}
                  </h3>
                  <span className="rounded-md bg-secondary/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                    {t("modelCount", {
                      count: providerProfiles.length + customProfiles.length,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {t("builtinModelsHint")}
                  </span>
                  <button
                    type="button"
                    onClick={fetchProviderModels}
                    disabled={fetchingModels}
                    className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-foreground/75 transition-colors hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    {fetchingModels ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    {t("fetchModels.button")}
                  </button>
                </div>
              </div>

              {fetchedModels.length > 0 && (
                <div className="mb-4 overflow-hidden rounded-xl border border-border/70 bg-background/60">
                  <button
                    type="button"
                    onClick={() => setModelListOpen(!modelListOpen)}
                    aria-expanded={modelListOpen}
                    className="flex w-full cursor-pointer items-center gap-2 border-b border-border/60 bg-secondary/40 px-3.5 py-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                        modelListOpen ? "" : "-rotate-90",
                      )}
                    />
                    <span>{t("fetchModels.listTitle")}</span>
                    <span className="ml-auto font-normal text-[10px]">
                      {fetchedModels.length}
                    </span>
                  </button>
                  {modelListOpen && (
                    <div className="max-h-72 overflow-y-auto">
                      {fetchedModels.map((item) => {
                        const isBuiltin = BUILTIN_AI_MODELS[provider].some(
                          (model) => model.id === item.id,
                        );
                        const isAdded = models.some(
                          (profile) =>
                            profile.provider === provider &&
                            profile.model === item.id,
                        );
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 border-b border-border/40 px-3.5 py-2 last:border-b-0"
                          >
                            <div className="flex min-w-0 items-baseline gap-2">
                              <span className="truncate font-mono text-xs text-foreground">
                                {item.id}
                              </span>
                              {item.description && (
                                <span className="truncate text-xs text-muted-foreground">
                                  {item.description}
                                </span>
                              )}
                            </div>
                            {isBuiltin || isAdded ? (
                              <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                {t("fetchModels.added")}
                              </span>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => addCustomModel(item.id)}
                                aria-label={t("fetchModels.addModel", {
                                  model: item.id,
                                })}
                                className="h-7 rounded-lg px-2 text-xs font-medium"
                              >
                                {t("fetchModels.add")}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-2">
                {providerProfiles.map(({ model, profile }) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    profile={profile}
                    textModelId={textModelId}
                    pdfModelId={pdfModelId}
                  />
                ))}
                {customProfiles.map((profile) => (
                  <ModelCard
                    key={profile.id}
                    model={{
                      id: profile.model,
                      name: profile.model,
                      descriptionKey: "fetchModels.customModel",
                      supportsPdf: profile.supportsPdf,
                    }}
                    profile={profile}
                    textModelId={textModelId}
                    pdfModelId={pdfModelId}
                    onDelete={() => deleteModel(profile.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
