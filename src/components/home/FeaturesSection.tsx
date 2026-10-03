import { useEffect, useRef, useState } from "react";
import {
  FileText,
  SpellCheck,
  LockKeyhole,
  Files,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import FeatureDemo, { type DemoKind } from "./FeatureDemo";

/** 每个演示自动轮播的时长，进度条动画结束即切换到下一项 */
const AUTOPLAY_MS = 5200;

type StoryConfig = {
  id: "ai" | "storage";
  icons: readonly [LucideIcon, LucideIcon];
  demos: readonly [DemoKind, DemoKind];
};

const STORIES: readonly StoryConfig[] = [
  { id: "ai", icons: [FileText, SpellCheck], demos: ["polish", "grammar"] },
  { id: "storage", icons: [LockKeyhole, Files], demos: ["local", "export"] },
];

function WhyStory({ id, icons, demos }: StoryConfig) {
  const t = useTranslations("home.features");
  const storyRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);

  // 仅在进入视口时播放，避免用户还没看到就已经切走
  useEffect(() => {
    const node = storyRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={storyRef}
      className={`why-story why-story-${id}`}
      data-playing={inView}
    >
      <div className="why-copy">
        <h3>{t(`${id}.title`)}</h3>
        <p>{t(`${id}.description`)}</p>
        <div className="why-options" role="group" aria-label={t(`${id}.title`)}>
          {icons.map((Icon, index) => (
            <button
              type="button"
              key={index}
              aria-pressed={active === index}
              aria-controls={`why-${id}-detail`}
              onClick={() => setActive(index)}
            >
              <span className="why-option-icon">
                <Icon size={22} strokeWidth={1.4} aria-hidden="true" />
              </span>
              <span className="why-option-text">
                <strong>{t(`${id}.item${index + 1}`)}</strong>
                <small>{t(`${id}.item${index + 1}_description`)}</small>
              </span>
              {active === index && (
                <span
                  className="why-option-progress"
                  aria-hidden="true"
                  style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
                  onAnimationEnd={() => setActive((index + 1) % icons.length)}
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <figure className="why-scene">
        <FeatureDemo kind={demos[active]} />
        <figcaption id={`why-${id}-detail`} aria-live="polite">
          {t(`${id}.item${active + 1}_description`)}
        </figcaption>
      </figure>
    </div>
  );
}

export default function FeaturesSection() {
  const t = useTranslations("home.features");
  return (
    <section
      className="landing-features landing-section"
      id="features"
      aria-labelledby="features-title"
    >
      <div className="landing-shell">
        <div className="landing-section-heading">
          <h2 id="features-title">{t("title")}</h2>
          <p>{t("subtitle")}</p>
        </div>
        <div className="why-stories">
          {STORIES.map((story) => (
            <WhyStory key={story.id} {...story} />
          ))}
        </div>
      </div>
    </section>
  );
}
