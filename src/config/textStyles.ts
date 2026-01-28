import { CSSProperties } from 'react';

// 文本样式配置
export interface TextStyle {
  fontFamily?: string;
  fontSize: number;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  lineHeight: number;
  letterSpacing?: number;
  color?: string;
  marginTop?: number;
  marginBottom?: number;
}

// 样式区域类型
export type StyleRegion = 'name' | 'basicInfo' | 'sectionTitle' | 'itemTitle' | 'itemSubtitle' | 'body';

// 区域样式配置
export type RegionStyles = Record<StyleRegion, TextStyle>;

// 样式区域元数据
export interface StyleRegionMeta {
  id: StyleRegion;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
}

export const STYLE_REGIONS: StyleRegionMeta[] = [
  { id: 'name', label: '姓名', labelEn: 'Name', description: '简历顶部的姓名', descriptionEn: 'Name at the top of resume' },
  { id: 'basicInfo', label: '基础信息', labelEn: 'Basic Info', description: '联系方式、邮箱等', descriptionEn: 'Contact info, email, etc.' },
  { id: 'sectionTitle', label: '区块标题', labelEn: 'Section Title', description: '模块标题如"工作经验"', descriptionEn: 'Section titles like "Experience"' },
  { id: 'itemTitle', label: '区块子标题', labelEn: 'Item Title', description: '公司名、学校名等', descriptionEn: 'Company name, school name, etc.' },
  { id: 'itemSubtitle', label: '重要信息', labelEn: 'Item Subtitle', description: '职位、专业、日期等', descriptionEn: 'Position, major, dates, etc.' },
  { id: 'body', label: '正文', labelEn: 'Body', description: '描述性正文内容', descriptionEn: 'Descriptive body content' },
];

// 默认样式
export const DEFAULT_TEXT_STYLES: RegionStyles = {
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 1.2,
    marginBottom: 4,
  },
  basicInfo: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.5,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 1.3,
    marginTop: 16,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: 'semibold',
    lineHeight: 1.4,
    marginTop: 8,
  },
  itemSubtitle: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.4,
    marginTop: 2,
  },
  body: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.6,
    marginTop: 4,
  },
};

// 字重选项
export const FONT_WEIGHT_OPTIONS = [
  { value: 'normal', label: '常规', labelEn: 'Normal' },
  { value: 'medium', label: '中等', labelEn: 'Medium' },
  { value: 'semibold', label: '半粗', labelEn: 'Semibold' },
  { value: 'bold', label: '粗体', labelEn: 'Bold' },
] as const;

// 字号范围
export const FONT_SIZE_RANGE = { min: 10, max: 36, step: 1 };

// 行高范围
export const LINE_HEIGHT_RANGE = { min: 1.0, max: 2.5, step: 0.1 };

// 间距范围
export const SPACING_RANGE = { min: 0, max: 32, step: 1 };

// 字间距范围
export const LETTER_SPACING_RANGE = { min: -2, max: 10, step: 0.5 };

// 获取合并后的样式（用户设置 + 默认值）
export function getRegionStyle(
  region: StyleRegion,
  regionStyles?: Partial<RegionStyles>
): TextStyle {
  const defaultStyle = DEFAULT_TEXT_STYLES[region];
  const userStyle = regionStyles?.[region];
  return { ...defaultStyle, ...userStyle };
}

// 字重映射到 CSS 值
const fontWeightMap: Record<string, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

// 获取 CSS 样式对象
export function getRegionCSSStyle(
  region: StyleRegion,
  regionStyles?: Partial<RegionStyles>,
  globalFontFamily?: string
): CSSProperties {
  const style = getRegionStyle(region, regionStyles);
  return {
    fontFamily: style.fontFamily || globalFontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight ? fontWeightMap[style.fontWeight] : undefined,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
    color: style.color,
    marginTop: style.marginTop ? `${style.marginTop}px` : undefined,
    marginBottom: style.marginBottom ? `${style.marginBottom}px` : undefined,
  };
}

// 获取字重显示标签
export function getFontWeightLabel(weight: string | undefined, locale: string = 'zh'): string {
  const option = FONT_WEIGHT_OPTIONS.find(o => o.value === weight);
  if (!option) return locale === 'en' ? 'Normal' : '常规';
  return locale === 'en' ? option.labelEn : option.label;
}

// 获取区域显示标签
export function getRegionLabel(region: StyleRegion, locale: string = 'zh'): string {
  const meta = STYLE_REGIONS.find(r => r.id === region);
  if (!meta) return region;
  return locale === 'en' ? meta.labelEn : meta.label;
}
