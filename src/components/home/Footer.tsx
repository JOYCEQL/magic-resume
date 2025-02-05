import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("home");

  return (
    <footer className="py-8 border-t">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="text-center text-sm text-muted-foreground">
          <p>{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
