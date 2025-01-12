import { ReactNode } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import Document from "@/components/Document";
import { locales } from "@/i18n/config";
import { Providers } from "@/app/providers";

type Props = {
  children: ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "common" });
  const baseUrl = "https://magic-resume.com";

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        "en-US": `${baseUrl}/en`,
        "zh-CN": `${baseUrl}/zh`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: locale,
      alternateLocale: locale === "en" ? ["zh-CN"] : ["en-US"],
    },
    other: {
      Link: [
        `<${baseUrl}/en>; rel="alternate"; hreflang="en-US"`,
        `<${baseUrl}/zh>; rel="alternate"; hreflang="zh-CN"`,
        `<${baseUrl}/${locale}>; rel="canonical"`,
      ].join(", "),
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: Props) {
  setRequestLocale(locale);

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <Document locale={locale}>
      <NextIntlClientProvider messages={messages}>
        <Providers>{children}</Providers>
      </NextIntlClientProvider>
    </Document>
  );
}
