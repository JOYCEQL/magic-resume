import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ResumeData,
  ResumeSection,
  BasicInfo,
  Education,
  Experience,
  GlobalSettings,
  Project,
  ResumeTheme
} from "../types/resume";

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

  // 主题设置
  theme: "light" | "dark";
  activeSection: string;

  colorTheme: string; // 当前使用的主题色 ID

  // 新增 Actions
  setColorTheme: (colorTheme: string) => void;

  // Actions
  updateBasicInfo: (data: Partial<BasicInfo>) => void;
  updateEducation: (id: string, data: Partial<Education>) => void;
  updateExperience: (id: string, data: Partial<Experience>) => void;

  // 菜单操作
  reorderSections: (newOrder: typeof initialState.menuSections) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  setActiveSection: (sectionId: string) => void;
  toggleTheme: () => void;
  // 全局设置
  globalSettings?: GlobalSettings;
  updateGlobalSettings?: (settings: Partial<GlobalSettings>) => void;
  // 项目经历
  projects: Project[];
  updateProjects: (project: Project) => void;
  deleteProject: (id: string) => void;
  draggingProjectId: string | null;
  setDraggingProjectId: (id: string | null) => void;
}

const initialState = {
  draggingProjectId: null,
  basic: {
    name: "张三",
    title: "高级前端工程师",
    email: "example@email.com",
    phone: "13800138000",
    location: "北京市",
    summary: "5年前端开发经验...",
    birthDate: "1995-01-01"
  },
  education: [
    {
      id: "1",
      school: "北京大学",
      degree: "计算机科学与技术",
      date: "2016-2020",
      details: "主修课程：..."
    }
  ],
  experience: [
    {
      id: "1",
      company: "某科技有限公司",
      position: "高级前端工程师",
      date: "2020-至今",
      details: "负责公司核心产品..."
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
  theme: "light" as const,

  // 主题色
  colorTheme: "#2563eb", // 默认使用经典蓝主题

  activeSection: "basic",
  projects: [
    {
      id: "p1",
      name: "企业中台系统",
      role: "前端负责人",
      date: "2023.06 - 2023.12",
      description:
        "基于 React 的企业级中台项目，包含工作流、报表、系统管理等多个子系统",
      technologies: "React, TypeScript, TailwindCSS, shadcn/ui",
      responsibilities:
        "负责整体技术方案设计和团队管理，把控项目进度和代码质量",
      achievements: "系统整体性能提升 50%，代码重用率提高到 80%",
      visible: true
    },
    {
      id: "p2",
      name: "xxx",
      role: "前端负责人",
      date: "2023.06 - 2023.12",
      description:
        "基于 React 的企业级中台项目，包含工作流、报表、系统管理等多个子系统",
      technologies: "React, TypeScript, TailwindCSS, shadcn/ui",
      responsibilities:
        "负责整体技术方案设计和团队管理，把控项目进度和代码质量",
      achievements: "系统整体性能提升 50%，代码重用率提高到 80%",
      visible: true
    }
  ]
};

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      ...initialState,
      setColorTheme: (colorTheme) => {
        console.log(colorTheme, "colorTheme");
        set({ colorTheme });
      },

      setDraggingProjectId: (id) => set({ draggingProjectId: id }),

      updateBasicInfo: (data) =>
        set((state) => ({ basic: { ...state.basic, ...data } })),

      updateEducation: (id, data) =>
        set((state) => ({
          education: state.education.map((edu) =>
            edu.id === id ? { ...edu, ...data } : edu
          )
        })),

      updateExperience: (id, data) =>
        set((state) => ({
          experience: state.experience.map((exp) =>
            exp.id === id ? { ...exp, ...data } : exp
          )
        })),

      reorderSections: (newOrder) => {
        // 根据新顺序重新计算每个部分的 order
        const updatedSections = newOrder.map((section, index) => ({
          ...section,
          order: index // 根据数组索引设置新的顺序
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

      updateProjects: (project) =>
        set((state) => {
          const newProjects = state.projects.some((p) => p.id === project.id)
            ? state.projects.map((p) =>
                p.id === project.id ? { ...project } : p
              )
            : [...state.projects, { ...project }];

          return { projects: newProjects };
        }),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id)
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
        })
    }),

    {
      name: "resume-storage"
    }
  )
);
