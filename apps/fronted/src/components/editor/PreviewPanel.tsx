"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import React, { useEffect } from "react";

const getFontFamilyClass = (fontFamily: string) => {
  switch (fontFamily) {
    case "serif":
      return "font-serif";
    case "mono":
      return "font-mono";
    default:
      return "font-sans";
  }
};

export function PreviewPanel() {
  const {
    theme,
    basic,
    education,
    experience,
    menuSections,
    globalSettings,
    projects,
    draggingProjectId
  } = useResumeStore();

  const fontFamilyClass = getFontFamilyClass(
    globalSettings?.fontFamily || "sans"
  );

  useEffect(() => {
    console.log(draggingProjectId, "draggingProjectId");
  }, [draggingProjectId]);

  const renderProjects = () => (
    <motion.div
      layout
      className="space-y-4"
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`
      }}
    >
      <h3
        className="text-lg font-semibold border-b border-gray-200 pb-2"
        style={{
          fontSize: `${globalSettings?.headerSize || 18}px`
        }}
      >
        项目经历
      </h3>
      <AnimatePresence mode="popLayout" initial={false}>
        {projects.map((project) => (
          <motion.div
            key={project.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: draggingProjectId === project.id ? 1.01 : 1
            }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 50,
              mass: 1
            }}
            className={cn(
              "space-y-2 relative rounded-lg p-4",
              draggingProjectId === project.id && "z-10"
            )}
            style={{
              marginTop: `${globalSettings?.paragraphSpacing || 1.5}em`
            }}
          >
            {/* 拖拽时的高光效果 */}
            {draggingProjectId === project.id && (
              <motion.div
                layoutId="project-highlight"
                className="absolute  inset-0 rounded-lg pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  className={cn(
                    "absolute inset-0 rounded-lg",
                    theme === "dark"
                      ? "bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border-2 border-indigo-500/20"
                      : "bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 border-2 border-indigo-500/10"
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 animate-pulse",
                      theme === "dark" ? "bg-white/5" : "bg-black/5",
                      "rounded-lg"
                    )}
                  />
                </div>
              </motion.div>
            )}

            <motion.div
              layout
              className="flex justify-between items-start relative z-10"
            >
              <motion.div layout>
                <motion.h4
                  layout
                  className={cn(
                    "font-medium",
                    theme === "dark" ? "text-neutral-200" : "text-gray-800"
                  )}
                  style={{
                    fontSize: `${globalSettings?.subheaderSize || 16}px`
                  }}
                >
                  {project.name || "未命名项目"}
                </motion.h4>
                <motion.p
                  layout
                  className={cn(
                    theme === "dark" ? "text-neutral-400" : "text-gray-600"
                  )}
                  style={{
                    fontSize: `${globalSettings?.contentFontSize || 14}px`
                  }}
                >
                  {project.role}
                </motion.p>
              </motion.div>
              <motion.span
                layout
                className={cn(
                  theme === "dark" ? "text-neutral-400" : "text-gray-600"
                )}
                style={{
                  fontSize: `${globalSettings?.contentFontSize || 14}px`
                }}
              >
                {project.date}
              </motion.span>
            </motion.div>

            {project.description && (
              <motion.p
                layout
                className={cn(
                  "whitespace-pre-wrap",
                  theme === "dark" ? "text-neutral-400" : "text-gray-600"
                )}
                style={{
                  fontSize: `${globalSettings?.contentFontSize || 14}px`,
                  lineHeight: globalSettings?.lineHeight || 1.6
                }}
              >
                {project.description}
              </motion.p>
            )}

            {project.technologies && (
              <motion.div layout>
                <motion.p
                  layout
                  className={cn(
                    "font-medium",
                    theme === "dark" ? "text-neutral-300" : "text-gray-800"
                  )}
                  style={{
                    fontSize: `${globalSettings?.contentFontSize || 14}px`
                  }}
                >
                  技术栈：
                </motion.p>
                <motion.p
                  layout
                  className={cn(
                    "whitespace-pre-wrap",
                    theme === "dark" ? "text-neutral-400" : "text-gray-600"
                  )}
                  style={{
                    fontSize: `${globalSettings?.contentFontSize || 14}px`,
                    lineHeight: globalSettings?.lineHeight || 1.6
                  }}
                >
                  {project.technologies}
                </motion.p>
              </motion.div>
            )}

            {project.responsibilities && (
              <motion.div layout>
                <motion.p
                  layout
                  className={cn(
                    "font-medium",
                    theme === "dark" ? "text-neutral-300" : "text-gray-800"
                  )}
                  style={{
                    fontSize: `${globalSettings?.contentFontSize || 14}px`
                  }}
                >
                  主要职责：
                </motion.p>
                <motion.p
                  layout
                  className={cn(
                    "whitespace-pre-wrap",
                    theme === "dark" ? "text-neutral-400" : "text-gray-600"
                  )}
                  style={{
                    fontSize: `${globalSettings?.contentFontSize || 14}px`,
                    lineHeight: globalSettings?.lineHeight || 1.6
                  }}
                >
                  {project.responsibilities}
                </motion.p>
              </motion.div>
            )}

            {project.achievements && (
              <motion.div layout>
                <motion.p
                  layout
                  className={cn(
                    "font-medium",
                    theme === "dark" ? "text-neutral-300" : "text-gray-800"
                  )}
                  style={{
                    fontSize: `${globalSettings?.contentFontSize || 14}px`
                  }}
                >
                  项目成就：
                </motion.p>
                <motion.p
                  layout
                  className={cn(
                    "whitespace-pre-wrap",
                    theme === "dark" ? "text-neutral-400" : "text-gray-600"
                  )}
                  style={{
                    fontSize: `${globalSettings?.contentFontSize || 14}px`,
                    lineHeight: globalSettings?.lineHeight || 1.6
                  }}
                >
                  {project.achievements}
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );

  // 其他 section 的渲染函数保持不变...

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "projects":
        return renderProjects();
      // 其他 case 保持不变...
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={cn(
        "flex-1 overflow-y-auto",
        theme === "dark" ? "bg-neutral-900" : "bg-gray-100"
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="py-8 px-4 min-h-screen flex justify-center">
        <motion.div
          layout
          className={cn(
            "w-[210mm] min-h-[297mm]",
            "bg-white",
            "shadow-lg",
            "relative mx-auto",
            fontFamilyClass,
            theme === "dark" && "bg-neutral-900 text-neutral-100"
          )}
        >
          <div
            className="relative"
            style={{
              padding: `${globalSettings?.pagePadding || 40}px`
            }}
            id="resume-preview"
          >
            <motion.div layout className="space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <motion.h1
                  layout="position"
                  className={cn(
                    "font-bold",
                    theme === "dark" ? "text-neutral-100" : "text-gray-900"
                  )}
                  style={{
                    fontSize: `${(globalSettings?.headerSize || 24) * 1.5}px`
                  }}
                >
                  {basic.name}
                </motion.h1>
                <motion.h2
                  layout="position"
                  className={
                    theme === "dark" ? "text-neutral-400" : "text-gray-600"
                  }
                  style={{
                    fontSize: `${globalSettings?.subheaderSize || 16}px`
                  }}
                >
                  {basic.title}
                </motion.h2>
                <motion.div
                  layout="position"
                  className="flex justify-center items-center space-x-4 flex-wrap"
                  style={{
                    fontSize: `${globalSettings?.contentFontSize || 14}px`,
                    color:
                      theme === "dark"
                        ? "rgb(163, 163, 163)"
                        : "rgb(75, 85, 99)"
                  }}
                >
                  {[
                    basic.email,
                    basic.phone,
                    basic.location,
                    basic.birthDate
                      ? new Date(basic.birthDate).toLocaleDateString()
                      : ""
                  ]
                    .filter(Boolean)
                    .map((item, index, array) => (
                      <React.Fragment key={index}>
                        <span>{item}</span>
                        {index < array.length - 1 && <span>•</span>}
                      </React.Fragment>
                    ))}
                </motion.div>
              </div>

              {/* Sections */}
              {menuSections
                .filter((section) => section.enabled)
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <motion.div key={section.id} layout>
                    {renderSection(section.id)}
                  </motion.div>
                ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
