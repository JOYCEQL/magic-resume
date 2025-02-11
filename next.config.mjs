import createNextIntlPlugin from "next-intl/plugin";
import path from "path";
import { fileURLToPath } from "url";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const config = {
  typescript: {
    ignoreBuildErrors: true,
  },
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/generate-pdf",
        destination:
          "http://1255612844-0z3iovadu8.ap-chengdu.tencentscf.com/generate-pdf",
      },
    ];
  },
};

export default withNextIntl(config);
