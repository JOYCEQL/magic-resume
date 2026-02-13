import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import LandingHeader from "@/components/home/LandingHeader";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import CTASection from "@/components/home/CTASection";
import FAQSection from "@/components/home/FAQSection";
import { locales, type Locale } from "@/i18n/config";

export const Route = createFileRoute("/$locale")({
  component: LocalePage,
  beforeLoad: ({ params }) => {
    if (!locales.includes(params.locale as Locale)) {
      throw new Error("Not Found");
    }
  },
  head: ({ params }) => ({
    meta: [
      {
        title: `MagicV - AI Resume Builder`,
      },
    ],
  }),
});

function LocalePage() {
  const { locale } = Route.useParams();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  return (
    <div className="relative bg-gradient-to-b from-[#f8f9fb] to-white dark:from-gray-900 dark:to-gray-800">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}
