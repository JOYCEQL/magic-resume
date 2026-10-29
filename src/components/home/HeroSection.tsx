import { useTranslations } from "@/i18n/compat/client";
import Link from "@/lib/link";
import GoDashboard from "./GoDashboard";
import editor640 from "@/assets/landing/editor-640.webp";
import editor1280 from "@/assets/landing/editor-1280.webp";
import editor2560 from "@/assets/landing/editor-2560.webp";
import unfold768 from "@/assets/landing/unfold-768.webp";
import unfold1536 from "@/assets/landing/unfold-1536.webp";

const heroArtSrcSet = `${unfold768} 768w, ${unfold1536} 1536w`;
const heroArtSizes = "(max-width: 767px) 100vw, (max-width: 1100px) 65vw, 844px";

export default function HeroSection() {
  const t = useTranslations("home.redesign");
  const hero = useTranslations("home.hero");
  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      <div className="landing-shell landing-hero-layout">
        <div className="landing-hero-art" aria-hidden="true">
          <img
            src={unfold1536}
            srcSet={heroArtSrcSet}
            sizes={heroArtSizes}
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
          src={editor1280}
          srcSet={`${editor640} 640w, ${editor1280} 1280w, ${editor2560} 2560w`}
          sizes="(max-width: 767px) calc(100vw - 38px), (max-width: 1100px) calc(100vw - 56px), (max-width: 1360px) calc(100vw - 88px), 1272px"
          alt={t("hero.editorAlt")}
          width={3976}
          height={2028}
          loading="lazy"
          decoding="async"
        />
      </a>
    </section>
  );
}
