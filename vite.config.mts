import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { fileURLToPath, URL } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";

const config = defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "next/navigation": fileURLToPath(
        new URL("./src/compat/next/navigation.ts", import.meta.url)
      ),
      "next/link": fileURLToPath(
        new URL("./src/compat/next/link.tsx", import.meta.url)
      ),
      "next/image": fileURLToPath(
        new URL("./src/compat/next/image.tsx", import.meta.url)
      ),
      "next/font/google": fileURLToPath(
        new URL("./src/compat/next/font/google.ts", import.meta.url)
      ),
      "next/cache": fileURLToPath(
        new URL("./src/compat/next/cache.ts", import.meta.url)
      ),
      "next/headers": fileURLToPath(
        new URL("./src/compat/next/headers.ts", import.meta.url)
      ),
      "next-intl": fileURLToPath(
        new URL("./src/i18n/client.tsx", import.meta.url)
      )
    }
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"]
    }),
    tanstackStart(),
    viteReact()
  ]
});

export default config;
