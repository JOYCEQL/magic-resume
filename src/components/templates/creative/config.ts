import { ResumeTemplate } from "@/types/template";

export const creativeConfig: ResumeTemplate = {
  id: "creative",
  name: "创意模板",
  description: "视觉错落设计，灵动活泼展现个性",
  thumbnail: "creative",
  layout: "creative",
  colorScheme: {
    primary: "#18181b",
    secondary: "#64748b",
    background: "#ffffff",
    text: "#1e293b",
  },
  spacing: {
    sectionGap: 24,
    itemGap: 16,
    contentPadding: 28,
  },
  basic: {
    layout: "left",
  },
  availableSections: ["skills", "experience", "projects", "education"],
};
