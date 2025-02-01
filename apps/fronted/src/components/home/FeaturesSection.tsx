import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import AnimatedFeature from "./client/AnimatedFeature";

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

export default function FeaturesSection() {
  const t = useTranslations("home");

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-background to-primary/5">
      <div className="mx-auto max-w-[1200px] px-4">
        <AnimatedFeature>
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">
              {t("features.title")}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>
        </AnimatedFeature>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
          {features.map((feature, index) => (
            <AnimatedFeature key={index} delay={index * 0.2}>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-2xl -z-10 transition-transform duration-300 group-hover:scale-105" />
                <div className="h-[360px] p-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_0_18px_1px_rgba(140,140,140,0.12)] transition-all duration-300 group-hover:border-[#A700FF] dark:group-hover:border-[#A700FF] flex flex-col">
                  <h3 className="text-2xl font-bold mb-12">
                    {t(feature.title)}
                  </h3>

                  <ul className="space-y-3">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-1" />
                        <span>{t(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimatedFeature>
          ))}
        </div>
      </div>
    </section>
  );
}
