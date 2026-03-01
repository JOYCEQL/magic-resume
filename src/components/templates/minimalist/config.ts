import { ResumeTemplate } from "@/types/template";

export const minimalistConfig: ResumeTemplate = {
  id: "minimalist",
  name: "极简模板",
  description: "大面积留白，干净纯粹的排版风格",
  thumbnail: "minimalist",
  layout: "minimalist",
  colorScheme: {
    primary: "#171717",
    secondary: "#737373",
    background: "#ffffff",
    text: "#171717",
  },
  spacing: {
    sectionGap: 32,
    itemGap: 24,
    contentPadding: 40,
  },
  basic: {
    layout: "center",
  },
  availableSections: ["skills", "experience", "projects", "education"],
};
