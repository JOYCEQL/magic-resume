import { ResumeTemplate } from "@/types/template";

export const timelineConfig: ResumeTemplate = {
  id: "timeline",
  name: "时间线风格",
  description: "时间线布局，突出经历的时间顺序",
  thumbnail: "timeline",
  layout: "timeline",
  colorScheme: {
    primary: "#18181b",
    secondary: "#64748b",
    background: "#ffffff",
    text: "#212529",
  },
  spacing: {
    sectionGap: 1,
    itemGap: 12,
    contentPadding: 24,
  },
  basic: {
    layout: "right",
  },
  availableSections: ["skills", "experience", "projects", "education"],
};
