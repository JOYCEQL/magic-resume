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
  minimalist: {
    sectionTitle: {
      className: "mb-3 tracking-widest",
      styles: {
        fontSize: 16,
      },
    },
  },

  elegant: {
    sectionTitle: {
      className: "flex items-center justify-center w-full mb-4 relative",
      styles: {
        fontSize: 20,
      },
    },
  },
  creative: {
    sectionTitle: {
      className: "inline-block px-3 py-1 mb-3 rounded-md text-white shadow-sm",
      styles: {
        fontSize: 16,
        backgroundColor: "var(--theme-color)",
      },
    },
  },

};

