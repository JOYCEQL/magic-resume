import { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { ReactNode } from "react";
import Document from "@/components/Document";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";
type Props = {
  children: ReactNode;
  params: {
    locale: string;
  };
};
export async function generateMetadata({
  params: { locale },
}: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: t("title") + " - " + t("dashboard"),
  };
}
export default async function LocaleLayout({ children }: Props) {
  const locale = await getLocale();

  const messages = await getMessages();

  return (
    <Document
      locale={locale}
      bodyClassName="overflow-y-hidden w-full min-w-[1600px]"
    >
      <NextIntlClientProvider messages={messages}>
        <Providers>{children}</Providers>
        <Toaster position="top-center" richColors />
      </NextIntlClientProvider>
    </Document>
  );
}
