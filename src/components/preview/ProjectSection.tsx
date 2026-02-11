"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { Project, GlobalSettings } from "@/types/resume";
import { useResumeStore } from "@/store/useResumeStore";
import { normalizeRichTextContent } from "@/lib/richText";
import { formatDateString } from "@/lib/utils";
import { useLocale } from "next-intl";

interface ProjectItemProps {
  project: Project;
  globalSettings?: GlobalSettings;
}

const ProjectItem = React.forwardRef<HTMLDivElement, ProjectItemProps>(
  ({ project, globalSettings }, ref) => {
    const centerSubtitle = globalSettings?.centerSubtitle;
    const locale = useLocale();

    const flexLayout = globalSettings?.flexibleHeaderLayout;

    return (
      <motion.div
        style={{
          marginTop: `${globalSettings?.paragraphSpacing}px`,
        }}
      >
        <motion.div
          className="flex items-center gap-2"
        >
          <div className={`flex items-center gap-2 ${flexLayout ? '' : 'flex-[1.5]'}`}>
            <h3
              className="font-bold"
              style={{
                fontSize: `${globalSettings?.subheaderSize || 16}px`,
              }}
            >
              {project.name}
            </h3>
          </div>

          {project.link && !centerSubtitle && (
            <a
              href={
                project.link.startsWith("http")
                  ? project.link
                  : `https://${project.link}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`underline ${flexLayout ? '' : 'flex-1'}`}
              title={project.link}
            >
              {(() => {
                try {
                  const url = new URL(
                    project.link.startsWith("http")
                      ? project.link
                      : `https://${project.link}`
                  );
                  return url.hostname.replace(/^www\./, "");
                } catch (e) {
                  return project.link;
                }
              })()}
            </a>
          )}

          {!project.link && !centerSubtitle && !flexLayout && <div className="flex-1"></div>}

          {centerSubtitle && (
            <motion.div
              layout="position"
              className={` text-subtitleFont ${flexLayout ? 'ml-[16px]' : 'flex-1'}`}
              style={{
                fontSize: `${globalSettings?.subheaderSize || 16}px`,
              }}
            >
              {project.role}
            </motion.div>
          )}
          <div
            className={`text-subtitleFont shrink-0 ${flexLayout ? 'ml-auto' : 'flex-1 text-right'}`}
            style={{
              fontSize: `${globalSettings?.subheaderSize || 16}px`,
            }}
          >
            {formatDateString(project.date, locale)}
          </div>
        </motion.div>
        {project.role && !centerSubtitle && (
          <motion.div
            layout="position"
            className=" text-subtitleFont"
            style={{
              fontSize: `${globalSettings?.subheaderSize || 16}px`,
            }}
          >
            {project.role}
          </motion.div>
        )}
        {project.link && centerSubtitle && (
          <a
            href={
              project.link.startsWith("http")
                ? project.link
                : `https://${project.link}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            title={project.link}
          >
            {project.link}
          </a>
        )}
        {project.description ? (
          <motion.div
            layout="position"
            className="mt-2 text-baseFont"
            style={{
              fontSize: `${globalSettings?.baseFontSize || 14}px`,
              lineHeight: globalSettings?.lineHeight || 1.6,
            }}
            dangerouslySetInnerHTML={{
              __html: normalizeRichTextContent(project.description),
            }}
          ></motion.div>
        ) : (
          <div></div>
        )}
      </motion.div>
    );
  }
);

ProjectItem.displayName = "ProjectItem";

interface ProjectSectionProps {
  projects: Project[];
  globalSettings?: GlobalSettings;
  showTitle?: boolean;
}

const ProjectSection: React.FC<ProjectSectionProps> = ({
  projects,
  globalSettings,
  showTitle = true,
}) => {
  const { setActiveSection } = useResumeStore();

  const visibleProjects = projects?.filter((project) => project.visible);

  return (
    <motion.div
      className="hover:cursor-pointer hover:bg-gray-100 rounded-md transition-all duration-300 ease-in-out hover:shadow-md"
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`,
      }}
      onClick={() => {
        setActiveSection("projects");
      }}
    >
      <SectionTitle
        type="projects"
        globalSettings={globalSettings}
        showTitle={showTitle}
      />
      <motion.div layout="position">
        <AnimatePresence mode="popLayout">
          {visibleProjects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              globalSettings={globalSettings}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ProjectSection;
