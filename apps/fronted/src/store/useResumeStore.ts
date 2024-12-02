import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BasicInfo,
  Education,
  Experience,
  GlobalSettings,
  DEFAULT_CONFIG,
  Project,
  CustomItem
} from "../types/resume";

interface CustomSection {
  id: string;
  items: CustomItem[];
}

interface ResumeStore {
  // 基础数据
  basic: BasicInfo;
  education: Education[];
  experience: Experience[];

  // 菜单配置
  menuSections: {
    id: string;
    title: string;
    icon: string;
    enabled: boolean;
    order: number;
  }[];

  customData: Record<string, CustomItem[]>;

  theme: "light" | "dark";
  activeSection: string;

  // 当前使用的主题色 ID
  colorTheme: string;
  setColorTheme: (colorTheme: string) => void;

  // Actions
  updateBasicInfo: (data: Partial<BasicInfo>) => void;
  updateEducation: (data: Education) => void;
  deleteEducation: (id: string) => void;

  updateExperience: (data: Experience) => void;
  deleteExperience: (id: string) => void;
  // 菜单操作
  reorderSections: (newOrder: typeof initialState.menuSections) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  setActiveSection: (sectionId: string) => void;
  updateMenuSections: (sections: typeof initialState.menuSections) => void;

  addCustomData: (sectionId: string) => void;
  updateCustomData: (sectionId: string, items: CustomItem[]) => void;
  removeCustomData: (sectionId: string) => void;
  addCustomItem: (sectionId: string) => void;
  updateCustomItem: (
    sectionId: string,
    itemId: string,
    updates: Partial<CustomItem>
  ) => void;
  removeCustomItem: (sectionId: string, itemId: string) => void;

  toggleTheme: () => void;
  // 全局设置
  globalSettings: GlobalSettings;
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
  // 项目经历
  projects: Project[];
  updateProjects: (project: Project) => void;
  deleteProject: (id: string) => void;
  draggingProjectId: string | null;
  setDraggingProjectId: (id: string | null) => void;

  // 技能特长
  skillContent: string;
  updateSkillContent: (skillContent: string) => void;
}

