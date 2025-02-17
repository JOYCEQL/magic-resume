import { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { ReactNode } from "react";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import Document from "@/components/Document";

type Props = {
  children: ReactNode;
  params: { locale: string };
};

export async function generateMetadata({
  params: { locale }
}: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: t("title")
  };
}
export default async function LocaleLayout({ children }: Props) {
  const locale = await getLocale();

  const messages = await getMessages();

  return (
    <Document locale={locale}>
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </Document>
  );
}
