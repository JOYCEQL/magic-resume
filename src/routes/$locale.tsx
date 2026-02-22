import { createFileRoute, notFound } from "@tanstack/react-router";
import LandingPage from "@/app/(public)/[locale]/page";
import { defaultLocale, locales, type Locale } from "@/i18n/config";
import zhMessages from "@/i18n/locales/zh.json";
import enMessages from "@/i18n/locales/en.json";

const SEO_BASE_URL = "https://magicv.art";

function resolveLocale(rawLocale: string): Locale {
  if (locales.includes(rawLocale as Locale)) {
    return rawLocale as Locale;
  }
  return defaultLocale;
}

function getLocaleSeo(locale: Locale) {
  const messages = locale === "en" ? enMessages : zhMessages;
  const title = `${messages.common.title} - ${messages.common.subtitle}`;
  const description = messages.common.description;
  const localeTag = locale === "en" ? "en_US" : "zh_CN";
  const canonical = `${SEO_BASE_URL}/${locale}`;
  const alternateLocale = locale === "en" ? "zh" : "en";

  return {
    title,
    description,
    localeTag,
    canonical,
    alternateLocale
  };
}

export const Route = createFileRoute("/$locale")({
  head: ({ params }) => {
    const locale = resolveLocale(params.locale);
    const seo = getLocaleSeo(locale);

    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { name: "robots", content: "index,follow" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Magic Resume" },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:locale", content: seo.localeTag },
        { property: "og:url", content: seo.canonical },
        { property: "og:image", content: `${SEO_BASE_URL}/web-shot.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: seo.title },
        { name: "twitter:description", content: seo.description },
        { name: "twitter:image", content: `${SEO_BASE_URL}/web-shot.png` }
      ],
      links: [
        { rel: "canonical", href: seo.canonical },
        { rel: "alternate", hrefLang: locale, href: seo.canonical },
        {
          rel: "alternate",
          hrefLang: seo.alternateLocale,
          href: `${SEO_BASE_URL}/${seo.alternateLocale}`
        },
        { rel: "alternate", hrefLang: "x-default", href: `${SEO_BASE_URL}/zh` }
      ]
    };
  },
  component: LocaleLandingPage
});

function LocaleLandingPage() {
  const { locale } = Route.useParams();

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  return <LandingPage />;
}
