import { ResumeTemplate } from "@/types/template";

export const elegantConfig: ResumeTemplate = {
  id: "elegant",
  name: "优雅模板",
  description: "居中标题单列设计，具有高级感的分隔线",
  thumbnail: "elegant",
  layout: "elegant",
  colorScheme: {
    primary: "#18181b",
    secondary: "#71717a",
    background: "#ffffff",
    text: "#27272a",
  },
  spacing: {
    sectionGap: 28,
    itemGap: 18,
    contentPadding: 32,
  },
  basic: {
    layout: "center",
  },
};
