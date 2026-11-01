import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { locales } from "@/i18n/config";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    if (!locales.includes(params.locale as (typeof locales)[number])) {
      notFound();
    }
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  return <Outlet />;
}
