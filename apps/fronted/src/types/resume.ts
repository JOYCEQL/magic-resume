export interface BasicInfo {
  birthDate: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  date: string;
  details: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  date: string;
  details: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  date: string;
  description: string;
  technologies: string;
  responsibilities: string;
  achievements: string;
  visible: boolean;
}

export interface ResumeSection {
  id: string;
  title: string;
  icon: string;
  type: "basic" | "education" | "experience" | "skills" | "projects";
}

export interface ResumeData {
  basic: BasicInfo;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  projects: Project[];
  sections: ResumeSection[];
  activeSection: string;
  theme: "light" | "dark";
}

export type GlobalSettings = {
  theme: "light" | "dark";
  themeColor: string;
  fontFamily: string;
  baseFontSize: number;
  pagePadding: number;
  paragraphSpacing: number;
};
