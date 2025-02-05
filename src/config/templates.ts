import { TemplateConfig } from "@/types/template";

export const templateConfigs: Record<string, TemplateConfig> = {
  default: {
    sectionTitle: {
      styles: {
        fontSize: 18,
      },
    },
  },
  classic: {
    sectionTitle: {
      className: "border-b pb-2",
      styles: {
        fontSize: 18,
        borderColor: "var(--theme-color)",
      },
    },
  },
  modern: {
    sectionTitle: {
      className: "font-semibold mb-2 uppercase tracking-wider",
      styles: {
        fontSize: 18,
      },
    },
  },
  "left-right": {
    sectionTitle: {
      className: "pl-1 flex items-center",
      styles: {
        fontSize: 18,
        backgroundColor: "var(--theme-color)",
        opacity: 0.1,
        color: "var(--theme-color)",
        borderLeftWidth: "3px",
        borderLeftStyle: "solid",
        borderLeftColor: "var(--theme-color)",
      },
    },
  },
};
