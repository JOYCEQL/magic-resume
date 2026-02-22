import { createFileRoute, notFound } from "@tanstack/react-router";
import LandingPage from "@/app/(public)/[locale]/page";
import { locales } from "@/i18n/config";

export const Route = createFileRoute("/$locale")({
  component: LocaleLandingPage
});

function LocaleLandingPage() {
  const { locale } = Route.useParams();

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  return <LandingPage />;
}
