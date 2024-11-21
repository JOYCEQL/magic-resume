import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { Reorder } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectItem from "./ProjectItem";
import { Project } from "@/types/resume";

const ProjectPanel = () => {
  const { theme, projects = [], updateProjects } = useResumeStore();

  const handleCreateProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: "Project Name",
      role: "Project Role",
      date: "",
      description: "",
      technologies: "",
      responsibilities: "",
      achievements: "",
      visible: true
    };
    updateProjects(newProject);
  };

  return (
    <div
      className={cn(
        "space-y-4 px-4 py-4 rounded-lg",
        theme === "dark" ? "bg-neutral-900/30" : "bg-white"
      )}
    >
      <Reorder.Group
        axis="y"
        values={projects}
        onReorder={(newOrder) => {
          useResumeStore.setState({ projects: newOrder });
        }}
        className="space-y-3"
      >
        {projects.map((project) => (
          <ProjectItem key={project.id} project={project}></ProjectItem>
        ))}

        <Button
          onClick={handleCreateProject}
          className="w-full bg-indigo-600 text-white hover:bg-indigo-600"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          添加
        </Button>
      </Reorder.Group>
    </div>
  );
};
export default ProjectPanel;