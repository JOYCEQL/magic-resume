import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import LandingPage from "@/app/(public)/[locale]/page";
import { defaultLocale } from "@/i18n/config";
import { getMessagesByLocale, isSupportedLocale, normalizeLocale } from "@/i18n/messages";
import { persistLocale } from "@/i18n/runtime";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    if (!isSupportedLocale(params.locale)) {
      throw redirect({
        to: "/$locale",
        params: {
          locale: defaultLocale
        }
      });
    }
  },
  head: ({ params }) => {
    const locale = normalizeLocale(params.locale);
    const messages = getMessagesByLocale(locale);
    const common = messages.common;
    const baseUrl = "https://magicv.art";
    const canonical = `${baseUrl}/${locale}`;
    const alternateLocale = locale === "en" ? "zh" : "en";
    const ogLocale = locale === "en" ? "en_US" : "zh_CN";

    return {
      meta: [
        {
          title: `${common.title} - ${common.subtitle}`
        },
        {
          name: "description",
          content: common.description
        },
        {
          name: "robots",
          content: "index,follow"
        },
        {
          property: "og:type",
          content: "website"
        },
        {
          property: "og:site_name",
          content: common.title
        },
        {
          property: "og:title",
          content: `${common.title} - ${common.subtitle}`
        },
        {
          property: "og:description",
          content: common.description
        },
        {
          property: "og:url",
          content: canonical
        },
        {
          property: "og:locale",
          content: ogLocale
        },
        {
          name: "twitter:card",
          content: "summary_large_image"
        },
        {
          name: "twitter:title",
          content: `${common.title} - ${common.subtitle}`
        },
        {
          name: "twitter:description",
          content: common.description
        }
      ],
      links: [
        {
          rel: "canonical",
          href: canonical
        },
        {
          rel: "alternate",
          hrefLang: "zh",
          href: `${baseUrl}/zh`
        },
        {
          rel: "alternate",
          hrefLang: "en",
          href: `${baseUrl}/en`
        },
        {
          rel: "alternate",
          hrefLang: "x-default",
          href: `${baseUrl}/${defaultLocale}`
        }
      ]
    };
  },
  component: LocalePage
});

function LocalePage() {
  const { locale } = Route.useParams();

  useEffect(() => {
    persistLocale(locale);
  }, [locale]);

  return <LandingPage />;
}
