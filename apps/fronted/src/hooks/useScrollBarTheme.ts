import { useEffect } from "react";
import { useResumeStore } from "../store/useResumeStore";

export const useScrollbarTheme = () => {
  const theme = useResumeStore((state) => state.theme);

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.setAttribute("id", "scrollbar-style");

    const scrollbarStyles =
      theme === "dark"
        ? `
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #2d2d2d;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #666;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #888;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: #666 #2d2d2d;
        }
      `
        : `
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: #c1c1c1 #f1f1f1;
        }
      `;

    styleElement.textContent = scrollbarStyles;

    const existingStyle = document.getElementById("scrollbar-style");
    if (existingStyle) {
      existingStyle.remove();
    }

    document.head.appendChild(styleElement);

    return () => {
      styleElement.remove();
    };
  }, [theme]);
};
