import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import ScrollBackground from "./client/ScrollBackground";
import AnimatedFeature from "./client/AnimatedFeature";

export default function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative min-h-[85vh] flex items-center pt-16 overflow-hidden">
      <ScrollBackground />
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <AnimatedFeature>
            <div className="max-w-xl relative text-center lg:text-left mx-auto lg:mx-0">
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-16 h-32 bg-gradient-to-t from-primary/10 to-transparent rounded-full blur-2xl hidden lg:block" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("hero.badge")}</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-4">
                  {t("hero.title")}
                </h1>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {t("hero.subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="gap-2 text-lg px-8">
                    <Link href="/app/dashboard" className="flex items-center gap-2">
                      {t("hero.cta")}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 text-lg px-8"
                  >
                    <Link href="/app/dashboard/templates" className="flex items-center gap-2">
                      {t("hero.secondary")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </AnimatedFeature>

          <AnimatedFeature delay={0.2}>
            <div className="relative h-[300px] lg:h-[600px] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-blue-500/5 to-purple-500/5 rounded-2xl blur-xl" />
              <div className="relative w-full h-full">
                <Image
                  src="/web-shot.png"
                  alt="Resume Editor"
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  style={{ borderRadius: "1rem" }}
                />
              </div>
            </div>
          </AnimatedFeature>
        </div>
      </div>
    </section>
  );
}
