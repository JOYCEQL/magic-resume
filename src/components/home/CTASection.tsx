import { useTranslations } from "@/i18n/compat/client";
import Link from "@/lib/link";

export default function CTASection() {
  const t = useTranslations("home.cta");
  return (
    <section className="landing-closing">
      <div className="landing-shell">
        <div className="landing-closing-copy">
          <h2>{t("title")}</h2>
          <p>{t("description")}</p>
        </div>
        <Link href="/app/dashboard" className="landing-button">
          {t("button")}
        </Link>
      </div>
    </section>
  );
}
