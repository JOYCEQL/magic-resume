import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000
  },
  optimizeDeps: {
    exclude: ["pdfjs-dist"]
  },
  ssr: {
    noExternal: ["pdfjs-dist"]
  },
  plugins: [
    tsconfigPaths(),
    tanstackStart({
      srcDirectory: "src",
      router: {
        routesDirectory: "routes"
      },
      // Public pages have no request-specific data. Build them once instead of
      // spending Worker CPU rendering the same document on every visit.
      pages: [{ path: "/zh" }, { path: "/en" }],
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
        autoSubfolderIndex: false,
        failOnError: true,
      },
      sitemap: { enabled: false },
    }),
    viteReact()
  ]
});
