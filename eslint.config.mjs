import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  {
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off"
    }
  },
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".wrangler/**",
    "dist/**",
    "node_modules/**"
  ])
]);
