import createNextIntlPlugin from "next-intl/plugin";
import path from "path";
import { fileURLToPath } from "url";
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
const withNextIntl = createNextIntlPlugin();

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const config = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // output: "export",
};

export default withNextIntl(config);
