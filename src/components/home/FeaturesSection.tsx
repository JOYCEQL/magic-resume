"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { CircleArrowRight } from "lucide-react";
import AnimatedFeature from "./client/AnimatedFeature";

const features = [
  {
    title: "features.ai.title",
    description: "features.ai.description",
    items: [
      {
        title: "features.ai.item1",
        image: "/features/polish.png",
      },
      {
        title: "features.ai.item2",
        image: "/features/grammar.png",
      },
    ],
  },
] as const;

const SLIDE_DURATION = 5000;

export default function FeaturesSection() {
  const t = useTranslations("home");
  const [activeFeature, setActiveFeature] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioning = useRef(false);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const advanceToNextFeature = useCallback(() => {
    setActiveFeature((prev) => (prev + 1) % features[0].items.length);
    isTransitioning.current = false;
  }, []);

  useEffect(() => {
    setProgress(0);
    isTransitioning.current = false;

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const updateInterval = 50;
    const progressStep = (updateInterval / SLIDE_DURATION) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + progressStep;

        if (newProgress >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            advanceToNextFeature();
          }, 500);

          return 100;
        }

        return newProgress;
      });
    }, updateInterval);

    timeoutRef.current = setTimeout(() => {
      advanceToNextFeature();
    }, SLIDE_DURATION + 1000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeFeature, advanceToNextFeature]);

  const handleSlideChange = (index: number) => {
    if (index === activeFeature) return;

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setActiveFeature(index);
  };

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
              <h3 className="text-2xl md:text-3xl font-bold text-center md:text-left">
                {t(features[0].title)}
              </h3>
              <ul className="space-y-4">
                {features[0].items.map((item, index) => {
                  const { circumference, offset } =
                    activeFeature === index
                      ? calculateCircleProgress(progress)
                      : activeFeature > index ||
                        (activeFeature === 0 &&
                          index === features[0].items.length - 1)
                      ? calculateCircleProgress(100)
                      : calculateCircleProgress(0);

                  return (
                    <li
                      key={index}
                      onClick={() => handleSlideChange(index)}
                      className={`cursor-pointer relative p-2 rounded-lg transition-all`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-6 h-6 flex items-center justify-center">
                          {activeFeature === index ? (
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
                            activeFeature === index
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
              <AnimatedFeature key={`feature-${activeFeature}`}>
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl group">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-600/15 z-10"></div>

                  <Image
                    src={features[0].items[activeFeature].image}
                    alt={t(features[0].items[activeFeature].title)}
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
        </div>
      </div>

      <style jsx global>{`
        .stroke-gradient-animated {
          stroke: #3b82f6;
          animation: strokeGradient 5s linear;
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

        .shadow-inner-custom {
          box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.1),
            inset 0 0 5px rgba(79, 70, 229, 0.2);
        }
      `}</style>
    </section>
  );
}
