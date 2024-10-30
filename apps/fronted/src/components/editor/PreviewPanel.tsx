"use client";

import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import { throttle } from "lodash";
import { THEME_COLORS } from "@/types/resume";

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
    draggingProjectId,
    colorTheme
  } = useResumeStore();
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [scrollBehavior, setScrollBehavior] =
    React.useState<ScrollBehavior>("smooth");

  const fontFamilyClass = getFontFamilyClass(
    globalSettings?.fontFamily || "sans"
  );

  // 获取当前主题色
  const currentThemeColor = useMemo(() => {
    return colorTheme || THEME_COLORS[0];
  }, [colorTheme]);

  // 标题样式的公共配置
  const sectionTitleStyles = {
    fontSize: `${globalSettings?.headerSize || 18}px`,
    borderColor: currentThemeColor, // 使用主题色作为下边框颜色
    color: currentThemeColor // 使用主题色作为文字颜色
  };

  // 处理自动滚动
  const handleScroll = React.useCallback(
    throttle((offset: number) => {
      if (previewRef.current) {
        previewRef.current.scrollBy({
          top: offset,
          behavior: scrollBehavior
        });
      }
    }, 100),
    [scrollBehavior]
  );

  // 使用 IntersectionObserver 监测拖拽元素
  React.useEffect(() => {
    if (!draggingProjectId || !previewRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && previewRef.current) {
            const element = entry.target;
            const container = previewRef.current;

            const elementRect = element.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const offset =
              elementRect.top -
              containerRect.top -
              (containerRect.height - elementRect.height) / 2;

            handleScroll(offset);
          }
        });
      },
      {
        root: previewRef.current,
        threshold: 0.5,
        rootMargin: "-100px 0px"
      }
    );

    const draggingElement = document.querySelector(
      `[data-project-id="${draggingProjectId}"]`
    );
    if (draggingElement) {
      observer.observe(draggingElement);
    }

    return () => {
      observer.disconnect();
      handleScroll.cancel();
    };
  }, [draggingProjectId, handleScroll]);

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
        style={sectionTitleStyles}
      >
        项目经历
      </h3>
      <AnimatePresence mode="popLayout" initial={false}>
        {projects
          .filter((project) => project.visible) // 只显示 visible 为 true 的项目
          .map((project) => (
            <motion.div
              key={project.id}
              data-project-id={project.id}
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
              {/* 拖拽高亮效果 */}
              {draggingProjectId === project.id && (
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
                className="flex justify-between items-start relative z-10"
              >
                <motion.div layout>
                  <motion.h4
                    layout
                    className={cn("font-medium", "text-gray-800")}
                    style={{
                      fontSize: `${globalSettings?.subheaderSize || 16}px`
                    }}
                  >
                    {project.name || "未命名项目"}
                  </motion.h4>
                  <motion.div
                    layout
                    className={cn("text-gray-600")}
                    style={{
                      fontSize: `${globalSettings?.baseFontSize || 14}px`
                    }}
                  >
                    {project.role}
                  </motion.div>
                </motion.div>
                <motion.span
                  layout
                  className={cn("text-gray-600")}
                  style={{
                    fontSize: `${globalSettings?.baseFontSize || 14}px`
                  }}
                >
                  {project.date}
                </motion.span>
              </motion.div>

              {/* 项目详情 */}
              {project.description && (
                <motion.div
                  layout
                  className={cn("whitespace-pre-wrap", "text-gray-600")}
                  style={{
                    fontSize: `${globalSettings?.baseFontSize || 14}px`,
                    lineHeight: globalSettings?.lineHeight || 1.6
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{ __html: project.description }}
                  />
                </motion.div>
              )}

              {/* 技术栈 */}
              {project.technologies && (
                <motion.div layout>
                  <motion.div
                    layout
                    className={cn("font-medium", "text-gray-800")}
                    style={{
                      fontSize: `${globalSettings?.baseFontSize || 14}px`
                    }}
                  >
                    技术栈：
                  </motion.div>
                  <motion.div
                    layout
                    className={cn("whitespace-pre-wrap", "text-gray-600")}
                    style={{
                      fontSize: `${globalSettings?.baseFontSize || 14}px`,
                      lineHeight: globalSettings?.lineHeight || 1.6
                    }}
                  >
                    {project.technologies}
                  </motion.div>
                </motion.div>
              )}

              {/* 主要职责 */}
              {project.responsibilities && (
                <motion.div layout>
                  <motion.div
                    layout
                    className={cn("font-medium", "text-gray-800")}
                    style={{
                      fontSize: `${globalSettings?.baseFontSize || 14}px`
                    }}
                  >
                    主要职责：
                  </motion.div>
                  <motion.div
                    layout
                    className={cn("whitespace-pre-wrap", "text-gray-600")}
                    style={{
                      fontSize: `${globalSettings?.baseFontSize || 14}px`,
                      lineHeight: globalSettings?.lineHeight || 1.6
                    }}
                  >
                    {project.responsibilities}
                  </motion.div>
                </motion.div>
              )}

              {/* 项目成就 */}
              {project.achievements && (
                <motion.div layout>
                  <motion.div
                    layout
                    className={cn("font-medium", "text-gray-800")}
                    style={{
                      fontSize: `${globalSettings?.baseFontSize || 14}px`
                    }}
                  >
                    项目成就：
                  </motion.div>
                  <motion.div
                    layout
                    className={cn("whitespace-pre-wrap", "text-gray-600")}
                    style={{
                      fontSize: `${globalSettings?.baseFontSize || 14}px`,
                      lineHeight: globalSettings?.lineHeight || 1.6
                    }}
                  >
                    {project.achievements}
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          ))}
      </AnimatePresence>
    </motion.div>
  );

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "basic":
        return (
          <motion.div layout className="space-y-2">
            <h3
              className="text-lg font-semibold border-b border-gray-200 pb-2"
              style={sectionTitleStyles}
            >
              个人简介
            </h3>
            <p
              className="text-gray-600 whitespace-pre-wrap"
              style={{
                fontSize: `${globalSettings?.baseFontSize || 14}px`,
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
              style={sectionTitleStyles}
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
                        fontSize: `${globalSettings?.baseFontSize || 14}px`
                      }}
                    >
                      {edu.degree}
                    </p>
                  </div>
                  <span
                    className="text-gray-600"
                    style={{
                      fontSize: `${globalSettings?.baseFontSize || 14}px`
                    }}
                  >
                    {edu.date}
                  </span>
                </div>
                <p
                  className="text-gray-600"
                  style={{
                    fontSize: `${globalSettings?.baseFontSize || 14}px`,
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
              style={sectionTitleStyles}
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
                        fontSize: `${globalSettings?.baseFontSize || 14}px`
                      }}
                    >
                      {exp.position}
                    </p>
                  </div>
                  <span
                    className="text-gray-600"
                    style={{
                      fontSize: `${globalSettings?.baseFontSize || 14}px`
                    }}
                  >
                    {exp.date}
                  </span>
                </div>
                <p
                  className="text-gray-600"
                  style={{
                    fontSize: `${globalSettings?.baseFontSize || 14}px`,
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
        return renderProjects();
      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={previewRef}
      className={cn("flex-1 overflow-y-auto", "bg-gray-100")}
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
            "text-[#000]"
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
                  className={cn("font-bold", "text-gray-900")}
                  style={{
                    fontSize: `${(globalSettings?.headerSize || 24) * 1.5}px`
                  }}
                >
                  {basic.name}
                </motion.h1>
                <motion.h2
                  layout="position"
                  className={"text-gray-600"}
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
                    fontSize: `${globalSettings?.baseFontSize || 14}px`,
                    color: "rgb(75, 85, 99)"
                  }}
                >
                  {[
                    basic.email,
                    basic.phone,
                    basic.location,
                    basic.birthDate
                      ? new Date(basic.birthDate).toLocaleDateString()
                      : "",
                    ...(basic.customFields?.map((field) => field.value) || []) // 添加自定义字段的值
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
