import React from "react";
import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { Project, GlobalSettings } from "@/types/resume";

interface ProjectSectionProps {
  projects: Project[];
  globalSettings?: GlobalSettings;
}

const ProjectSection: React.FC<ProjectSectionProps> = ({
  projects,
  globalSettings,
}) => {
  if (!projects?.length) return null;

  return (
    <motion.div
      layout
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`,
      }}
    >
      <SectionTitle
        type="projects"
        globalSettings={globalSettings}
      ></SectionTitle>
      <div className="space-y-4">
        {projects.map((project) => (
          <ProjectItem
            key={project.id}
            project={project}
            globalSettings={globalSettings}
          />
        ))}
      </div>
    </motion.div>
  );
};

interface ProjectItemProps {
  project: Project;
  globalSettings?: GlobalSettings;
}

const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  globalSettings,
}) => {
  return (
    <div
      className="relative"
      style={{
        marginTop: `${globalSettings?.paragraphSpacing}px`,
        fontSize: `${globalSettings?.baseFontSize || 14}px`,
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{project.name}</h3>
        <div>{project.date}</div>
      </div>
      {project.role && (
        <div className="font-medium text-baseFont">{project.role}</div>
      )}
      {project.description && (
        <div
          className=" mt-2 whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: project.description }}
        ></div>
      )}
    </div>
  );
};

export default ProjectSection;
