import { ReactNode } from "react";
import { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import Document from "@/components/Document";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";

type Props = {
  children: ReactNode;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ namespace: "common" });
  return {
    title: t("title") + " - " + t("dashboard"),
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1
      }
    }
  };
}

export default async function LocaleLayout({ children }: Props) {
  const locale = await getLocale();

  const messages = await getMessages();

  return (
    <Document
      locale={locale}
      bodyClassName="overflow-y-hidden w-full"
    >
      <NextIntlClientProvider messages={messages}>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
      </NextIntlClientProvider>
    </Document>
  );
}
