import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import ScrollBackground from "./client/ScrollBackground";
import AnimatedFeature from "./client/AnimatedFeature";
import GoDashboard from "./GoDashboard";

export default function CTASection() {
  const t = useTranslations("home");

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background relative overflow-hidden">
      <ScrollBackground />
      <div className="mx-auto max-w-[1200px] px-4 relative">
        <AnimatedFeature>
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-6">{t("cta.title")}</h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              {t("cta.description")}
            </p>
            <GoDashboard>
              <Button type="submit" size="lg" className="gap-2 text-lg px-12">
                {t("cta.button")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </GoDashboard>
          </div>
        </AnimatedFeature>
      </div>
    </section>
  );
}
