import { useTranslations } from "@/i18n/compat/client";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import ScrollBackground from "./client/ScrollBackground";
import AnimatedFeature from "./client/AnimatedFeature";
import AnimatedResumePreview from "./client/AnimatedResumePreview";
import GoDashboard from "./GoDashboard";

export default function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center pt-32 pb-24 overflow-hidden bg-background">
      <ScrollBackground />

      {/* Background decoration with brand colors */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-40 pointer-events-none">
        <div className="absolute top-20 left-10 w-[480px] h-[480px] bg-brand-purple/20 rounded-full blur-[140px] animate-blob" />
        <div className="absolute bottom-40 right-10 w-[520px] h-[520px] bg-brand-orange/10 rounded-full blur-[160px] animate-blob animation-delay-2000" />
      </div>

      <div className="container relative z-10 mx-auto px-6 text-center max-w-5xl">
        <AnimatedFeature>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-purple/8 border border-brand-purple/15 text-brand-purple mb-10 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">{t("hero.badge")}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-semibold tracking-tight leading-[1.05] mb-8 text-foreground">
            {t("hero.title")}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <GoDashboard>
              <Button
                size="lg"
                className="rounded-2xl h-14 px-10 text-base font-medium bg-brand-purple text-white hover:bg-brand-purple/90 shadow-xl shadow-brand-purple/25 hover:shadow-brand-purple/35 active:scale-95 transition-all group"
              >
                {t("hero.cta")}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </GoDashboard>

            <GoDashboard type="templates">
              <Button
                variant="outline"
                size="lg"
                className="rounded-2xl h-14 px-10 text-base font-medium border-border/70 hover:bg-secondary/80 active:scale-95 transition-all"
              >
                {t("hero.secondary")}
              </Button>
            </GoDashboard>
          </div>
        </AnimatedFeature>

        <AnimatedFeature delay={0.35}>
          <div className="mt-20 sm:mt-24 px-2 sm:px-0">
            <AnimatedResumePreview />
          </div>
        </AnimatedFeature>
      </div>
    </section>
  );
}
