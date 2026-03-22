import { ResumeTemplate } from "@/types/template";

export const editorialConfig: ResumeTemplate = {
  id: "editorial",
  name: "Editorial",
  description: "高端画报风模板，大号精美衬线体与窄体无衬线的完美结合，附带专属侧边时光轴设计，极具奢华感。",
  thumbnail: "editorial",
  layout: "editorial",
  colorScheme: {
    primary: "#000000",
    secondary: "#666666",
    text: "#1a1a1a",
    background: "#FAF8F5",
  },
  spacing: {
    sectionGap: 32,
    itemGap: 16,
    contentPadding: 36,
  },
  basic: {
    layout: "left",
  },
  availableSections: ["basic", "experience", "education", "projects", "skills", "selfEvaluation", "certificates", "languages", "custom"],
};
