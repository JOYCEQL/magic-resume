import { ReactNode } from "react";
import { Metadata } from "next";
import "./globals.css";

type Props = {
  children: ReactNode;
};

export const metadata: Metadata = {
  metadataBase: new URL("https://magicv.art"),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: Props) {
  return children;
}
