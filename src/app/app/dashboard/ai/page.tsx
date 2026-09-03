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
  ShieldCheck,
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
      <article className="rounded-xl border border-border bg-card p-4 transition-all hover:border-border/80 shadow-sm">
        <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{model.name}</h3>
            {model.recommended && (
              <Badge variant="secondary" className="px-2 py-0 text-[10px] font-normal">
                {t("recommended")}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {model.description}
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

      <div className="mt-4 flex min-h-9 flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={
            !isModelConfigured(profile) || test.state.status === "running"
          }
          onClick={() => test.run(model.supportsPdf ? "pdf" : "text")}
          className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
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
            className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:text-destructive"
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
      if (!response.ok || !data?.models) {
        toast.error(
          data?.code
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
    <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      {/* Delicate background ambient aura */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-72 w-full max-w-4xl -translate-x-1/2 opacity-40 blur-3xl [background:radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.08),_transparent_70%)]" />

      {/* Page Header with Editorial Serif Feel */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-md mb-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              <span>
                {configuredCount > 0
                  ? `${configuredCount} / ${AI_PROVIDERS.length} 厂商已连接`
                  : "尚未配置服务商"}
              </span>
            </div>
            <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
              {t("catalogDescription")}
            </p>
          </div>
        </div>
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

      {/* Main Provider Studio Panel */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-border/80 bg-card/40 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.03)] transition-all">
        <div className="grid min-h-[560px] grid-cols-[230px_minmax(0,1fr)] md:grid-cols-[270px_minmax(0,1fr)]">
          {/* Left Sidebar: Providers Navigation */}
          <aside className="border-r border-border/70 bg-muted/15 p-3.5 flex flex-col justify-between">
            <div>
              <div className="px-2.5 pb-3 pt-1">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("providersTitle")}
                </h2>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
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
                      onClick={() => {
                        setProvider(item);
                        setShowKey(false);
                        setFetchedModels([]);
                        setModelListOpen(false);
                      }}
                      className={cn(
                        "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                        active
                          ? "bg-background shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-border/80 text-foreground"
                          : "border border-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground",
                      )}
                    >
                      <ProviderMark provider={item} compact />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between">
                          <span className="truncate text-sm font-medium">
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
                                ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
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

            {/* Bottom Security Note */}
            <div className="rounded-xl border border-border/60 bg-background/50 p-3 text-[11px] text-muted-foreground leading-relaxed">
              <div className="flex items-center gap-1.5 font-medium text-foreground mb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>隐私与安全保证</span>
              </div>
              <p>Key 仅保存在本地浏览器，AI 请求端到端直连官方，不经中间服务器转存。</p>
            </div>
          </aside>

          {/* Right Workspace */}
          <div className="p-6 sm:p-8">
            {/* Header of Active Provider */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
              <div className="flex items-center gap-3.5">
                <ProviderMark provider={provider} />
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
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
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 shadow-sm transition-all"
              >
                <span>{t("getKey")}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* API Key Input Section */}
            <div className="mt-6 space-y-3">
              <Label htmlFor="provider-key" className="text-xs font-medium text-foreground">
                API Key
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
                  className="h-11 rounded-xl border-border/80 bg-background/90 pr-10 font-mono text-xs tracking-wider shadow-sm focus:border-foreground/30 focus:ring-1 focus:ring-foreground/20"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showKey ? "Hide API key" : "Show API key"}
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
                <details className="group rounded-xl border border-border/60 bg-muted/20 p-3.5 transition-all">
                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 list-none">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>
                      {providerBaseUrl === providerDefinition.baseUrl
                        ? t("compatibleService")
                        : t("customEndpointActive")}
                    </span>
                  </summary>
                  <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
                    <Label htmlFor="provider-endpoint" className="text-xs text-foreground">
                      API Endpoint
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
                      className="h-10 rounded-lg font-mono text-xs shadow-sm"
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
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    {t("builtinModels")}
                  </h3>
                  <span className="rounded-full border border-border/80 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
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
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
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
                    className="flex w-full cursor-pointer items-center gap-2 border-b border-border/60 bg-muted/20 px-3.5 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
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

              <div className="grid gap-3.5 xl:grid-cols-2">
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
                      description: t("fetchModels.customModel"),
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
