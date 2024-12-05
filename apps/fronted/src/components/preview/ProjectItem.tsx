import React, { ForwardedRef } from "react";
import { motion } from "framer-motion";
import { Project, GlobalSettings } from "@/types/resume";
import { cn } from "@/lib/utils";

interface ProjectItemProps {
  project: Project;
  draggingProjectId: string | null;
  globalSettings: GlobalSettings | undefined;
}

const ProjectItem = React.forwardRef(
  (
    { project, draggingProjectId, globalSettings }: ProjectItemProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const isDragging = draggingProjectId === project.id;
    return (
      <motion.div
        key={project.id}
        data-project-id={project.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: isDragging ? 1.01 : 1
        }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 50,
          mass: 1
        }}
        className={cn("relative rounded-lg  pl-0", isDragging && "z-10")}
        style={{
          marginTop: `${globalSettings?.paragraphSpacing}px`
        }}
        ref={ref}
      >
        {isDragging && (
          <motion.div
            layoutId="project-highlight"
            className="absolute inset-0 rounded-lg pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className={cn(
                "absolute inset-0 rounded-lg",
                "bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 border-2 border-indigo-500/10"
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 animate-pulse",
                  "bg-black/5",
                  "rounded-lg"
                )}
              />
            </div>
          </motion.div>
        )}

        <motion.div
          layout
          className="flex justify-between items-start relative z-10 "
          style={{ pageBreakInside: "avoid" }}
        >
          <motion.div layout>
            <motion.h4
              layout
              className={cn("font-semibold", "text-gray-800")}
              style={{
                fontSize: `${globalSettings?.subheaderSize || 16}px`
              }}
            >
              {project.name || "未命名项目"}
            </motion.h4>
            <motion.div
              layout
              className={cn("font-medium  text-baseFont")}
              style={{
                fontSize: `${globalSettings?.baseFontSize || 14}px`
              }}
            >
              {project.role}
            </motion.div>
          </motion.div>
          <motion.span
            layout
            className={cn("text-baseFont")}
            style={{
              fontSize: `${globalSettings?.baseFontSize || 14}px`
            }}
          >
            {project.date}
          </motion.span>
        </motion.div>

        {project.description && (
          <motion.div
            layout
            className={cn("whitespace-pre-wrap", "text-baseFont")}
            style={{
              fontSize: `${globalSettings?.baseFontSize || 14}px`,
              lineHeight: globalSettings?.lineHeight || 1.6
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: project.description }} />
          </motion.div>
        )}
      </motion.div>
    );
  }
);

ProjectItem.displayName = "ProjectItem";

export default ProjectItem;
