import { ResumeTemplate } from "@/types/template";

export const classicConfig: ResumeTemplate = {
  id: "classic",
  name: "经典模板",
  description: "传统简约的简历布局，适合大多数求职场景",
  thumbnail: "classic",
  layout: "classic",
  colorScheme: {
    primary: "#000000",
    secondary: "#4b5563",
    background: "#ffffff",
    text: "#212529",
  },
  spacing: {
    sectionGap: 24,
    itemGap: 16,
    contentPadding: 32,
  },
  basic: {
    layout: "left",
  },
  availableSections: ["skills", "experience", "projects", "education"],
};
