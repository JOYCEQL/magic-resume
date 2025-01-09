import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { GoDashboardAction } from "@/actions/navigation";

export default function GoDashboard() {
  const t = useTranslations("home");

  return (
    <form action={GoDashboardAction}>
      <Button
        variant="default"
        className="bg-primary hover:opacity-90 text-white h-8 text-sm rounded-full px-4"
      >
        {t("header.startButton")}
      </Button>
    </form>
  );
}
