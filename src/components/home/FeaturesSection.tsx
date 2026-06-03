import { useTranslations } from "@/i18n/compat/client";
import { Zap, MousePointerClick, Target } from "lucide-react";
import AnimatedFeature from "./client/AnimatedFeature";

const FEATURES = [
  {
    icon: Zap,
    badge: "features.fast.badge",
    title: "features.fast.title",
    description: "features.fast.description",
    iconClass: "bg-brand-orange/10 text-brand-orange"
  },
  {
    icon: MousePointerClick,
    badge: "features.easy.badge",
    title: "features.easy.title",
    description: "features.easy.description",
    iconClass: "bg-brand-purple/10 text-brand-purple"
  },
  {
    icon: Target,
    badge: "features.ats.badge",
    title: "features.ats.title",
    description: "features.ats.description",
    iconClass: "bg-gradient-to-br from-brand-purple/10 to-brand-orange/10 text-brand-purple"
  }
] as const;

export default function FeaturesSection() {
  const t = useTranslations("home");

  return (
    <section className="py-24 md:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        <AnimatedFeature>
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-foreground mb-6">
              {t("features.title")}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              {t("features.subtitle")}
            </p>
          </div>
        </AnimatedFeature>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {FEATURES.map((feature, i) => (
            <AnimatedFeature key={i} delay={0.1 + i * 0.1}>
              <div className="group h-full p-8 rounded-3xl border border-border/60 bg-card hover:border-border transition-all hover:shadow-xl hover:shadow-brand-purple/5 hover:-translate-y-0.5">
                <div className={`inline-flex w-12 h-12 items-center justify-center rounded-2xl ${feature.iconClass} mb-6`}>
                  <feature.icon className="w-6 h-6" strokeWidth={1.8} />
                </div>

                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  {t(feature.badge)}
                </div>

                <h3 className="text-xl md:text-2xl font-serif font-semibold tracking-tight text-foreground mb-4 leading-snug">
                  {t(feature.title)}
                </h3>

                <p className="text-base text-muted-foreground leading-relaxed font-light">
                  {t(feature.description)}
                </p>
              </div>
            </AnimatedFeature>
          ))}
        </div>
      </div>
    </section>
  );
}
