import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const config = {
  typescript: {
    ignoreBuildErrors: true
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/en",
        permanent: true
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: "/generate-pdf",
        destination:
          "http://1255612844-0z3iovadu8.ap-chengdu.tencentscf.com/generate-pdf"
      }
    ];
  }
};

export default withNextIntl(config);
