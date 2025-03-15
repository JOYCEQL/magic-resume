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
      date: "2025-03-15",
      sections: [
        {
          title: "修复",
          items: ["修复多余分割线引起的导出PDF 400 错误"]
        },
        {
          title: "优化",
          items: ["项目链接过长时的样式"]
        }
      ]
    },
    {
      date: "2025-03-07",
      sections: [
        {
          title: "新增",
          items: ["工作台 Dock 栏支持复制简历", "仪表盘简历模板支持预览大图"]
        },
        {
          title: "优化",
          items: ["服务端导出PDF 速度优化"]
        }
      ]
    }
  ];
}
