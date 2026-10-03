import { useLocale } from "@/i18n/compat/client";
import LandingHeader from "@/components/home/LandingHeader";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import TemplateShowcase from "@/components/home/TemplateShowcase";
import FAQSection from "@/components/home/FAQSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/home/Footer";

export const runtime = "edge";
export default function LandingPage() {
  const locale = useLocale();
  return (
    <div className="landing-page" lang={locale}>
      <LandingHeader />
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <TemplateShowcase />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
