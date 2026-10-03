import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "@/i18n/compat/client";
import Link from "@/lib/link";
import Logo from "@/components/shared/Logo";
import { GitHubStars } from "@/components/shared/GitHubStars";

export default function LandingHeader() {
  const locale = useLocale();
  const t = useTranslations("home.redesign");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="landing-header">
      <a className="landing-skip" href="#main-content">
        {t("nav.skip")}
      </a>
      <div className="landing-nav-shell">
        <Link
          href={`/${locale}`}
          className="landing-brand"
          aria-label={t("nav.home")}
        >
          <Logo size={40} className="landing-brand-logo" />
          <span>{locale === "zh" ? "魔方简历" : "Magic Resume"}</span>
        </Link>
        <div className="landing-header-actions">
          <Link
            href={locale === "zh" ? "/en" : "/zh"}
            className="landing-icon-button landing-language"
            aria-label={t("nav.language")}
          >
            {locale === "zh" ? "EN" : "中"}
          </Link>
          <div className="landing-header-github">
            <GitHubStars appearance="landing" />
          </div>
          <Link
            href="/app/dashboard"
            className="landing-button landing-nav-cta"
          >
            {t("start")}
          </Link>
          <button
            type="button"
            className="landing-icon-button landing-menu-toggle"
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={open ? t("nav.close") : t("nav.menu")}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          className="landing-mobile-nav"
          id="landing-menu"
          aria-label={t("nav.label")}
        >
          <GitHubStars appearance="landing" />
          <Link href="/app/dashboard" className="landing-button">
            {t("start")}
            <ArrowUpRight size={16} />
          </Link>
        </nav>
      )}
    </header>
  );
}
