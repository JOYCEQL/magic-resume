import { ArrowUpRight } from "lucide-react";
import { useLocale, useTranslations } from "@/i18n/compat/client";
import { GITHUB_REPO_URL } from "@/config/constants";

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("home.redesign");
  return (
    <footer className="landing-footer">
      <div className="landing-nav-shell">
        <a href={`/${locale}`} className="landing-brand">
          <span>{locale === "zh" ? "魔方简历" : "Magic Resume"}</span>
        </a>
        <p>{t("footer.note")}</p>
        <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
          {t("footer.source")}
          <ArrowUpRight size={14} />
        </a>
      </div>
    </footer>
  );
}
