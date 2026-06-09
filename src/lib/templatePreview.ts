import { DEFAULT_TEMPLATES } from "@/config";
import { getInitialResumeStateForLocale } from "@/config/localeResumeData";
import { locales, type Locale } from "@/i18n/config";
import type { ResumeData } from "@/types/resume";
import type { ResumeTemplate } from "@/types/template";

export const TEMPLATE_PREVIEW_WIDTH_PX = 794;
export const TEMPLATE_PREVIEW_HEIGHT_PX = 1123;
export const TEMPLATE_SNAPSHOT_VERSION = 1;
export const TEMPLATE_SNAPSHOT_ROOT_ATTRIBUTE = "data-template-snapshot-root";
export const TEMPLATE_SNAPSHOT_ROOT_SELECTOR = `[${TEMPLATE_SNAPSHOT_ROOT_ATTRIBUTE}]`;
export const TEMPLATE_SNAPSHOT_PUBLIC_DIR = "template-snapshots";
export const TEMPLATE_PREVIEW_LOCALES = locales;

export type TemplatePreviewLocale = Locale;

export interface TemplateSnapshotManifest {
  version: number;
  generatedAt: string | null;
  locales: Record<TemplatePreviewLocale, Record<string, string>>;
}

export const createEmptyTemplateSnapshotManifest =
  (): TemplateSnapshotManifest => ({
    version: TEMPLATE_SNAPSHOT_VERSION,
    generatedAt: null,
    locales: {
      zh: {},
      en: {},
      ru: {},
    },
  });

export const isTemplatePreviewLocale = (
  value: string | null | undefined
): value is TemplatePreviewLocale =>
  value !== null &&
  value !== undefined &&
  (locales as readonly string[]).includes(value);

export const getTemplateById = (templateId: string | undefined): ResumeTemplate =>
  DEFAULT_TEMPLATES.find((template) => template.id === templateId) ??
  DEFAULT_TEMPLATES[0];

export const getTemplatePreviewBaseData = (locale: TemplatePreviewLocale) =>
  getInitialResumeStateForLocale(locale);

export const createTemplatePreviewData = (
  template: ResumeTemplate,
  locale: TemplatePreviewLocale
): ResumeData => {
  const baseData = getTemplatePreviewBaseData(locale);

  return {
    ...baseData,
    id: `preview-mock-${locale}-${template.id}`,
    templateId: template.id,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    globalSettings: {
      ...baseData.globalSettings,
      themeColor: template.colorScheme.primary,
      sectionSpacing: template.spacing.sectionGap,
      paragraphSpacing: template.spacing.itemGap,
      pagePadding: template.spacing.contentPadding,
    },
    basic: {
      ...baseData.basic,
      layout: template.basic.layout,
    },
  } as ResumeData;
};

export const getTemplateSnapshotPath = (
  locale: TemplatePreviewLocale,
  templateId: string
) => `/${TEMPLATE_SNAPSHOT_PUBLIC_DIR}/${locale}/${templateId}.png`;

export const getTemplateSnapshotSrc = (
  manifest: TemplateSnapshotManifest,
  locale: TemplatePreviewLocale,
  templateId: string
) => manifest.locales[locale][templateId] ?? null;
