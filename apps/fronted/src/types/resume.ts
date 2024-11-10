export interface BasicInfo {
  birthDate: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  icons: Record<string, string>;
  customFields: Array<{
    id: string;
    label: string;
    value: string;
    icon: string;
    required: boolean;
    placeholder: string;
  }>;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  date: string;
  details: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  date: string;
  details: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  date: string;
  description: string;
  technologies: string;
  responsibilities: string;
  achievements: string;
  visible: boolean;
}

export interface ResumeSection {
  id: string;
  title: string;
  icon: string;
  type: "basic" | "education" | "experience" | "skills" | "projects";
}

export interface ResumeData {
  basic: BasicInfo;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  projects: Project[];
  sections: ResumeSection[];
  activeSection: string;
  theme: "light" | "dark";
}

export type GlobalSettings = {
  theme: "light" | "dark";
  themeColor: string;
  fontFamily: string;
  baseFontSize: number;
  pagePadding: number;
  paragraphSpacing: number;
};

export interface ThemeColors {
  primary: string; // 主色
  secondary: string; // 次要色
  text: {
    primary: string; // 主要文字颜色
    secondary: string; // 次要文字颜色
    accent: string; // 强调文字颜色
  };
  background: {
    primary: string; // 主要背景色
    secondary: string; // 次要背景色
    accent: string; // 强调背景色
  };
  border: string; // 边框颜色
  divider: string; // 分割线颜色
}

export interface ResumeTheme {
  id: string;
  name: string;
  color: string;
}

export const THEME_COLORS = [
  "#2563eb", // 经典蓝
  "#059669", // 翡翠绿
  "#7c3aed", // 优雅紫
  "#e11d48", // 玫瑰红
  "#d97706", // 琥珀金
  "#0891b2", // 青碧蓝
  "#4f46e5", // 靛青蓝
  "#0d9488", // 青蓝绿
  "#0284c7", // 天际蓝
  "#6d28d9", // 雅致紫
  "#c026d3", // 绯紫红
  "#db2777", // 粉红色
  "#ea580c", // 活力橙
  "#65a30d", // 青柠绿
  "#475569", // 岩石灰
  "#dc2626" // 中国红
];
