import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_FIELD_ORDER } from "@/config";
import { getFileHandle, getConfig, verifyPermission } from "@/utils/fileSystem";
import {
  BasicInfo,
  Education,
  Experience,
  GlobalSettings,
  DEFAULT_CONFIG,
  Project,
  CustomItem,
  ResumeData,
  MenuSection,
} from "../types/resume";

interface ResumeStore {
  resumes: Record<string, ResumeData>;
  activeResumeId: string | null;
  activeResume: ResumeData | null;

  createResume: (templateId: string | null) => string;
  deleteResume: (resume: ResumeData) => void;
  duplicateResume: (resumeId: string) => void;
  updateResume: (resumeId: string, data: Partial<ResumeData>) => void;
  setActiveResume: (resumeId: string) => void;
  updateResumeFromFile: (resume: ResumeData) => void;

  updateBasicInfo: (data: Partial<BasicInfo>) => void;
  updateEducation: (data: Education) => void;
  updateEducationBatch: (educations: Education[]) => void;
  deleteEducation: (id: string) => void;
  updateExperience: (data: Experience) => void;
  updateExperienceBatch: (experiences: Experience[]) => void;
  deleteExperience: (id: string) => void;
  updateProjects: (project: Project) => void;
  updateProjectsBatch: (projects: Project[]) => void;
  deleteProject: (id: string) => void;
  setDraggingProjectId: (id: string | null) => void;
  updateSkillContent: (skillContent: string) => void;
  reorderSections: (newOrder: ResumeData["menuSections"]) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  setActiveSection: (sectionId: string) => void;
  updateMenuSections: (sections: ResumeData["menuSections"]) => void;
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
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
  setColorTheme: (colorTheme: string) => void;
}

const initialGlobalSettings: GlobalSettings = {
  baseFontSize: 16,
  pagePadding: 32,
  paragraphSpacing: 12,
  lineHeight: 1.5,
  sectionSpacing: 10,
  headerSize: 18,
  subheaderSize: 16,
  useIconMode: false,
};

const initialResumeState: Omit<ResumeData, "id" | "createdAt" | "updatedAt"> = {
  title: "新建简历",
  templateId: null,
  basic: {
    name: "张三",
    title: "高级前端工程师",
    employementStatus: "全职",
    email: "zhangsan@example.com",
    phone: "13800138000",
    location: "北京市朝阳区",
    birthDate: "1995-01",
    fieldOrder: DEFAULT_FIELD_ORDER,
    icons: {
      email: "Mail",
      phone: "Phone",
      birthDate: "CalendarRange",
      employementStatus: "Briefcase",
      location: "MapPin",
    },
    photoConfig: DEFAULT_CONFIG,
    customFields: [
      {
        id: "personal",
        label: "个人网站",
        value: "https://zhangsan.dev",
        icon: "Globe",
      },
      {
        id: "github",
        label: "GitHub",
        value: "https://github.com/zhangsan",
        icon: "Github",
      },
    ],
    photo: "/avatar.svg",
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
      </ul>`,
    },
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
    </ul>`,
    },
  ],
  draggingProjectId: null,
  projects: [
    {
      id: "p1",
      name: "抖音创作者中台",
      role: "前端负责人",
      date: "2022.06 - 2023.12",
      description:
        "基于 React 的创作者数据分析和内容管理平台，服务百万级创作者群体，包含数据分析、内容管理、收益管理等多个子系统。",
      visible: true,
    },
    {
      id: "p2",
      name: "微信小程序开发者工具",
      role: "核心开发者",
      date: "2020.03 - 2021.06",
      description:
        "为开发者提供小程序开发、调试和发布的一站式解决方案。基于 Electron 构建的跨平台桌面应用。",
      visible: true,
    },
    {
      id: "p3",
      name: "前端监控平台",
      role: "技术负责人",
      date: "2021.09 - 2022.03",
      description:
        "一个完整的前端监控解决方案，包含错误监控、性能监控、用户行为分析等功能。",
      visible: true,
    },
  ],
  menuSections: [
    { id: "basic", title: "基本信息", icon: "👤", enabled: true, order: 0 },
    { id: "education", title: "教育经历", icon: "🎓", enabled: true, order: 1 },
    {
      id: "experience",
      title: "工作经验",
      icon: "💼",
      enabled: true,
      order: 2,
    },
    { id: "skills", title: "技能特长", icon: "⚡", enabled: true, order: 3 },
    { id: "projects", title: "项目经历", icon: "🚀", enabled: true, order: 4 },
  ],
  customData: {},
  colorTheme: "#2563eb",
  activeSection: "basic",
  globalSettings: initialGlobalSettings,
};

// 同步简历到文件系统
const syncResumeToFile = async (resumeData: ResumeData) => {
  try {
    const handle = await getFileHandle("syncDirectory");
    if (!handle) {
      console.warn("No directory handle found");
      return;
    }

    const hasPermission = await verifyPermission(handle);
    if (!hasPermission) {
      console.warn("No permission to write to directory");
      return;
    }

    const dirHandle = handle as FileSystemDirectoryHandle;
    const fileName = `${resumeData.title}.json`;
    const fileHandle = await dirHandle.getFileHandle(fileName, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(resumeData, null, 2));
    await writable.close();
  } catch (error) {
    console.error("Error syncing resume to file:", error);
  }
};

