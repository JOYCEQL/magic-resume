import fontManifest from "@/generated/resume-fonts.json";

type FontSource = {
  family: string;
  url: string;
  format: "truetype" | "opentype" | "woff" | "woff2";
  weight: string;
  style: "normal" | "italic";
  unicodeRange?: string;
};

type FontDefinition = {
  labelKey: string;
  value: string;
  aliases: string[];
  sources: FontSource[];
};

export const DEFAULT_FONT_FAMILY = "\"Alibaba PuHuiTi\", sans-serif";

type ManifestFontSlice = {
  url: string;
  range: string;
};

type FontManifestData = {
  ranges?: Record<string, string>;
  fonts?: Record<string, ManifestFontSlice[]>;
} & Record<string, unknown>;

const manifestData = fontManifest as FontManifestData;

const expandFontSources = (
  family: string,
  fileKey: string,
  weight: string,
  style: "normal" | "italic" = "normal"
): FontSource[] => {
  const slices = manifestData.fonts?.[fileKey];
  const ranges = manifestData.ranges ?? {};
  if (Array.isArray(slices) && slices.length > 0) {
    return slices.map((slice) => ({
      family,
      url: slice.url,
      format: "woff2",
      weight,
      style,
      unicodeRange: ranges[slice.range] || slice.range,
    }));
  }

  const fallbackUrl =
    typeof manifestData[fileKey] === "string"
      ? (manifestData[fileKey] as string)
      : "";
  return [
    {
      family,
      url: fallbackUrl,
      format: "woff2",
      weight,
      style,
    },
  ];
};

const FONT_DEFINITIONS: FontDefinition[] = [
  {
    labelKey: "alibaba",
    value: DEFAULT_FONT_FAMILY,
    aliases: [
      "Alibaba PuHuiTi, sans-serif",
      "\"Alibaba PuHuiTi\", sans-serif"
    ],
    sources: [
      ...expandFontSources("Alibaba PuHuiTi", "AlibabaPuHuiTi-3-55-Regular.ttf", "400"),
      ...expandFontSources("Alibaba PuHuiTi", "AlibabaPuHuiTi-3-85-Bold.ttf", "700")
    ]
  },
  {
    labelKey: "misans",
    value: "\"MiSans\", sans-serif",
    aliases: [
      "\"MiSans\", \"Microsoft YaHei\", \"微软雅黑\", sans-serif",
      "\"Microsoft YaHei\", \"微软雅黑\", sans-serif",
      "\"Microsoft YaHei Local\", \"Microsoft YaHei\", \"微软雅黑\", sans-serif",
      "\"MiSans\", sans-serif",
      "MiSans, sans-serif",
      "Microsoft YaHei, sans-serif"
    ],
    sources: [
      ...expandFontSources("MiSans", "MiSans-Normal.ttf", "400"),
      ...expandFontSources("MiSans", "MiSans-Medium.ttf", "700")
    ]
  },
  {
    labelKey: "notosanssc",
    value: "\"Noto Sans SC\", \"Noto Sans CJK SC\", sans-serif",
    aliases: [
      "\"Noto Sans SC\", \"Noto Sans CJK SC\", sans-serif",
      "Noto Sans SC, sans-serif"
    ],
    sources: [
      ...expandFontSources("Noto Sans SC", "NotoSansSC-Regular.otf", "400"),
      ...expandFontSources("Noto Sans SC", "NotoSansSC-Medium.otf", "500"),
      ...expandFontSources("Noto Sans SC", "NotoSansSC-Bold.otf", "700")
    ]
  },
  {
    labelKey: "sourcehanserifsc",
    value: "\"Source Han Serif SC\", \"Noto Serif SC\", serif",
    aliases: [
      "\"Source Han Serif SC\", \"Noto Serif SC\", serif",
      "\"Noto Serif SC\", \"Source Han Serif SC\", serif",
      "Source Han Serif SC, serif",
      "Noto Serif SC, serif"
    ],
    sources: [
      ...expandFontSources("Source Han Serif SC", "SourceHanSerifSC-Regular.otf", "400"),
      ...expandFontSources("Source Han Serif SC", "SourceHanSerifSC-Medium.otf", "500"),
      ...expandFontSources("Source Han Serif SC", "SourceHanSerifSC-Bold.otf", "700")
    ]
  }
];

const fontDataUrlCache = new Map<string, Promise<string>>();
const fontLoads = new Map<string, Promise<void>>();

const toDataUrl = async (url: string) => {
  if (!fontDataUrlCache.has(url)) {
    fontDataUrlCache.set(
      url,
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load font: ${url}`);
          }
          return response.blob();
        })
        .then(
          (blob) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error(`Failed to read font: ${url}`));
              reader.readAsDataURL(blob);
            })
        )
    );
  }

  return fontDataUrlCache.get(url)!;
};

const findFontDefinition = (fontFamily?: string) => {
  const normalizedValue = fontFamily?.trim();
  if (!normalizedValue) {
    return FONT_DEFINITIONS[0];
  }

  return (
    FONT_DEFINITIONS.find(
      (definition) =>
        definition.value === normalizedValue ||
        definition.aliases.includes(normalizedValue) ||
        definition.aliases.some((alias) =>
          normalizedValue.includes(alias.replace(/"/g, ""))
        )
    ) || FONT_DEFINITIONS[0]
  );
};

const buildFontFaceRule = (source: FontSource, resolvedUrl: string) => `@font-face {
  font-family: "${source.family}";
  src: url("${resolvedUrl}") format("${source.format}");
  font-weight: ${source.weight};
  font-style: ${source.style};
  font-display: swap;${source.unicodeRange ? `\n  unicode-range: ${source.unicodeRange};` : ""}
}`;

export const normalizeFontFamily = (fontFamily?: string) =>
  findFontDefinition(fontFamily).value;

export const preloadFontFamily = async (fontFamily?: string) => {
  if (typeof document === "undefined" || !document.fonts?.load) {
    return;
  }

  const definition = findFontDefinition(fontFamily);
  let pending = fontLoads.get(definition.value);
  if (!pending) {
    const primarySource =
      definition.sources.find((source) => source.weight === "400") ||
      definition.sources[0];
    pending = (
      primarySource
        ? document.fonts.load(
            `${primarySource.weight} 14px "${primarySource.family}"`,
            " "
          )
        : Promise.resolve([])
    )
      .then(() => {})
      .catch((error) => {
        fontLoads.delete(definition.value);
        throw error;
      });
    fontLoads.set(definition.value, pending);
  }
  await pending;
};

export const getFontOptions = (t: (key: string) => string) =>
  FONT_DEFINITIONS.map((definition) => ({
    value: definition.value,
    label: t(definition.labelKey)
  }));

export const getFontFaceCss = async (
  fontFamily?: string,
  inline = false
) => {
  const definition = findFontDefinition(fontFamily);

  const rules = await Promise.all(
    definition.sources.map(async (source) => {
      const resolvedUrl = inline ? await toDataUrl(source.url) : source.url;
      return buildFontFaceRule(source, resolvedUrl);
    })
  );

  return rules.join("\n");
};
