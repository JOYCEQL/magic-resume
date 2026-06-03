import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import AnimatedFeature from "./client/AnimatedFeature";
import GoDashboard from "./GoDashboard";

export default function CTASection() {
  const t = useTranslations("home");

  return (
    <section className="py-24 md:py-36 bg-gradient-to-br from-brand-purple via-brand-purple to-brand-purple-soft text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-orange/15 blur-[140px] -z-0 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-brand-orange-soft/10 blur-[140px] -z-0 -translate-x-1/3" />

      <div className="container mx-auto px-6 max-w-4xl relative text-center">
        <AnimatedFeature>
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm mb-8 border border-white/15">
              <Sparkles className="w-8 h-8 text-brand-orange-soft" />
            </div>

            <h2 className="text-4xl md:text-6xl font-serif font-semibold tracking-tight mb-8 leading-[1.1]">
              {t("cta.title")}
            </h2>

            <p className="text-lg md:text-xl text-white/75 mb-14 max-w-2xl font-light leading-relaxed">
              {t("cta.description")}
            </p>

            <GoDashboard>
              <Button
                size="lg"
                className="rounded-2xl h-16 px-12 text-base font-medium bg-brand-orange text-white hover:bg-brand-orange/90 shadow-2xl shadow-brand-orange/40 active:scale-95 transition-all group"
              >
                {t("cta.button")}
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1.5 transition-transform" />
              </Button>
            </GoDashboard>
          </div>
        </AnimatedFeature>
      </div>
    </section>
  );
}
