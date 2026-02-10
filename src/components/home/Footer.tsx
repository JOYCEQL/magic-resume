import { useTranslations } from "next-intl";
import Logo from "@/components/shared/Logo";

export default function Footer() {
  const t = useTranslations("home");

  return (
    <footer className="py-16 md:py-24 border-t border-border/50 bg-secondary/10">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <span className="font-serif font-semibold text-lg text-foreground/80">Magic Resume</span>
          </div>
          
          <div className="text-sm text-muted-foreground/60 font-light">
            <p>{t("footer.copyright")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
