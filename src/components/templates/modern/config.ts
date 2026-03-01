import { ResumeTemplate } from "@/types/template";

export const modernConfig: ResumeTemplate = {
  id: "modern",
  name: "两栏布局",
  description: "经典两栏，突出个人特色",
  thumbnail: "modern",
  layout: "modern",
  colorScheme: {
    primary: "#000000",
    secondary: "#6b7280",
    background: "#ffffff",
    text: "#212529",
  },
  spacing: {
    sectionGap: 20,
    itemGap: 20,
    contentPadding: 1,
  },
  basic: {
    layout: "center",
  },
  availableSections: ["skills", "experience", "projects", "education"],
};
