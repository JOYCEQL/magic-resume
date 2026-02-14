import { ReactNode } from "react";
import { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import Document from "@/components/Document";
import { Providers } from "@/app/providers";
import Client from "./client";
type Props = {
  children: ReactNode;
};
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ namespace: "common" });
  return {
    title: t("title") + " - " + t("dashboard"),
  };
}
export default async function LocaleLayout({ children }: Props) {
  const locale = await getLocale();

  const messages = await getMessages();

  return (
    <Document locale={locale}>
      <NextIntlClientProvider messages={messages}>
        <Providers>
          <Client>{children}</Client>
        </Providers>
      </NextIntlClientProvider>
    </Document>
  );
}
