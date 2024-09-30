import { create } from "zustand";

interface ModelStore {
  skillContent: string;
  setSkillContent: (skillContent: string) => void;
  projectContent: string;
  setProjectContent: (projectContent: string) => void;
  workContent: string;
  setWorkContent: (workContent: string) => void;
}

const useModelStore = create<ModelStore>((set) => ({
  skillContent: "前端",
  setSkillContent: (skillContent: string) => set({ skillContent }),
  projectList: [
    {
      name: "项目1",
      content: "项目1内容"
    },
    {
      name: "项目2",
      content: "项目2内容"
    }
  ],
  projectContent: "项目经历",
  setProjectContent: (projectContent: string) => set({ projectContent }),
  workContent: "工作经历",
  setWorkContent: (workContent: string) => set({ workContent })
}));

export default useModelStore;
