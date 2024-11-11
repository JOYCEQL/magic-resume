export interface BasicInfo {
  birthDate: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  icons: Record<string, string>;
  employed: boolean;
  customFields: Array<{
    id: string;
    label: string;
    value: string;
    icon: string;
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
  "#2563eb",
  "#059669",
  "#7c3aed",
  "#e11d48",
  "#d97706",
  "#0891b2",
  "#4f46e5",
  "#0d9488",
  "#0284c7",
  "#6d28d9",
  "#c026d3",
  "#ea580c",
  "#65a30d",
  "#475569",
  "#dc2626"
];
