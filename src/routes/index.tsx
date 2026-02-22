import { createFileRoute, redirect } from "@tanstack/react-router";
import { defaultLocale } from "@/i18n/config";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/$locale", params: { locale: defaultLocale } });
  }
});
