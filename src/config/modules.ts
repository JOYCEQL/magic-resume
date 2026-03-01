export interface ResumeModule {
  id: string;
  titleKey: string;
  icon: string;
}

export const STANDARD_MODULES: Record<string, ResumeModule> = {
  skills: { id: "skills", titleKey: "skills", icon: "⚡" },
  experience: { id: "experience", titleKey: "experience", icon: "💼" },
  projects: { id: "projects", titleKey: "projects", icon: "🚀" },
  education: { id: "education", titleKey: "education", icon: "🎓" },
};