export const useResumeStore = create(
  persist<ResumeStore>(
    (set, get) => ({
      resumes: {},
      activeResumeId: null,
      activeResume: null,

      createResume: (templateId = null) => {
        const newId = crypto.randomUUID();
        const newResume: ResumeData = {
          ...initialResumeState,
          id: newId,
          templateId,
          title: "新简历" + newId.slice(0, 6),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          resumes: {
            ...state.resumes,
            [newId]: newResume,
          },
          activeResumeId: newId,
          activeResume: newResume,
        }));

        syncResumeToFile(newResume);

        return newId;
      },

      updateResume: (resumeId, data) => {
        set((state) => {
          const resume = state.resumes[resumeId];
          if (!resume) return state;

          const updatedResume = {
            ...resume,
            ...data,
            updatedAt: new Date().toISOString(),
          };

          syncResumeToFile(updatedResume);

          return {
            resumes: {
              ...state.resumes,
              [resumeId]: updatedResume,
            },
            activeResume:
              state.activeResumeId === resumeId
                ? updatedResume
                : state.activeResume,
          };
        });
      },

      // 从文件更新，直接更新resumes
      updateResumeFromFile: (resume) => {
        set((state) => ({
          resumes: {
            ...state.resumes,
            [resume.id]: resume,
          },
        }));
      },

      deleteResume: (resume) => {
        const resumeId = resume.id;
        set((state) => {
          const { [resumeId]: _, activeResume, ...rest } = state.resumes;
          return {
            resumes: rest,
            activeResumeId: null,
            activeResume: null,
          };
        });

        (async () => {
          try {
            const handle = await getFileHandle("syncDirectory");
            if (!handle) return;

            const hasPermission = await verifyPermission(handle);
            if (!hasPermission) return;

            const dirHandle = handle as FileSystemDirectoryHandle;
            try {
              await dirHandle.removeEntry(`${resume.title}.json`);
            } catch (error) {}
          } catch (error) {
            console.error("Error deleting resume file:", error);
          }
        })();
      },

      duplicateResume: (resumeId) => {
        const newId = crypto.randomUUID();
        const originalResume = get().resumes[resumeId];
        const duplicatedResume = {
          ...originalResume,
          id: newId,
          title: `${originalResume.title} (复制)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        get().updateResume(newId, duplicatedResume);
        get().setActiveResume(newId);
      },

      setActiveResume: (resumeId) => {
        const resume = get().resumes[resumeId];
        if (resume) {
          set({ activeResume: resume, activeResumeId: resumeId });
        }
      },

      updateBasicInfo: (data) => {
        set((state) => {
          if (!state.activeResume || !state.activeResumeId) return state;

          const updatedResume = {
            ...state.activeResume,
            basic: {
              ...state.activeResume.basic,
              ...data,
            },
            updatedAt: new Date().toISOString(),
          };

          const newState = {
            ...state,
            resumes: {
              ...state.resumes,
              [state.activeResumeId]: updatedResume,
            },
            activeResume: updatedResume,
          };

          syncResumeToFile(updatedResume);
          return newState;
        });
      },

      updateEducation: (education) => {
        const { activeResumeId, resumes } = get();
        if (!activeResumeId) return;

        const currentResume = resumes[activeResumeId];
        const newEducation = currentResume.education.some(
          (e) => e.id === education.id
        )
          ? currentResume.education.map((e) =>
              e.id === education.id ? education : e
            )
          : [...currentResume.education, education];

        get().updateResume(activeResumeId, { education: newEducation });
      },

      updateEducationBatch: (educations) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          get().updateResume(activeResumeId, { education: educations });
        }
      },

      deleteEducation: (id) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const resume = get().resumes[activeResumeId];
          const updatedEducation = resume.education.filter((e) => e.id !== id);
          get().updateResume(activeResumeId, { education: updatedEducation });
        }
      },

      updateExperience: (experience) => {
        const { activeResumeId, resumes } = get();
        if (!activeResumeId) return;

        const currentResume = resumes[activeResumeId];
        const newExperience = currentResume.experience.find(
          (e) => e.id === experience.id
        )
          ? currentResume.experience.map((e) =>
              e.id === experience.id ? experience : e
            )
          : [...currentResume.experience, experience];

        get().updateResume(activeResumeId, { experience: newExperience });
      },

      updateExperienceBatch: (experiences: Experience[]) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const updateData = { experience: experiences };
          get().updateResume(activeResumeId, updateData);
        }
      },
      deleteExperience: (id) => {
        const { activeResumeId, resumes } = get();
        if (!activeResumeId) return;

        const currentResume = resumes[activeResumeId];
        const updatedExperience = currentResume.experience.filter(
          (e) => e.id !== id
        );

        get().updateResume(activeResumeId, { experience: updatedExperience });
      },

      updateProjects: (project) => {
        const { activeResumeId, resumes } = get();
        if (!activeResumeId) return;
        const currentResume = resumes[activeResumeId];
        const newProjects = currentResume.projects.some(
          (p) => p.id === project.id
        )
          ? currentResume.projects.map((p) =>
              p.id === project.id ? project : p
            )
          : [...currentResume.projects, project];

        get().updateResume(activeResumeId, { projects: newProjects });
      },

      updateProjectsBatch: (projects: Project[]) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const updateData = { projects };
          get().updateResume(activeResumeId, updateData);
        }
      },

      deleteProject: (id) => {
        const { activeResumeId } = get();
        if (!activeResumeId) return;
        const currentResume = get().resumes[activeResumeId];
        const updatedProjects = currentResume.projects.filter(
          (p) => p.id !== id
        );
        get().updateResume(activeResumeId, { projects: updatedProjects });
      },

      setDraggingProjectId: (id: string | null) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          get().updateResume(activeResumeId, { draggingProjectId: id });
        }
      },

      updateSkillContent: (skillContent) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          get().updateResume(activeResumeId, { skillContent });
        }
      },

      reorderSections: (newOrder) => {
        const { activeResumeId, resumes } = get();
        if (activeResumeId) {
          const currentResume = resumes[activeResumeId];
          const basicInfoSection = currentResume.menuSections.find(
            (section) => section.id === "basic"
          );
          const reorderedSections = [
            basicInfoSection,
            ...newOrder.filter((section) => section.id !== "basic"),
          ];
          get().updateResume(activeResumeId, {
            menuSections: reorderedSections as MenuSection[],
          });
        }
      },

      toggleSectionVisibility: (sectionId) => {
        const { activeResumeId, resumes } = get();
        if (activeResumeId) {
          const currentResume = resumes[activeResumeId];
          const updatedSections = currentResume.menuSections.map((section) =>
            section.id === sectionId
              ? { ...section, enabled: !section.enabled }
              : section
          );
          get().updateResume(activeResumeId, { menuSections: updatedSections });
        }
      },

      setActiveSection: (sectionId) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          get().updateResume(activeResumeId, { activeSection: sectionId });
        }
      },

      updateMenuSections: (sections) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          get().updateResume(activeResumeId, { menuSections: sections });
        }
      },

      addCustomData: (sectionId) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const currentResume = get().resumes[activeResumeId];
          const updatedCustomData = {
            ...currentResume.customData,
            [sectionId]: [
              {
                id: crypto.randomUUID(),
                title: "未命名模块",
                subtitle: "",
                dateRange: "",
                description: "",
                visible: true,
              },
            ],
          };
          get().updateResume(activeResumeId, { customData: updatedCustomData });
        }
      },

      updateCustomData: (sectionId, items) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const currentResume = get().resumes[activeResumeId];
          const updatedCustomData = {
            ...currentResume.customData,
            [sectionId]: items,
          };
          get().updateResume(activeResumeId, { customData: updatedCustomData });
        }
      },

      removeCustomData: (sectionId) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const currentResume = get().resumes[activeResumeId];
          const { [sectionId]: _, ...rest } = currentResume.customData;
          get().updateResume(activeResumeId, { customData: rest });
        }
      },

      addCustomItem: (sectionId) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const currentResume = get().resumes[activeResumeId];
          const updatedCustomData = {
            ...currentResume.customData,
            [sectionId]: [
              ...(currentResume.customData[sectionId] || []),
              {
                id: crypto.randomUUID(),
                title: "未命名模块",
                subtitle: "",
                dateRange: "",
                description: "",
                visible: true,
              },
            ],
          };
          get().updateResume(activeResumeId, { customData: updatedCustomData });
        }
      },

      updateCustomItem: (sectionId, itemId, updates) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const currentResume = get().resumes[activeResumeId];
          const updatedCustomData = {
            ...currentResume.customData,
            [sectionId]: currentResume.customData[sectionId].map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            ),
          };
          get().updateResume(activeResumeId, { customData: updatedCustomData });
        }
      },

      removeCustomItem: (sectionId, itemId) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const currentResume = get().resumes[activeResumeId];
          const updatedCustomData = {
            ...currentResume.customData,
            [sectionId]: currentResume.customData[sectionId].filter(
              (item) => item.id !== itemId
            ),
          };
          get().updateResume(activeResumeId, { customData: updatedCustomData });
        }
      },

      updateGlobalSettings: (settings: Partial<GlobalSettings>) => {
        const { activeResumeId, updateResume, activeResume } = get();
        if (activeResumeId) {
          updateResume(activeResumeId, {
            globalSettings: {
              ...activeResume?.globalSettings,
              ...settings,
            },
          });
        }
      },

      setColorTheme: (colorTheme) => {
        const { activeResumeId, updateResume } = get();
        if (activeResumeId) {
          updateResume(activeResumeId, { colorTheme });
        }
      },
    }),
    {
      name: "resume-storage",
    }
  )
);
