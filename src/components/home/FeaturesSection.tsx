"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import AnimatedFeature from "./client/AnimatedFeature";

const features = [
  {
    title: "features.ai.title",
    description: "features.ai.description",
    items: [
      {
        title: "features.ai.item1",
        image: "/features/polish.png"
      },
      {
        title: "features.ai.item2",
        image: "/features/grammar.png"
      }
    ]
  }
] as const;

export default function FeaturesSection() {
  const t = useTranslations("home");
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-background to-primary/5">
      <div className="mx-auto max-w-[1200px] px-4">
        <AnimatedFeature>
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6">
              {t("features.title")}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>
        </AnimatedFeature>

        <div className="space-y-24 md:space-y-32">
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
            <div className="w-full md:w-[400px] space-y-6 md:mr-16">
              <h3 className="text-2xl md:text-3xl font-bold text-center md:text-left">
                {t(features[0].title)}
              </h3>
              <ul className="space-y-4">
                {features[0].items.map((item, index) => (
                  <li
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className={`flex items-center gap-3 cursor-pointer relative p-2 rounded-lg transition-all ${
                      activeFeature === index ? "bg-primary/10" : ""
                    }`}
                  >
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`${
                        activeFeature === index
                          ? "text-primary font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {t(item.title)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full md:w-auto relative">
              <AnimatedFeature key={activeFeature}>
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <Image
                    src={features[0].items[activeFeature].image}
                    alt={t(features[0].items[activeFeature].title)}
                    fill
                    className="object-contain p-4 md:p-8"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-blue-500/5 to-purple-500/5 rounded-xl -z-10 blur-2xl" />
              </AnimatedFeature>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
