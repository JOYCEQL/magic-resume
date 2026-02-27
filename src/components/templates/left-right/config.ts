import { ResumeTemplate } from "@/types/template";

export const leftRightConfig: ResumeTemplate = {
  id: "left-right",
  name: "模块标题背景色",
  description: "模块标题背景鲜明，突出美观特色",
  thumbnail: "leftRight",
  layout: "left-right",
  colorScheme: {
    primary: "#000000",
    secondary: "#9ca3af",
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
};
