import { useTranslations } from "@/i18n/compat/client";
import { Sparkles, Wand2, SpellCheck, BarChart3, KeyRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/lib/navigation";
import AnimatedFeature from "./client/AnimatedFeature";

const ITEMS = [
  { key: "polish", icon: Wand2 },
  { key: "grammar", icon: SpellCheck },
  { key: "ats", icon: BarChart3 }
] as const;

const PROVIDERS = ["OpenAI", "Gemini", "OpenRouter", "DeepSeek"];

export default function AIFeaturesSection() {
  const t = useTranslations("home");
  const router = useRouter();

  return (
    <section className="py-24 md:py-32 bg-secondary/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-purple/5 blur-[160px] -z-10" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-brand-orange/5 blur-[160px] -z-10" />

      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <AnimatedFeature>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/10 text-brand-purple text-xs font-medium tracking-wide uppercase mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                {t("aiFeatures.badge")}
              </div>

              <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-foreground mb-6 leading-tight">
                {t("aiFeatures.title")}
              </h2>

              <p className="text-lg text-muted-foreground mb-10 leading-relaxed font-light">
                {t("aiFeatures.subtitle")}
              </p>

              <div className="space-y-4 mb-10">
                {ITEMS.map((item, i) => (
                  <div key={item.key} className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-card border border-border/60 flex items-center justify-center text-brand-purple shadow-sm">
                      <item.icon className="w-5 h-5" strokeWidth={1.8} />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">
                        {t(`aiFeatures.items.${item.key}.title`)}
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed font-light">
                        {t(`aiFeatures.items.${item.key}.description`)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={() => router.push("/app/dashboard/ai")}
                className="rounded-2xl h-12 px-6 bg-brand-purple text-white hover:bg-brand-purple/90 shadow-lg shadow-brand-purple/20 group"
              >
                {t("aiFeatures.cta")}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </AnimatedFeature>

          <AnimatedFeature delay={0.2}>
            <div className="relative rounded-3xl border border-border/60 bg-card shadow-2xl p-8 backdrop-blur-sm">
              <div className="absolute -inset-px rounded-3xl bg-gradient-to-tr from-brand-purple/10 via-transparent to-brand-orange/10 pointer-events-none" />

              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-brand-purple" />
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Your API Key
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-medium">
                    connected
                  </span>
                </div>

                <div className="font-mono text-sm px-4 py-3 rounded-xl bg-muted/60 border border-border/40 text-foreground">
                  sk-•••••••••••••••••••••••••••••••••8e4f
                </div>

                <div className="pt-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
                    Providers
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PROVIDERS.map((p) => (
                      <span
                        key={p}
                        className="px-3 py-1.5 rounded-lg bg-secondary/60 border border-border/40 text-xs font-medium text-foreground/80"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Cost on Halname</span>
                    <span className="font-mono text-foreground font-semibold">$0.00</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground/70 mt-1">
                    You pay your provider directly — Halname never proxies your billing.
                  </div>
                </div>
              </div>
            </div>
          </AnimatedFeature>
        </div>
      </div>
    </section>
  );
}
