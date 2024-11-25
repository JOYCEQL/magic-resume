/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  serverRuntimeConfig: {
    chromePath: process.env.CHROME_PATH
  }
};

export default nextConfig;
