"use client";

import { useTranslations } from "@/i18n/compat/client";
import Image from "@/lib/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, Sparkles, Shield, Zap } from "lucide-react";
import AnimatedFeature from "./client/AnimatedFeature";

const features = [
  {
    icon: Sparkles,
    badge: "features.ai.badge",
    badgeColor: "bg-primary/10 text-primary",
    title: "features.ai.title",
    description: "features.ai.description",
    items: [
      {
        title: "features.ai.item1",
        description: "features.ai.item1_description",
        image: "/features/svg/polish.svg",
      },
      {
        title: "features.ai.item2",
        description: "features.ai.item2_description",
        image: "/features/svg/grammar.svg",
      },
    ],
  },
  {
    icon: Shield,
    badge: "features.storage.badge",
    badgeColor: "bg-emerald-500/10 text-emerald-600",
    title: "features.storage.title",
    description: "features.storage.description",
    items: [
      {
        title: "features.storage.item1",
        description: "features.storage.item1_description",
        image: "/features/svg/local-storage.svg",
      },
      {
        title: "features.storage.item2",
        description: "features.storage.item2_description",
        image: "/features/svg/export-formats.svg",
      },
    ],
  },
] as const;

const SLIDE_DURATION = 6000;

export default function FeaturesSection() {
  const t = useTranslations("home");
  const [activeFeatures, setActiveFeatures] = useState<number[]>(
    features.map(() => 0)
  );
  const [progresses, setProgresses] = useState<number[]>(features.map(() => 0));
  const intervalRefs = useRef<(NodeJS.Timeout | null)[]>(
    features.map(() => null)
  );

  const startProgressTimer = useCallback(
    (categoryIndex: number) => {
      if (intervalRefs.current[categoryIndex]) {
        clearInterval(intervalRefs.current[categoryIndex] as NodeJS.Timeout);
      }

      const updateInterval = 50;
      const progressIncrement = (updateInterval / SLIDE_DURATION) * 100;

      intervalRefs.current[categoryIndex] = setInterval(() => {
        setProgresses((prev) => {
          const newProgresses = [...prev];
          // Allow progress to go slightly over 100, handled by effect
          if (newProgresses[categoryIndex] < 100) {
            newProgresses[categoryIndex] += progressIncrement;
          }
          return newProgresses;
        });
      }, updateInterval);
    },
    []
  );

  // Handle auto-switch when progress reaches 100%
  useEffect(() => {
    progresses.forEach((progress, index) => {
      if (progress >= 100) {
        // Reset progress immediately to prevent repeated triggers
        setProgresses((prev) => {
          const next = [...prev];
          next[index] = 0;
          return next;
        });
        
        // Switch to next feature
        setActiveFeatures((prevActive) => {
          const next = [...prevActive];
          const max = features[index].items.length - 1;
          next[index] = next[index] < max ? next[index] + 1 : 0;
          return next;
        });
      }
    });
  }, [progresses]);

  useEffect(() => {
    features.forEach((_, index) => startProgressTimer(index));
    return () => {
      intervalRefs.current.forEach((ref) => {
        if (ref) clearInterval(ref);
      });
    };
  }, [startProgressTimer]);

  const handleSlideChange = (categoryIndex: number, featureIndex: number) => {
    setActiveFeatures((prev) => {
      const next = [...prev];
      next[categoryIndex] = featureIndex;
      return next;
    });
    setProgresses((prev) => {
      const next = [...prev];
      next[categoryIndex] = 0;
      return next;
    });
    startProgressTimer(categoryIndex);
  };

  return (
    <section className="py-24 md:py-40 bg-background overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        <AnimatedFeature>
          <div className="text-center mb-24 md:mb-32">
            <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-foreground/90 mb-6">
              {t("features.title")}
            </h2>
            <div className="w-20 h-1 bg-primary/20 mx-auto rounded-full mb-8" />
            <p className="text-xl text-muted-foreground/80 max-w-2xl mx-auto font-light leading-relaxed">
              {t("features.subtitle")}
            </p>
          </div>
        </AnimatedFeature>

        <div className="space-y-40">
          {features.map((category, catIndex) => (
            <div 
              key={catIndex} 
              className={`flex flex-col gap-16 lg:gap-24 items-center ${
                catIndex % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              {/* Text Side */}
              <div className="w-full lg:w-5/12 space-y-10">
                <AnimatedFeature delay={0.1}>
                  <div className="space-y-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${category.badgeColor}`}>
                      <category.icon className="w-4 h-4" />
                      {t(category.badge)}
                    </div>
                    <h3 className="text-3xl md:text-4xl font-serif font-medium tracking-tight text-foreground/90">
                      {t(category.title)}
                    </h3>
                    <p className="text-lg text-muted-foreground/90 leading-relaxed font-light">
                      {t(category.description)}
                    </p>
                  </div>
                </AnimatedFeature>

                <div className="space-y-4">
                  {category.items.map((item, itemIndex) => (
                    <button
                      key={itemIndex}
                      onClick={() => handleSlideChange(catIndex, itemIndex)}
                      className={`w-full text-left group p-5 rounded-2xl transition-all relative border overflow-hidden ${
                        activeFeatures[catIndex] === itemIndex
                          ? "bg-secondary border-border shadow-sm"
                          : "bg-transparent border-transparent hover:bg-secondary/40"
                      }`}
                    >
                      {/* Progress Bar */}
                      {activeFeatures[catIndex] === itemIndex && (
                        <div 
                          className="absolute bottom-0 left-0 h-0.5 bg-primary/30 transition-all duration-75 ease-linear"
                          style={{ width: `${progresses[catIndex]}%` }}
                        />
                      )}
                      
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className={`font-semibold transition-colors ${
                            activeFeatures[catIndex] === itemIndex ? "text-primary" : "text-foreground/70"
                          }`}>
                            {t(item.title)}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {t(item.description)}
                          </p>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-all ${
                          activeFeatures[catIndex] === itemIndex ? "text-primary translate-x-1" : "text-muted-foreground/30"
                        }`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Side */}
              <div className="w-full lg:w-7/12">
                <AnimatedFeature key={`${catIndex}-${activeFeatures[catIndex]}`} delay={0.2}>
                  <div className="relative aspect-[16/10] bg-secondary/20 rounded-3xl border border-border/50 p-6 sm:p-10 shadow-2xl backdrop-blur-sm group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
                    <div className="relative w-full h-full transform group-hover:scale-[1.02] transition-transform duration-700">
                      <Image
                        src={category.items[activeFeatures[catIndex]].image}
                        alt={t(category.items[activeFeatures[catIndex]].title)}
                        fill
                        className="object-contain"
                        sizes="(max-width: 1024px) 100vw, 40vw"
                      />
                    </div>
                  </div>
                </AnimatedFeature>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
