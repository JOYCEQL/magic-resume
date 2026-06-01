import { ResumeTemplate } from "@/types/template";

export const swissConfig: ResumeTemplate = {
  id: "swiss",
  name: "瑞士美学",
  description: "极具艺术感的包豪斯国际排版，超粗字重对比与几何色块点缀，彰显理性与高级",
  thumbnail: "swiss",
  layout: "swiss",
  colorScheme: {
    primary: "#0f172a",
    secondary: "#64748b",
    background: "#ffffff",
    text: "#0f172a",
  },
  spacing: {
    sectionGap: 36,
    itemGap: 20,
    contentPadding: 36,
  },
  basic: {
    layout: "left",
  },
  availableSections: ["skills", "experience", "projects", "education", "selfEvaluation", "certificates"],
};
