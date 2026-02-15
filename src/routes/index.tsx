import { createFileRoute, redirect } from "@tanstack/react-router";
import { resolveLocale } from "@/i18n/runtime";

export const Route = createFileRoute("/")({
  beforeLoad: ({ location }) => {
    const locale = resolveLocale(location.pathname);

    throw redirect({
      to: "/$locale",
      params: {
        locale
      }
    });
  }
});
