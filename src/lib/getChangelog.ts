export interface TimelineEntry {
  date: string;
  sections: {
    title: string;
    items: string[];
  }[];
}

export function getChangelog(): TimelineEntry[] {
  return [
    {
      date: "2025-03-07",
      sections: [
        {
          title: "新增",
          items: ["工作台 Dock 栏支持复制简历", "仪表盘简历模板支持预览大图"],
        },
        {
          title: "优化",
          items: ["服务端导出PDF 速度优化"],
        },
      ],
    },
  ];
}
