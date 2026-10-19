import fontManifest from "@/generated/resume-fonts.json";

type FontSource = {
  family: string;
  url: string;
  format: "truetype" | "opentype" | "woff" | "woff2";
  weight: string;
  style: "normal" | "italic";
};

type FontDefinition = {
  labelKey: string;
  value: string;
  aliases: string[];
  sources: FontSource[];
};

export const DEFAULT_FONT_FAMILY = "\"Alibaba PuHuiTi\", sans-serif";

const FONT_DEFINITIONS: FontDefinition[] = [
  {
    labelKey: "alibaba",
    value: DEFAULT_FONT_FAMILY,
    aliases: [
      "Alibaba PuHuiTi, sans-serif",
      "\"Alibaba PuHuiTi\", sans-serif"
    ],
    sources: [
      {
        family: "Alibaba PuHuiTi",
        url: fontManifest["AlibabaPuHuiTi-3-55-Regular.ttf"],
        format: "woff2",
        weight: "400",
        style: "normal"
      },
      {
        family: "Alibaba PuHuiTi",
        url: fontManifest["AlibabaPuHuiTi-3-85-Bold.ttf"],
        format: "woff2",
        weight: "700",
        style: "normal"
      }
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
      {
        family: "MiSans",
        url: fontManifest["MiSans-Normal.ttf"],
        format: "woff2",
        weight: "400",
        style: "normal"
      },
      {
        family: "MiSans",
        url: fontManifest["MiSans-Medium.ttf"],
        format: "woff2",
        weight: "700",
        style: "normal"
      }
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
      {
        family: "Noto Sans SC",
        url: fontManifest["NotoSansSC-Regular.otf"],
        format: "woff2",
        weight: "400",
        style: "normal"
      },
      {
        family: "Noto Sans SC",
        url: fontManifest["NotoSansSC-Medium.otf"],
        format: "woff2",
        weight: "500",
        style: "normal"
      },
      {
        family: "Noto Sans SC",
        url: fontManifest["NotoSansSC-Bold.otf"],
        format: "woff2",
        weight: "700",
        style: "normal"
      }
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
      {
        family: "Source Han Serif SC",
        url: fontManifest["SourceHanSerifSC-Regular.otf"],
        format: "woff2",
        weight: "400",
        style: "normal"
      },
      {
        family: "Source Han Serif SC",
        url: fontManifest["SourceHanSerifSC-Medium.otf"],
        format: "woff2",
        weight: "500",
        style: "normal"
      },
      {
        family: "Source Han Serif SC",
        url: fontManifest["SourceHanSerifSC-Bold.otf"],
        format: "woff2",
        weight: "700",
        style: "normal"
      }
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
  font-display: swap;
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
    pending = Promise.all(
      definition.sources.map((source) =>
        document.fonts.load(`${source.weight} 14px "${source.family}"`)
      )
    ).then(() => {}).catch(error => {
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
