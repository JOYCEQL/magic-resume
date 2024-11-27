/** @type {import('next').NextConfig} */
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
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

export default nextConfig;