const initialState = {
  draggingProjectId: null,
  basic: {
    name: "张三",
    title: "高级前端工程师",
    email: "zhangsan@example.com",
    phone: "13800138000",
    location: "北京市朝阳区",
    birthDate: "1995-01",
    icons: {},
    photoConfig: DEFAULT_CONFIG,
    customFields: [
      { id: "personal", label: "个人网站", value: "https://zhangsan.dev" },
      { id: "github", label: "GitHub", value: "https://github.com/zhangsan" }
    ],
    employementStatus: "全职",
    photo: "avatar.svg"
  },
  education: [
    {
      id: "1",
      school: "北京大学",
      major: "计算机科学与技术",
      degree: "本科",
      startDate: "2013-09",
      endDate: "2017-06",
      visible: true,
      gpa: "3.8/4.0",
      location: "北京",
      description: `<ul class="custom-list">
        <li>主修课程：数据结构、算法设计、操作系统、计算机网络、Web开发技术</li>
        <li>专业排名前 5%，连续三年获得一等奖学金</li>
        <li>担任计算机协会技术部部长，组织多次技术分享会</li>
        <li>参与开源项目贡献，获得 GitHub Campus Expert 认证</li>
      </ul>`
    }
  ],
  skillContent: `<div class="skill-content">
  <ul class="custom-list">
    <li>前端框架：精通 React、Vue.js，熟悉 Next.js、Nuxt.js 等 SSR 框架</li>
    <li>开发语言：TypeScript、JavaScript(ES6+)、HTML5、CSS3</li>
    <li>UI/样式：精通 TailwindCSS、Sass/Less、CSS Module、Styled-components</li>
    <li>状态管理：Redux、Vuex、Zustand、Jotai、React Query</li>
    <li>工程化工具：Webpack、Vite、Rollup、Babel、ESLint</li>
    <li>测试工具：Jest、React Testing Library、Cypress</li>
    <li>性能优化：熟悉浏览器渲染原理、性能指标监控、代码分割、懒加载等优化技术</li>
    <li>版本控制：Git、SVN</li>
        <li>技术管理：具备团队管理经验，主导过多个大型项目的技术选型和架构设计</li>
    <li>技术分享：定期组织团队技术分享，主导建设团队技术博客</li>
    <li>敏捷开发：熟悉 Scrum 开发流程，具有良好的项目把控能力</li>
    <li>英语能力：CET-6 分数 560，具备良好的英文文档阅读和技术交流能力</li>
  </ul>
</div>`,
  experience: [
    {
      id: "1",
      company: "字节跳动",
      position: "高级前端工程师",
      date: "2021.07 - 至今",
      visible: true,
      details: `<ul class="custom-list">
      <li>负责抖音创作者平台的开发与维护，主导多个核心功能的技术方案设计</li>
      <li>优化项目工程化配置，将构建时间从 8 分钟优化至 2 分钟，提升团队开发效率</li>
      <li>设计并实现组件库，提升代码复用率达 70%，显著减少开发时间</li>
      <li>主导性能优化项目，使平台首屏加载时间减少 50%，接入 APM 监控系统</li>
      <li>指导初级工程师，组织技术分享会，提升团队整体技术水平</li>
    </ul>`
    }
  ],
  projects: [
    {
      id: "p1",
      name: "抖音创作者中台",
      role: "前端负责人",
      date: "2022.06 - 2023.12",
      description:
        "基于 React 的创作者数据分析和内容管理平台，服务百万级创作者群体，包含数据分析、内容管理、收益管理等多个子系统。",
      technologies:
        "React 18、TypeScript、TailwindCSS、Zustand、React Query、shadcn/ui、Recharts",
      responsibilities: `- 主导项目技术选型和架构设计
- 建立项目开发规范和 CI/CD 流程
- 负责核心功能模块开发和性能优化
- 指导团队成员，把控代码质量`,
      achievements: `- 系统性能显著提升，首屏加载时间减少 50%
- 代码重用率提高到 80%，显著减少开发时间
- 平台日活跃用户提升 200%
- 获得公司年度最佳项目奖`,
      visible: true
    },
    {
      id: "p2",
      name: "微信小程序开发者工具",
      role: "核心开发者",
      date: "2020.03 - 2021.06",
      description:
        "为开发者提供小程序开发、调试和发布的一站式解决方案。基于 Electron 构建的跨平台桌面应用。",
      technologies:
        "Electron、React、TypeScript、Monaco Editor、Node.js、WebSocket",
      responsibilities: `- 负责编辑器核心功能开发
- 实现实时预览和调试功能
- 优化开发者使用体验
- 处理性能问题和 Bug 修复`,
      achievements: `- 编辑器性能提升 40%
- 月活用户增长 150%
- 获得最佳工具奖`,
      visible: true
    },
    {
      id: "p3",
      name: "前端监控平台",
      role: "技术负责人",
      date: "2021.09 - 2022.03",
      description:
        "一个完整的前端监控解决方案，包含错误监控、性能监控、用户行为分析等功能。",
      technologies: "Vue 3、TypeScript、Vite、IndexedDB、WebWorker、Canvas",
      responsibilities: `- 设计监控 SDK 和数据采集方案
- 开发可视化数据面板
- 优化数据处理性能
- 制定监控告警策略`,
      achievements: `- 准确捕获 99.9% 的前端异常
- 帮助业务快速定位并解决问题
- 平均故障排查时间减少 60%`,
      visible: true
    }
  ],
  menuSections: [
    { id: "basic", title: "基本信息", icon: "👤", enabled: true, order: 0 },
    { id: "education", title: "教育经历", icon: "🎓", enabled: true, order: 1 },
    {
      id: "experience",
      title: "工作经验",
      icon: "💼",
      enabled: true,
      order: 2
    },
    { id: "skills", title: "技能特长", icon: "⚡", enabled: true, order: 3 },
    { id: "projects", title: "项目经历", icon: "🚀", enabled: true, order: 4 }
  ],
  customData: {},
  theme: "light" as const,

  colorTheme: "#2563eb",

  activeSection: "basic",

  globalSettings: {
    // fontFamily: "sans",
    baseFontSize: 14,
    pagePadding: 20,
    paragraphSpacing: 20,
    lineHeight: 1.2,
    sectionSpacing: 20,
    headerSize: 18,
    subheaderSize: 16,
    useIconMode: false
  }
};

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      ...initialState,
      setColorTheme: (colorTheme) => {
        set({ colorTheme });
      },

      setDraggingProjectId: (id) => set({ draggingProjectId: id }),

      updateBasicInfo: (data) => {
        set((state) => ({ basic: { ...state.basic, ...data } }));
      },

      updateExperience: (experience) =>
        set((state) => {
          const newExperience = state.experience.some(
            (p) => p.id === experience.id
          )
            ? state.experience.map((p) =>
                p.id === experience.id ? { ...experience } : p
              )
            : [...state.experience, { ...experience }];

          return { experience: newExperience };
        }),

      reorderSections: (newOrder) => {
        const updatedSections = newOrder.map((section, index) => ({
          ...section,
          order: index
        }));

        set({ menuSections: updatedSections });
      },

      toggleSectionVisibility: (sectionId) =>
        set((state) => ({
          menuSections: state.menuSections.map((section) =>
            section.id === sectionId
              ? { ...section, enabled: !section.enabled }
              : section
          )
        })),

      setActiveSection: (sectionId) => set({ activeSection: sectionId }),

      updateMenuSections: (sections) => set({ menuSections: sections }),

      updateProjects: (project) =>
        set((state) => {
          const newProjects = state.projects.some((p) => p.id === project.id)
            ? state.projects.map((p) =>
                p.id === project.id ? { ...project } : p
              )
            : [...state.projects, { ...project }];

          return { projects: newProjects };
        }),

      updateEducation: (education) =>
        set((state) => {
          const newEducations = state.education.some(
            (p) => p.id === education.id
          )
            ? state.education.map((p) =>
                p.id === education.id ? { ...education } : p
              )
            : [...state.education, { ...education }];

          return { education: newEducations };
        }),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id)
        })),

      deleteEducation: (id) =>
        set((state) => ({
          education: state.education.filter((p) => p.id !== id)
        })),

      deleteExperience: (id) =>
        set((state) => ({
          experience: state.experience.filter((p) => p.id !== id)
        })),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light"
        })),
      updateGlobalSettings: (settings) =>
        set((state) => {
          const newSettings = {
            ...state.globalSettings,
            ...settings
          };
          return {
            globalSettings: newSettings
          };
        }),
      addCustomData: (sectionId) =>
        set((state) => ({
          customData: {
            ...state.customData,
            [sectionId]: [
              {
                id: crypto.randomUUID(),
                title: "未命名模块",
                subtitle: "",
                dateRange: "",
                description: "",
                visible: true
              }
            ]
          }
        })),

      updateCustomData: (sectionId, items) =>
        set((state) => ({
          customData: {
            ...state.customData,
            [sectionId]: items
          }
        })),

      removeCustomData: (sectionId) =>
        set((state) => {
          const { [sectionId]: _, ...rest } = state.customData;
          return { customData: rest };
        }),

      addCustomItem: (sectionId) =>
        set((state) => ({
          customData: {
            ...state.customData,
            [sectionId]: [
              ...(state.customData[sectionId] || []),
              {
                id: crypto.randomUUID(),
                title: "未命名模块",
                subtitle: "",
                dateRange: "",
                description: "",
                visible: true
              }
            ]
          }
        })),

      updateCustomItem: (sectionId, itemId, updates) => {
        console.log(sectionId, "sectionId");
        set((state) => ({
          customData: {
            ...state.customData,
            [sectionId]: state.customData[sectionId].map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            )
          }
        }));
      },

      removeCustomItem: (sectionId, itemId) =>
        set((state) => ({
          customData: {
            ...state.customData,
            [sectionId]: state.customData[sectionId].filter(
              (item) => item.id !== itemId
            )
          }
        })),

      updateSkillContent: (content) => set({ skillContent: content })
    }),

    {
      name: "resume-storage"
    }
  )
);
