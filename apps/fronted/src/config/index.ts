import { BasicFieldType } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";
export const DEFAULT_FIELD_ORDER: BasicFieldType[] = [
  { id: "1", key: "name", label: "姓名", type: "text", visible: true },

  { id: "2", key: "title", label: "职位", type: "text", visible: true },
  {
    id: "3",
    key: "employementStatus",
    label: "求职状态",
    type: "text",
    visible: true,
  },
  { id: "4", key: "birthDate", label: "出生日期", type: "date", visible: true },
  { id: "5", key: "email", label: "电子邮箱", type: "text", visible: true },
  { id: "6", key: "phone", label: "电话", type: "text", visible: true },
  { id: "7", key: "location", label: "所在地", type: "text", visible: true },
];

export const DEFAULT_TEMPLATES: ResumeTemplate[] = [
  {
    id: "classic",
    name: "经典模板",
    description: "传统简约的简历布局，适合大多数求职场景",
    thumbnail: "classic",
    layout: "classic",
    colorScheme: {
      primary: "#2563eb",
      secondary: "#4b5563",
      background: "#ffffff",
      text: "#1f2937",
    },
    spacing: {
      sectionGap: 24,
      itemGap: 16,
      contentPadding: 32,
    },
  },
  {
    id: "modern",
    name: "两栏布局",
    description: "经典两栏，突出个人特色",
    thumbnail: "modern",
    layout: "modern",
    colorScheme: {
      primary: "#059669",
      secondary: "#6b7280",
      background: "#ffffff",
      text: "#111827",
    },
    spacing: {
      sectionGap: 32,
      itemGap: 20,
      contentPadding: 0,
    },
  },
  {
    id: "left-right",
    name: "基础信息左右模板",
    description: "基础信息左右排版",
    thumbnail: "leftRight",
    layout: "left-right",
    colorScheme: {
      primary: "#7c3aed",
      secondary: "#9ca3af",
      background: "#ffffff",
      text: "#374151",
    },
    spacing: {
      sectionGap: 24,
      itemGap: 16,
      contentPadding: 32,
    },
  },
];

export const GITHUB_REPO_URL = "https://github.com/JOYCEQL/magic-resume";
