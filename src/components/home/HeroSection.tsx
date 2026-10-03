import { useTranslations } from "@/i18n/compat/client";
import Link from "@/lib/link";
import GoDashboard from "./GoDashboard";

export default function HeroSection() {
  const t = useTranslations("home.redesign");
  const hero = useTranslations("home.hero");
  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      <div className="landing-shell landing-hero-layout">
        <div className="landing-hero-art" aria-hidden="true">
          <img
            src="/landing/unfold.webp"
            alt=""
            width={1536}
            height={1024}
            {...{ fetchpriority: "high" }}
          />
        </div>
        <div className="landing-hero-copy">
          <h1 id="hero-title">{hero("title")}</h1>
          <p>{hero("subtitle")}</p>
          <div className="landing-actions">
            <Link href="/app/dashboard" className="landing-button">
              {hero("cta")}
            </Link>
            <GoDashboard type="templates">
              <button
                type="submit"
                className="landing-button landing-button-secondary"
              >
                {hero("secondary")}
              </button>
            </GoDashboard>
          </div>
        </div>
      </div>
      <a
        href="/app/dashboard"
        className="landing-hero-screenshot landing-shell"
        aria-label={hero("cta")}
      >
        <img
          src="/web-shot.png"
          alt={t("hero.editorAlt")}
          width={3976}
          height={2028}
          loading="eager"
          {...{ fetchpriority: "high" }}
        />
      </a>
    </section>
  );
}
