/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  // serverRuntimeConfig: {
  //   chromePath: process.env.CHROME_PATH
  // },
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("_http_common");
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core"]
  }
};

export default nextConfig;
