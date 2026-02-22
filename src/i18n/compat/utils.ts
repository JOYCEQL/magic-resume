export type TranslationValues = Record<
  string,
  string | number | boolean | null | undefined
>;

function getByPath(source: unknown, path: string) {
  if (!path) return source;
  if (source == null) return undefined;

  return path
    .split(".")
    .reduce<unknown>(
      (acc, segment) =>
        acc != null && typeof acc === "object"
          ? (acc as Record<string, unknown>)[segment]
          : undefined,
      source
    );
}

function interpolate(message: string, values?: TranslationValues) {
  if (!values) return message;

  return message.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = values[key];
    return value == null ? `{${key}}` : String(value);
  });
}

export type Translator = ((key: string, values?: TranslationValues) => string) & {
  raw: (key: string) => unknown;
};

export function createTranslator(
  messages: Record<string, unknown>,
  namespace?: string
): Translator {
  const scopedSource =
    (namespace ? getByPath(messages, namespace) : messages) ?? {};

  const translate = ((key: string, values?: TranslationValues) => {
    const value = getByPath(scopedSource, key);

    if (typeof value === "string") {
      return interpolate(value, values);
    }

    if (value == null) {
      return key;
    }

    return String(value);
  }) as Translator;

  translate.raw = (key: string) => getByPath(scopedSource, key);

  return translate;
}

