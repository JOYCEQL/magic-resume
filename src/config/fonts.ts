export interface FontOption {
  id: string;           // 唯一标识
  name: string;         // 显示名称(中文)
  nameEn: string;       // 显示名称(英文)
  family: string;       // CSS font-family 值
  file: string;         // 字体文件路径
  weight?: string;      // 字重范围(可变字体)
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'alibaba',
    name: '阿里巴巴普惠体',
    nameEn: 'Alibaba PuHuiTi',
    family: 'Alibaba PuHuiTi',
    file: '/fonts/AlibabaPuHuiTi-3-55-Regular.ttf',
  },
  {
    id: 'misans',
    name: '小米MiSans',
    nameEn: 'MiSans',
    family: 'MiSans',
    file: '/fonts/MiSans-VF.ttf',
    weight: '100 900',
  },
  {
    id: 'noto',
    name: '思源黑体',
    nameEn: 'Noto Sans SC',
    family: 'Noto Sans SC',
    file: '/fonts/NotoSansSC.ttf',
  },
];

export const DEFAULT_FONT_ID = 'alibaba';

export const getFontById = (id: string): FontOption | undefined => {
  return FONT_OPTIONS.find(f => f.id === id);
};

export const getFontFamily = (id: string): string => {
  const font = getFontById(id);
  return font ? `"${font.family}", sans-serif` : '"Alibaba PuHuiTi", sans-serif';
};

export const generateFontFaces = (): string => {
  return FONT_OPTIONS.map(font => `
    @font-face {
      font-family: "${font.family}";
      src: url("${font.file}") format("truetype");
      font-weight: ${font.weight || 'normal'};
      font-style: normal;
      font-display: swap;
    }
  `).join('\n');
};
