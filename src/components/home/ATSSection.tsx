import { useTranslations } from "@/i18n/compat/client";
import { Gauge, LayoutList, Wand2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoDashboard from "./GoDashboard";
import AnimatedFeature from "./client/AnimatedFeature";

const CARDS = [
  { key: "overall", icon: Gauge },
  { key: "sections", icon: LayoutList },
  { key: "suggestions", icon: Wand2 }
] as const;

export default function ATSSection() {
  const t = useTranslations("home");

  return (
    <section className="py-24 md:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        <AnimatedFeature>
          <div className="text-center mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-medium tracking-wide uppercase mb-6">
              <Gauge className="w-3.5 h-3.5" />
              {t("atsSection.badge")}
            </div>

            <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-foreground mb-6 leading-tight max-w-3xl mx-auto">
              {t("atsSection.title")}
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
              {t("atsSection.subtitle")}
            </p>
          </div>
        </AnimatedFeature>

        {/* Score showcase */}
        <AnimatedFeature delay={0.2}>
          <div className="mb-12 relative rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-secondary/30 p-8 md:p-12 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 items-center">
              <div className="text-center md:text-left">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">
                  {t("atsSection.cards.overall.label")}
                </div>
                <div className="text-7xl md:text-8xl font-serif font-semibold tracking-tight bg-gradient-to-br from-brand-purple to-brand-orange bg-clip-text text-transparent">
                  94
                  <span className="text-3xl text-muted-foreground/60 font-sans font-normal">/100</span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: t("atsSection.cards.sections.label"), value: 92 },
                  { label: "Experience", value: 96 },
                  { label: "Skills", value: 88 },
                  { label: "Summary", value: 95 }
                ].map((row, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="text-foreground font-medium tabular-nums">{row.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-orange transition-[width] duration-700"
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedFeature>

        {/* Card explanations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {CARDS.map((card, i) => (
            <AnimatedFeature key={card.key} delay={0.3 + i * 0.1}>
              <div className="h-full p-6 rounded-2xl border border-border/60 bg-card hover:border-border transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-4">
                  <card.icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <div className="font-semibold text-foreground mb-2">
                  {t(`atsSection.cards.${card.key}.label`)}
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed font-light">
                  {t(`atsSection.cards.${card.key}.description`)}
                </div>
              </div>
            </AnimatedFeature>
          ))}
        </div>

        <AnimatedFeature delay={0.5}>
          <div className="flex justify-center">
            <GoDashboard>
              <Button
                size="lg"
                className="rounded-2xl h-14 px-8 bg-brand-orange text-white hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/25 group"
              >
                {t("atsSection.cta")}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </GoDashboard>
          </div>
        </AnimatedFeature>
      </div>
    </section>
  );
}
