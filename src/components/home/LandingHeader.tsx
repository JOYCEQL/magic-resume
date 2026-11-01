import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import { useLocaleSwitch } from "@/hooks/useLocaleSwitch";
import Link from "@/lib/link";
import Logo from "@/components/shared/Logo";
import { LandingGitHubStars } from "./LandingGitHubStars";
import { ContactPopover } from "@/components/shared/ContactPopover";

export default function LandingHeader() {
  const { locale, switchLocale } = useLocaleSwitch();
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
            onClick={() => switchLocale(locale === "zh" ? "en" : "zh")}
            className="landing-icon-button landing-language cursor-pointer"
            aria-label={t("nav.language")}
          >
            {locale === "zh" ? "EN" : "中"}
          </Link>
          {locale === "zh" && (
            <div className="landing-header-github">
              <Link
                href="/zh/offerin"
                target="_blank"
                rel="noopener"
                className="landing-github-button cursor-pointer px-2.5 gap-1.5"
                title="第三方合作伙伴 · OfferIN AI 面试助手"
              >
                <span>OfferIN 面试</span>
                <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground border border-border/60 font-normal leading-none">
                  第三方
                </span>
                <ArrowUpRight size={13} className="text-muted-foreground/70 -mr-0.5" />
              </Link>
            </div>
          )}
          <ContactPopover
            renderWrapper={(popover) => (
              <div className="landing-header-github">{popover}</div>
            )}
          />
          <div className="landing-header-github">
            <LandingGitHubStars />
          </div>
          <Link
            href="/app/dashboard/resumes"
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
          {locale === "zh" && (
            <Link
              href="/zh/offerin"
              target="_blank"
              rel="noopener"
              className="landing-github-button cursor-pointer w-full justify-center gap-1.5"
              onClick={() => setOpen(false)}
            >
              <span>OfferIN 面试助手</span>
              <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground border border-border/60 font-normal leading-none">
                第三方
              </span>
              <ArrowUpRight size={14} className="text-muted-foreground/70" />
            </Link>
          )}
          <ContactPopover />
          <LandingGitHubStars />
          <Link href="/app/dashboard/resumes" className="landing-button">
            {t("start")}
            <ArrowUpRight size={16} />
          </Link>
        </nav>
      )}
    </header>
  );
}
