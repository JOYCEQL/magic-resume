import { useEffect } from "react";
import { useResumeStore } from "../store/useResumeStore"; // 调整路径到你的 store 文件

export const useScrollbarTheme = () => {
  const theme = useResumeStore((state) => state.theme);

  useEffect(() => {
    // 创建样式元素
    const styleElement = document.createElement("style");
    styleElement.setAttribute("id", "scrollbar-style");

    // 根据主题设置不同的滚动条样式
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

    // 移除旧的样式（如果存在）
    const existingStyle = document.getElementById("scrollbar-style");
    if (existingStyle) {
      existingStyle.remove();
    }

    // 添加新样式
    document.head.appendChild(styleElement);

    // 清理函数
    return () => {
      styleElement.remove();
    };
  }, [theme]);
};
