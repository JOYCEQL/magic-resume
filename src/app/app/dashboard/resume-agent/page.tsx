import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Bot, CheckCircle2, Loader2, RotateCcw, Send, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_TEMPLATES } from "@/components/templates/registry";
import type { AIModelType } from "@/config/ai";
import { useLocale, useTranslations } from "@/i18n/compat/client";
import { useRouter } from "@/lib/navigation";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { useResumeStore } from "@/store/useResumeStore";
import type { ResumeAgentMessage, ResumeDraft } from "@/types/resume-agent";
import { createEmptyResumeDraft, createResumeFromAgentDraft, validateResumeDraft } from "@/utils/resumeAgent";
import { generateUUID } from "@/utils/uuid";

const PROVIDERS: Array<{ id: AIModelType; label: string }> = [
  { id: "doubao", label: "Doubao" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "openai", label: "OpenAI Compatible" },
  { id: "gemini", label: "Gemini" },
  { id: "opencode", label: "OpenCode Zen" },
];

const RESUME_AGENT_STORAGE_KEY = "resume-agent-session-v1";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
    {children}
  </section>
);

const EmptyState = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{children}</p>
);

export default function ResumeAgentPage() {
  const t = useTranslations("dashboard.resumeAgent");
  const locale = useLocale();
  const router = useRouter();
  const ai = useAIConfigStore();
  const { addResume, setActiveResume } = useResumeStore();
  const language = locale.toLowerCase().startsWith("en") ? "en" : "zh";
  const [provider, setProvider] = useState<AIModelType>(ai.selectedModel);
  const [messages, setMessages] = useState<ResumeAgentMessage[]>([]);
  const [draft, setDraft] = useState<ResumeDraft>(() => createEmptyResumeDraft(language));
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATES[0]?.id || "classic");
  const validation = useMemo(() => validateResumeDraft(draft), [draft]);

  const providerConfig = useMemo(() => {
    const map: Record<AIModelType, { apiKey: string; model: string; apiEndpoint?: string }> = {
      doubao: { apiKey: ai.doubaoApiKey, model: ai.doubaoModelId },
      deepseek: { apiKey: ai.deepseekApiKey, model: ai.deepseekModelId || "deepseek-chat" },
      openai: { apiKey: ai.openaiApiKey, model: ai.openaiModelId, apiEndpoint: ai.openaiApiEndpoint },
      gemini: { apiKey: ai.geminiApiKey, model: ai.geminiModelId },
      opencode: { apiKey: ai.opencodeApiKey, model: ai.opencodeModelId },
    };
    return map[provider];
  }, [ai, provider]);

  const providerReady = Boolean(
    providerConfig.apiKey &&
      (provider === "deepseek" || providerConfig.model) &&
      (provider !== "openai" || providerConfig.apiEndpoint)
  );
  const providerLabels = useMemo(
    () => ({
      doubao: `Doubao${ai.doubaoModelId ? ` · ${ai.doubaoModelId}` : ""}`,
      deepseek: `DeepSeek · ${ai.deepseekModelId || "deepseek-chat"}`,
      openai: `OpenAI Compatible${ai.openaiModelId ? ` · ${ai.openaiModelId}` : ""}`,
      gemini: `Gemini${ai.geminiModelId ? ` · ${ai.geminiModelId}` : ""}`,
      opencode: `OpenCode Zen${ai.opencodeModelId ? ` · ${ai.opencodeModelId}` : ""}`,
    }),
    [ai.deepseekModelId, ai.doubaoModelId, ai.geminiModelId, ai.openaiModelId, ai.opencodeModelId]
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RESUME_AGENT_STORAGE_KEY);
      if (!stored) return;
      const session = JSON.parse(stored) as {
        provider?: AIModelType;
        messages?: ResumeAgentMessage[];
        draft?: ResumeDraft;
      };
      if (session.provider && PROVIDERS.some((item) => item.id === session.provider)) {
        setProvider(session.provider);
      }
      if (Array.isArray(session.messages)) setMessages(session.messages.slice(-30));
      if (session.draft) setDraft(session.draft);
    } catch (error) {
      console.warn("Failed to restore resume agent session:", error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        RESUME_AGENT_STORAGE_KEY,
        JSON.stringify({ provider, messages: messages.slice(-30), draft })
      );
    } catch (error) {
      console.warn("Failed to persist resume agent session:", error);
    }
  }, [draft, messages, provider]);

  const submit = async () => {
    const content = input.trim();
    if (!content || isSending) return;
    if (!providerReady) {
      toast.error(t("errors.configureProvider"));
      return;
    }
    const userMessage: ResumeAgentMessage = { id: generateUUID(), role: "user", content, createdAt: new Date().toISOString() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);
    try {
      const response = await fetch("/api/resume-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          modelType: provider,
          ...providerConfig,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          currentDraft: draft,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || data?.error || t("errors.generateFailed"));
      setDraft(data.draft);
      setMessages((current) => [
        ...current,
        { id: generateUUID(), role: "assistant", content: data.assistantMessage, createdAt: new Date().toISOString() },
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.generateFailed"));
    } finally {
      setIsSending(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setDraft(createEmptyResumeDraft(language));
    setInput("");
    window.localStorage.removeItem(RESUME_AGENT_STORAGE_KEY);
  };

  const saveResume = () => {
    const currentValidation = validateResumeDraft(draft);
    if (!currentValidation.canSave) {
      toast.error(t("errors.resolveErrors"));
      return;
    }
    const resume = createResumeFromAgentDraft(draft, templateId);
    const id = addResume(resume);
    setActiveResume(id);
    toast.success(t("saved"));
    router.push({ to: "/app/workbench/$id", params: { id } });
  };

  return (
    <div className="h-[calc(100vh-3.25rem)] overflow-hidden px-3 pb-3 sm:px-6 sm:pb-6">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-3">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/80 px-5 py-4 shadow-sm backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><h1 className="text-xl font-bold">{t("title")}</h1></div>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Button variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />{t("reset")}</Button>
        </header>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(360px,0.9fr)_minmax(460px,1.1fr)]">
          <Card className="flex min-h-0 flex-col overflow-hidden rounded-2xl">
            <CardHeader className="border-b px-5 py-4"><CardTitle className="flex items-center gap-2 text-base"><Bot className="h-5 w-5 text-primary" />{t("conversation")}</CardTitle></CardHeader>
            <ScrollArea className="min-h-0 flex-1">
              <CardContent className="space-y-4 p-5">
                {messages.length === 0 && (
                  <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
                    <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" />
                    <p className="font-medium">{t("empty.title")}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("empty.description")}</p>
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10"><Bot className="h-4 w-4 text-primary" /></div>}
                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-primary text-primary-foreground" : "border bg-card"}`}>{message.content}</div>
                    {message.role === "user" && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted"><UserRound className="h-4 w-4" /></div>}
                  </div>
                ))}
                {isSending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("thinking")}</div>}
              </CardContent>
            </ScrollArea>
            <div className="border-t bg-muted/20 p-4">
              <Textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }} placeholder={t("inputPlaceholder")} className="min-h-24 resize-none bg-background" />
              <div className="mt-3 flex items-center justify-between gap-2">
                <Select value={provider} onValueChange={(value) => setProvider(value as AIModelType)}>
                  <SelectTrigger className="h-9 max-w-[220px] bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>{PROVIDERS.map((item) => <SelectItem key={item.id} value={item.id}>{providerLabels[item.id] || item.label}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={() => void submit()} disabled={!input.trim() || isSending}><Send className="mr-2 h-4 w-4" />{t("send")}</Button>
              </div>
              {!providerReady && <button type="button" onClick={() => router.push("/app/dashboard/ai")} className="mt-2 text-xs text-destructive underline-offset-4 hover:underline">{t("providerNotReady")}</button>}
            </div>
          </Card>

          <Card className="flex min-h-0 flex-col overflow-hidden rounded-2xl">
            <CardHeader className="border-b px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">{t("draft.title")}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={validation.errorCount ? "destructive" : validation.warningCount ? "secondary" : "outline"}>{validation.errorCount ? t("validation.errors", { count: validation.errorCount }) : validation.warningCount ? t("validation.warnings", { count: validation.warningCount }) : t("validation.ready")}</Badge>
                  <Button size="sm" onClick={() => setTemplateDialogOpen(true)} disabled={!validation.canSave || !draft.basic.name}>{t("approve")}</Button>
                </div>
              </div>
            </CardHeader>
            <ScrollArea className="min-h-0 flex-1">
              <CardContent className="space-y-6 p-5">
                <Section title={t("draft.profile")}>
                  {draft.basic.name ? <div className="rounded-xl border p-4"><p className="text-lg font-bold">{draft.basic.name}</p><p className="text-sm text-muted-foreground">{draft.basic.title || draft.targetJob.title}</p><p className="mt-2 text-xs text-muted-foreground">{[draft.basic.email, draft.basic.phone, draft.basic.location].filter(Boolean).join(" · ")}</p></div> : <EmptyState>{t("draft.empty")}</EmptyState>}
                </Section>
                {draft.summary && <Section title={t("draft.summary")}><p className="rounded-xl bg-muted/30 p-4 text-sm leading-6">{draft.summary}</p></Section>}
                <Section title={t("draft.skills")}>{draft.skills.length ? <div className="flex flex-wrap gap-2">{draft.skills.map((skill) => <Badge key={skill} variant="outline">{skill}</Badge>)}</div> : <EmptyState>{t("draft.empty")}</EmptyState>}</Section>
                <Section title={t("draft.experience")}>{draft.experience.length ? <div className="space-y-3">{draft.experience.map((item, index) => <div key={`${item.company}-${index}`} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><strong>{item.position || item.company}</strong><span className="text-xs text-muted-foreground">{item.date}</span></div><p className="text-sm text-muted-foreground">{item.company}</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{item.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></div>)}</div> : <EmptyState>{t("draft.empty")}</EmptyState>}</Section>
                <Section title={t("draft.projects")}>{draft.projects.length ? <div className="space-y-3">{draft.projects.map((item, index) => <div key={`${item.name}-${index}`} className="rounded-xl border p-4"><strong>{item.name}</strong><p className="text-sm text-muted-foreground">{[item.role, item.date].filter(Boolean).join(" · ")}</p></div>)}</div> : <EmptyState>{t("draft.empty")}</EmptyState>}</Section>
                <Section title={t("validation.title")}>
                  {validation.issues.length ? <div className="space-y-2">{validation.issues.map((item) => <div key={item.id} className={`flex gap-3 rounded-xl border p-3 text-sm ${item.severity === "error" ? "border-destructive/40 bg-destructive/5" : "bg-muted/20"}`}>{item.severity === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}<span>{item.message}</span></div>)}</div> : <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />{t("validation.noIssues")}</div>}
                </Section>
              </CardContent>
            </ScrollArea>
          </Card>
        </div>
      </div>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t("template.title")}</DialogTitle><DialogDescription>{t("template.description")}</DialogDescription></DialogHeader>
          <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
            {DEFAULT_TEMPLATES.map((template) => {
              const selected = template.id === templateId;
              return <button type="button" key={template.id} onClick={() => setTemplateId(template.id)} className={`rounded-xl border p-3 text-left transition ${selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}><div className="mb-3 h-20 rounded-lg" style={{ background: `linear-gradient(135deg, ${template.colorScheme.primary}22, ${template.colorScheme.primary}66)` }} /><strong className="text-sm">{template.name}</strong><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{template.description}</p></button>;
            })}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>{t("template.cancel")}</Button><Button onClick={saveResume}>{t("template.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
