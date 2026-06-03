import { useTranslations } from "@/i18n/compat/client";
import Logo from "@/components/shared/Logo";

export default function Footer() {
  const t = useTranslations("home");

  return (
    <footer className="py-12 md:py-16 border-t border-border/40 bg-background">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <div className="flex flex-col">
              <span className="font-serif font-semibold text-lg text-foreground/90 leading-none">
                Halname
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                {t("header.title") === "Halname" ? "AI · ATS" : "AI · ATS"}
              </span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground/70 font-light">
            <p>{t("footer.copyright")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
