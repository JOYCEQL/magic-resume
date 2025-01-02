import { Inter } from "next/font/google";
import { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
});

type Props = {
  children: ReactNode;
  locale: string;
};

export default function Document({ children, locale }: Props) {
  return (
    <html className={inter.className} lang={locale} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
