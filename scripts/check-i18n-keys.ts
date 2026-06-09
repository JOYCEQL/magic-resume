import zh from "../src/i18n/locales/zh.json";
import en from "../src/i18n/locales/en.json";
import ru from "../src/i18n/locales/ru.json";

function flattenKeys(
  value: Record<string, unknown>,
  prefix = ""
): string[] {
  const keys: string[] = [];

  for (const [key, nested] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      keys.push(...flattenKeys(nested as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }

  return keys.sort();
}

const localeFiles = {
  zh,
  en,
  ru,
} as const;

const keySets = Object.fromEntries(
  Object.entries(localeFiles).map(([locale, messages]) => [
    locale,
    new Set(flattenKeys(messages as Record<string, unknown>)),
  ])
) as Record<keyof typeof localeFiles, Set<string>>;

const allKeys = new Set<string>();
for (const keys of Object.values(keySets)) {
  for (const key of keys) {
    allKeys.add(key);
  }
}

let hasMismatch = false;

for (const key of [...allKeys].sort()) {
  const missingIn = Object.entries(keySets)
    .filter(([, keys]) => !keys.has(key))
    .map(([locale]) => locale);

  if (missingIn.length > 0) {
    hasMismatch = true;
    console.error(`Missing key "${key}" in: ${missingIn.join(", ")}`);
  }
}

if (hasMismatch) {
  process.exit(1);
}

console.log(
  `i18n key parity OK (${keySets.zh.size} keys across zh, en, ru)`
);
