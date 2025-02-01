import { useTranslations } from "next-intl";
import LandingHeader from "@/components/home/client/LandingHeader";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/home/Footer";
import NewsAlert from "@/components/home/NewsAlert";

const features = [
  {
    title: "features.ai.title",
    description: "features.ai.description",
    items: ["features.ai.item1", "features.ai.item2", "features.ai.item3"],
  },
  {
    title: "features.storage.title",
    description: "features.storage.description",
    items: [
      "features.storage.item1",
      "features.storage.item2",
      "features.storage.item3",
    ],
  },
  {
    title: "features.preview.title",
    description: "features.preview.description",
    items: ["features.preview.item1", "features.preview.item2"],
  },
];

export default function LandingPage() {
  return (
    <div className="relative bg-gradient-to-b from-[#f8f9fb] to-white dark:from-gray-900 dark:to-gray-800">
      <LandingHeader />
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10">
        <NewsAlert />
      </div>
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
