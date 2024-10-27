"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";
import { getThemeConfig } from "@/theme/themeConfig";
import { cn } from "@/lib/utils";

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
    projects
  } = useResumeStore();

  console.log(projects, 111);
  const fontFamilyClass = getFontFamilyClass(
    globalSettings?.fontFamily || "sans"
  );

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "basic":
        return (
          <motion.div layout className="space-y-2">
            <h3
              className="text-lg font-semibold border-b border-gray-200 pb-2"
              style={{
                fontSize: `${globalSettings?.headerSize || 18}px`
              }}
            >
              个人简介
            </h3>
            <p
              className="text-gray-600 whitespace-pre-wrap"
              style={{
                fontSize: `${globalSettings?.contentFontSize || 14}px`,
                lineHeight: globalSettings?.lineHeight || 1.6
              }}
            >
              {basic.summary}
            </p>
          </motion.div>
        );

      case "education":
        return (
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
              教育经历
            </h3>
            {education.map((edu) => (
              <div
                key={edu.id}
                className="space-y-2"
                style={{
                  marginTop: `${globalSettings?.paragraphSpacing || 1.5}em`
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4
                      className="font-medium text-gray-800"
                      style={{
                        fontSize: `${globalSettings?.subheaderSize || 16}px`
                      }}
                    >
                      {edu.school}
                    </h4>
                    <p
                      className="text-gray-600"
                      style={{
                        fontSize: `${globalSettings?.contentFontSize || 14}px`
                      }}
                    >
                      {edu.degree}
                    </p>
                  </div>
                  <span
                    className="text-gray-600"
                    style={{
                      fontSize: `${globalSettings?.contentFontSize || 14}px`
                    }}
                  >
                    {edu.date}
                  </span>
                </div>
                <p
                  className="text-gray-600"
                  style={{
                    fontSize: `${globalSettings?.contentFontSize || 14}px`,
                    lineHeight: globalSettings?.lineHeight || 1.6
                  }}
                >
                  {edu.details}
                </p>
              </div>
            ))}
          </motion.div>
        );

      case "experience":
        return (
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
              工作经验
            </h3>
            {experience.map((exp) => (
              <div
                key={exp.id}
                className="space-y-2"
                style={{
                  marginTop: `${globalSettings?.paragraphSpacing || 1.5}em`
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4
                      className="font-medium text-gray-800"
                      style={{
                        fontSize: `${globalSettings?.subheaderSize || 16}px`
                      }}
                    >
                      {exp.company}
                    </h4>
                    <p
                      className="text-gray-600"
                      style={{
                        fontSize: `${globalSettings?.contentFontSize || 14}px`
                      }}
                    >
                      {exp.position}
                    </p>
                  </div>
                  <span
                    className="text-gray-600"
                    style={{
                      fontSize: `${globalSettings?.contentFontSize || 14}px`
                    }}
                  >
                    {exp.date}
                  </span>
                </div>
                <p
                  className="text-gray-600"
                  style={{
                    fontSize: `${globalSettings?.contentFontSize || 14}px`,
                    lineHeight: globalSettings?.lineHeight || 1.6
                  }}
                >
                  {exp.details}
                </p>
              </div>
            ))}
          </motion.div>
        );
      case "projects":
        return (
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
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 50,
                    mass: 1
                  }}
                  className="space-y-2"
                  style={{
                    marginTop: `${globalSettings?.paragraphSpacing || 1.5}em`
                  }}
                >
                  <motion.div
                    layout
                    className="flex justify-between items-start"
                  >
                    <motion.div layout>
                      <motion.h4
                        layout
                        className="font-medium text-gray-800"
                        style={{
                          fontSize: `${globalSettings?.subheaderSize || 16}px`
                        }}
                      >
                        {project.name}
                      </motion.h4>
                      <motion.p
                        layout
                        className="text-gray-600"
                        style={{
                          fontSize: `${globalSettings?.contentFontSize || 14}px`
                        }}
                      >
                        {project.role}
                      </motion.p>
                    </motion.div>
                    <motion.span
                      layout
                      className="text-gray-600"
                      style={{
                        fontSize: `${globalSettings?.contentFontSize || 14}px`
                      }}
                    >
                      {project.date}
                    </motion.span>
                  </motion.div>

                  {/* 项目描述 */}
                  {project.description && (
                    <motion.p
                      layout
                      className="text-gray-600 whitespace-pre-wrap"
                      style={{
                        fontSize: `${globalSettings?.contentFontSize || 14}px`,
                        lineHeight: globalSettings?.lineHeight || 1.6
                      }}
                    >
                      {project.description}
                    </motion.p>
                  )}

                  {/* 技术栈 */}
                  {project.technologies && (
                    <motion.div layout>
                      <motion.p
                        layout
                        className="text-gray-800 font-medium"
                        style={{
                          fontSize: `${globalSettings?.contentFontSize || 14}px`
                        }}
                      >
                        技术栈：
                      </motion.p>
                      <motion.p
                        layout
                        className="text-gray-600 whitespace-pre-wrap"
                        style={{
                          fontSize: `${globalSettings?.contentFontSize || 14}px`,
                          lineHeight: globalSettings?.lineHeight || 1.6
                        }}
                      >
                        {project.technologies}
                      </motion.p>
                    </motion.div>
                  )}

                  {/* 主要职责 */}
                  {project.responsibilities && (
                    <motion.div layout>
                      <motion.p
                        layout
                        className="text-gray-800 font-medium"
                        style={{
                          fontSize: `${globalSettings?.contentFontSize || 14}px`
                        }}
                      >
                        主要职责：
                      </motion.p>
                      <motion.p
                        layout
                        className="text-gray-600 whitespace-pre-wrap"
                        style={{
                          fontSize: `${globalSettings?.contentFontSize || 14}px`,
                          lineHeight: globalSettings?.lineHeight || 1.6
                        }}
                      >
                        {project.responsibilities}
                      </motion.p>
                    </motion.div>
                  )}

                  {/* 项目成就 */}
                  {project.achievements && (
                    <motion.div layout>
                      <motion.p
                        layout
                        className="text-gray-800 font-medium"
                        style={{
                          fontSize: `${globalSettings?.contentFontSize || 14}px`
                        }}
                      >
                        项目成就：
                      </motion.p>
                      <motion.p
                        layout
                        className="text-gray-600 whitespace-pre-wrap"
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
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      <div className="py-8 px-4 min-h-screen flex justify-center">
        {/* A4 纸张容器 */}
        <motion.div
          layout
          className={cn(
            "w-[210mm] min-h-[297mm]",
            "bg-white",
            "shadow-lg",
            "relative mx-auto",
            fontFamilyClass
          )}
        >
          {/* 内容区域 */}
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
                  className="font-bold text-gray-900"
                  style={{
                    fontSize: `${(globalSettings?.headerSize || 24) * 1.5}px`
                  }}
                >
                  {basic.name}
                </motion.h1>
                <motion.h2
                  layout="position"
                  className="text-gray-600"
                  style={{
                    fontSize: `${globalSettings?.subheaderSize || 16}px`
                  }}
                >
                  {basic.title}
                </motion.h2>
                <motion.div
                  layout="position"
                  className="flex justify-center items-center space-x-4 text-gray-600 flex-wrap"
                  style={{
                    fontSize: `${globalSettings?.contentFontSize || 14}px`
                  }}
                >
                  <span>{basic.email}</span>
                  <span>•</span>
                  <span>{basic.phone}</span>
                  <span>•</span>
                  <span>{basic.location}</span>
                  <span>•</span>
                  <span>
                    {basic.birthDate
                      ? new Date(basic.birthDate).toLocaleDateString()
                      : ""}
                  </span>
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
