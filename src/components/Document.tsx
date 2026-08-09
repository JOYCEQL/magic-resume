import { Inter } from "next/font/google";
import { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
});

type Props = {
  children: ReactNode;
  locale: string;
  bodyClassName?: string;
};

export default function Document({ children, locale, bodyClassName }: Props) {
  return (
    <html className={inter.className} lang={locale} suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/AlibabaPuHuiTi-3-55-Regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/AlibabaPuHuiTi-3-85-Bold.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/favicon.ico?v=2" />
      </head>
      <body className={bodyClassName}>{children}</body>
    </html>
  );
}
