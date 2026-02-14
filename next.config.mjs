import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const config = {
  typescript: {
    ignoreBuildErrors: true,
  },
  ...(process.env.NEXT_STANDALONE === "1" && { output: "standalone" }),
};

export default withNextIntl(config);
