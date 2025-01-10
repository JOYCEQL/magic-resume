import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Header from "@/components/home/Header";
import FeaturesAnimation from "@/components/home/FeaturesAnimation";
import HeroAnimation from "@/components/home/HeroAnimation";
import { setRequestLocale } from "next-intl/server";
import GoDashboard from "@/components/home/GoDashboard";

type Props = {
  params: { locale: string };
};

export default function LandingPage({ params: { locale } }: Props) {
  const t = useTranslations("home");
  setRequestLocale(locale);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative pt-32 pb-16">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center space-y-6">
            <HeroAnimation>
              <h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-primary ">
                {t("hero.title")}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
                {t("hero.subtitle")}
              </p>
              <div className="mt-12">
                <GoDashboard>
                  <Button
                    size="lg"
                    type="submit"
                    className="rounded-full px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {t("hero.cta")}
                  </Button>
                </GoDashboard>
              </div>
            </HeroAnimation>

            <div className="relative rounded-xl overflow-hidden bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black p-2">
              <Image
                width={1280}
                height={720}
                src="/web-shot.png"
                alt="resume-shot"
                className="w-full h-auto block border-[1px] border-gray-200"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <FeaturesAnimation index={0}>
            <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
              <div className="flex-1 order-2 md:order-1">
                <div className="space-y-6">
                  <div className="inline-block px-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-full">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {t("features.ai.badge")}
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold">
                    {t("features.ai.title")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    {t("features.ai.description")}
                  </p>
                </div>
              </div>
              <div className="flex-1 order-1 md:order-2">
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-8">
                  <Image
                    src="/features/ai-correction.svg"
                    width={600}
                    height={400}
                    alt="AI 智能纠错演示"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </FeaturesAnimation>

          <FeaturesAnimation index={1}>
            <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
              <div className="flex-1">
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-8">
                  <Image
                    src="/features/local-storage.svg"
                    width={600}
                    height={400}
                    alt="本地存储演示"
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="space-y-6">
                  <div className="inline-block px-4 py-2 bg-purple-50 dark:bg-purple-950 rounded-full">
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      {t("features.storage.badge")}
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold">
                    {t("features.storage.title")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    {t("features.storage.description")}
                  </p>
                </div>
              </div>
            </div>
          </FeaturesAnimation>

          <FeaturesAnimation index={2}>
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 order-2 md:order-1">
                <div className="space-y-6">
                  <div className="inline-block px-4 py-2 bg-green-50 dark:bg-green-950 rounded-full">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {t("features.preview.badge")}
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold">
                    {t("features.preview.title")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    {t("features.preview.description")}
                  </p>
                </div>
              </div>
              <div className="flex-1 order-1 md:order-2">
                <div className="relative rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-8">
                  <Image
                    src="/features/real-time-preview.svg"
                    width={600}
                    height={400}
                    alt="实时预览演示"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </FeaturesAnimation>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>{t("footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
