import LandingHeader from "@/components/home/LandingHeader";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import AIFeaturesSection from "@/components/home/AIFeaturesSection";
import ATSSection from "@/components/home/ATSSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/home/Footer";
import FAQSection from "@/components/home/FAQSection";

export const runtime = "edge";

export default function LandingPage() {
  return (
    <div className="relative bg-background">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <AIFeaturesSection />
      <ATSSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
