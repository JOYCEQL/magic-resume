import LandingHeader from "@/components/home/LandingHeader";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/home/Footer";
import NewsAlert from "@/components/home/NewsAlert";
import FAQSection from "@/components/home/FAQSection";

// export const runtime = "edge";
export default function LandingPage() {
  return (
    <div className="relative bg-gradient-to-b from-[#f8f9fb] to-white dark:from-gray-900 dark:to-gray-800">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <FAQSection />
      <CTASection />
      {/* <Footer /> */}
    </div>
  );
}
