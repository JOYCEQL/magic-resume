"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { CircleArrowRight } from "lucide-react";
import AnimatedFeature from "./client/AnimatedFeature";

const features = [
  {
    badge: "AI",
    badgeColor: "bg-blue-500",
    title: "features.ai.title",
    description: "features.ai.description",
    items: [
      {
        title: "features.ai.item1",
        description: "features.ai.item1.description",
        image: "/features/svg/polish.svg",
      },
      {
        title: "features.ai.item2",
        description: "features.ai.item2.description",
        image: "/features/svg/grammar.svg",
      },
    ],
  },
  {
    badge: "安全",
    badgeColor: "bg-green-500",
    title: "features.storage.title",
    description: "features.storage.description",
    items: [
      {
        title: "features.storage.item1",
        description: "features.storage.item1.description",
        image: "/features/svg/local-storage.svg",
      },
      {
        title: "features.storage.item2",
        description: "features.storage.item2.description",
        image: "/features/svg/export-formats.svg",
      },
    ],
  },
] as const;

const SLIDE_DURATION = 5000;

export default function FeaturesSection() {
  const t = useTranslations("home");
  const [activeFeatures, setActiveFeatures] = useState<number[]>(
    features.map(() => 0)
  );
  const [progresses, setProgresses] = useState<number[]>(features.map(() => 0));
  const intervalRefs = useRef<(NodeJS.Timeout | null)[]>(
    features.map(() => null)
  );
  const timeoutRefs = useRef<(NodeJS.Timeout | null)[]>(
    features.map(() => null)
  );

  const clearTimers = useCallback((categoryIndex: number) => {
    if (intervalRefs.current[categoryIndex]) {
      clearInterval(intervalRefs.current[categoryIndex] as NodeJS.Timeout);
      intervalRefs.current[categoryIndex] = null;
    }
    if (timeoutRefs.current[categoryIndex]) {
      clearTimeout(timeoutRefs.current[categoryIndex] as NodeJS.Timeout);
      timeoutRefs.current[categoryIndex] = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    features.forEach((_, index) => clearTimers(index));
  }, [clearTimers]);

  const startProgressTimer = useCallback(
    (categoryIndex: number) => {
      clearTimers(categoryIndex);

      const updateInterval = 50;
      const progressIncrement = (updateInterval / SLIDE_DURATION) * 100;

      intervalRefs.current[categoryIndex] = setInterval(() => {
        setProgresses((prev) => {
          const newProgresses = [...prev];
          const newProgress = newProgresses[categoryIndex] + progressIncrement;

          if (newProgress >= 100) {
            clearInterval(
              intervalRefs.current[categoryIndex] as NodeJS.Timeout
            );
            intervalRefs.current[categoryIndex] = null;
            newProgresses[categoryIndex] = 100;

            timeoutRefs.current[categoryIndex] = setTimeout(() => {
              setActiveFeatures((prev) => {
                const newActiveFeatures = [...prev];
                const currentFeature = newActiveFeatures[categoryIndex];
                const maxIndex = features[categoryIndex].items.length - 1;

                if (currentFeature < maxIndex) {
                  newActiveFeatures[categoryIndex] = currentFeature + 1;
                } else {
                  newActiveFeatures[categoryIndex] = 0;
                }
                return newActiveFeatures;
              });

              setProgresses((p) => {
                const np = [...p];
                np[categoryIndex] = 0;
                return np;
              });

              startProgressTimer(categoryIndex);
            }, 300);
          } else {
            newProgresses[categoryIndex] = newProgress;
          }

          return newProgresses;
        });
      }, updateInterval);
    },
    [clearTimers]
  );

  const startAutoProgress = useCallback(
    (categoryIndex: number) => {
      setProgresses((prev) => {
        const newProgresses = [...prev];
        newProgresses[categoryIndex] = 0;
        return newProgresses;
      });

      startProgressTimer(categoryIndex);
    },
    [startProgressTimer]
  );

  useEffect(() => {
    features.forEach((_, index) => {
      startAutoProgress(index);
    });

    return clearAllTimers;
  }, [startAutoProgress, clearAllTimers]);

  const handleSlideChange = useCallback(
    (categoryIndex: number, featureIndex: number) => {
      setActiveFeatures((prev) => {
        if (featureIndex === prev[categoryIndex]) return prev;

        const newActiveFeatures = [...prev];
        newActiveFeatures[categoryIndex] = featureIndex;
        return newActiveFeatures;
      });

      clearTimers(categoryIndex);

      setProgresses((prev) => {
        const newProgresses = [...prev];
        newProgresses[categoryIndex] = 0;
        return newProgresses;
      });

      startProgressTimer(categoryIndex);
    },
    [clearTimers, startProgressTimer]
  );

  const calculateCircleProgress = (percent: number) => {
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    return { circumference, offset };
  };

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
              <div className="flex flex-col items-center md:items-start gap-2">
                <span className="text-xs font-semibold text-white px-2 py-1 rounded-full bg-blue-500">
                  {features[0].badge}
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-center md:text-left">
                  {t(features[0].title)}
                </h3>
                <p className="text-muted-foreground text-center md:text-left">
                  {t(features[0].description)}
                </p>
              </div>
              <ul className="space-y-4">
                {features[0].items.map((item, index) => {
                  const { circumference, offset } =
                    activeFeatures[0] === index
                      ? calculateCircleProgress(progresses[0])
                      : activeFeatures[0] > index ||
                        (activeFeatures[0] === 0 &&
                          index === features[0].items.length - 1)
                      ? calculateCircleProgress(100)
                      : calculateCircleProgress(0);

                  return (
                    <li
                      key={index}
                      onClick={() => handleSlideChange(0, index)}
                      className={`cursor-pointer relative p-2 rounded-lg transition-all`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-6 h-6 flex items-center justify-center">
                          {activeFeatures[0] === index ? (
                            <svg width="24" height="24" viewBox="0 0 24 24">
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="2.5"
                                className="dark:stroke-gray-700"
                              />
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                fill="none"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                className="stroke-gradient-animated transform -rotate-90 origin-center transition-all duration-300 ease-linear"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                              />
                            </svg>
                          ) : (
                            <CircleArrowRight />
                          )}
                        </div>
                        <span
                          className={`transition-all duration-200 ${
                            activeFeatures[0] === index
                              ? "text-blue-600 dark:text-blue-400 font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {t(item.title)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex-1 w-full md:w-auto relative">
              <AnimatedFeature key={`feature-${activeFeatures[0]}`}>
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl group">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-600/15 z-10"></div>

                  <Image
                    src={features[0].items[activeFeatures[0]].image}
                    alt={t(features[0].items[activeFeatures[0]].title)}
                    fill
                    className="object-contain z-1"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                <div className="absolute inset-0 -z-10 blur-2xl opacity-70">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-transparent to-purple-500/20 rounded-3xl transform scale-95"></div>
                </div>
              </AnimatedFeature>
            </div>
          </div>

          <div className="flex flex-col md:flex-row-reverse gap-8 md:gap-16 items-center">
            <div className="w-full md:w-[400px] space-y-6">
              <div className="flex flex-col items-center md:items-start gap-2">
                <span className="text-xs font-semibold text-white px-2 py-1 rounded-full bg-green-500">
                  {features[1].badge}
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-center md:text-left">
                  {t(features[1].title)}
                </h3>
                <p className="text-muted-foreground text-center md:text-left">
                  {t(features[1].description)}
                </p>
              </div>
              <ul className="space-y-4">
                {features[1].items.map((item, index) => {
                  const { circumference, offset } =
                    activeFeatures[1] === index
                      ? calculateCircleProgress(progresses[1])
                      : activeFeatures[1] > index ||
                        (activeFeatures[1] === 0 &&
                          index === features[1].items.length - 1)
                      ? calculateCircleProgress(100)
                      : calculateCircleProgress(0);

                  return (
                    <li
                      key={index}
                      onClick={() => handleSlideChange(1, index)}
                      className={`cursor-pointer relative p-2 rounded-lg transition-all`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-6 h-6 flex items-center justify-center">
                          {activeFeatures[1] === index ? (
                            <svg width="24" height="24" viewBox="0 0 24 24">
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="2.5"
                                className="dark:stroke-gray-700"
                              />
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                fill="none"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                className="stroke-gradient-green transform -rotate-90 origin-center transition-all duration-300 ease-linear"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                              />
                            </svg>
                          ) : (
                            <CircleArrowRight />
                          )}
                        </div>
                        <span
                          className={`transition-all duration-200 ${
                            activeFeatures[1] === index
                              ? "text-green-600 dark:text-green-400 font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {t(item.title)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex-1 w-full md:w-auto relative">
              <AnimatedFeature key={`feature-storage-${activeFeatures[1]}`}>
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl group">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-green-600/15 z-10"></div>

                  <Image
                    src={features[1].items[activeFeatures[1]].image}
                    alt={t(features[1].items[activeFeatures[1]].title)}
                    fill
                    className="object-contain z-1"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                <div className="absolute inset-0 -z-10 blur-2xl opacity-70">
                  <div className="absolute inset-0 bg-gradient-to-tr from-green-500/20 via-transparent to-emerald-500/20 rounded-3xl transform scale-95"></div>
                </div>
              </AnimatedFeature>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .stroke-gradient-animated {
          stroke: #3b82f6;
          animation: strokeGradient 5s linear;
        }

        .stroke-gradient-green {
          stroke: #10b981;
          animation: strokeGradientGreen 5s linear;
        }

        @keyframes strokeGradient {
          0% {
            stroke: #3b82f6; /* blue-500 */
          }
          50% {
            stroke: #8b5cf6; /* violet-500 */
          }
          100% {
            stroke: #6366f1; /* indigo-500 */
          }
        }

        @keyframes strokeGradientGreen {
          0% {
            stroke: #10b981; /* green-500 */
          }
          50% {
            stroke: #059669; /* green-600 */
          }
          100% {
            stroke: #047857; /* green-700 */
          }
        }

        .shadow-inner-custom {
          box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.1),
            inset 0 0 5px rgba(79, 70, 229, 0.2);
        }
      `}</style>
    </section>
  );
}
