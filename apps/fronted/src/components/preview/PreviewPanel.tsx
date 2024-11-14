"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import { throttle } from "lodash";
import { THEME_COLORS } from "@/types/resume";
import { ResumeHeader } from "./BaseInfo";
import { SectionTitle } from "./SectionTitle";
import { ProjectItem } from "./ProjectItem";
import { ExperienceSection } from "./ExperienceSection";
import { EducationSection } from "./EducationSection";

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

interface PageBreakLineProps {
  pageNumber: number;
}

const PageBreakLine = ({ pageNumber }: PageBreakLineProps) => {
  const A4_HEIGHT_MM = 297;
  const TOP_MARGIN_MM = 4;
  const BOTTOM_MARGIN_MM = 4;
  const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - TOP_MARGIN_MM - BOTTOM_MARGIN_MM;
  const MM_TO_PX = 3.78;
  const SCALE_FACTOR = 2; // 考虑导出时的 scale: 2 设置

  const pageHeight = CONTENT_HEIGHT_MM * MM_TO_PX;

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none  page-break-line"
      style={{
        top: `${pageHeight * pageNumber}px`,
        breakAfter: "page",
        breakBefore: "page"
      }}
    >
      <div className="relative w-full">
        <div className="absolute w-full border-t-2 border-dashed border-red-400" />
        <div className="absolute right-0 -top-6 text-xs text-red-500">
          第{pageNumber}页结束
        </div>
      </div>
    </div>
  );
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
  const resumeContentRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollBehavior, setScrollBehavior] =
    React.useState<ScrollBehavior>("smooth");

  const fontFamilyClass = getFontFamilyClass(
    globalSettings?.fontFamily || "sans"
  );

  // 获取当前主题色
  const currentThemeColor = useMemo(() => {
    return colorTheme || THEME_COLORS[0];
  }, [colorTheme]);

  // 监测内容高度变化
  useEffect(() => {
    const updateContentHeight = () => {
      if (resumeContentRef.current) {
        setContentHeight(resumeContentRef.current.scrollHeight);
      }
    };

    updateContentHeight();

    const resizeObserver = new ResizeObserver(updateContentHeight);
    if (resumeContentRef.current) {
      resizeObserver.observe(resumeContentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
      <SectionTitle
        title="项目经历"
        themeColor={currentThemeColor}
        globalSettings={globalSettings}
      />
      <AnimatePresence mode="popLayout" initial={false}>
        {projects
          .filter((project) => project.visible)
          .map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              draggingProjectId={draggingProjectId}
              globalSettings={globalSettings}
            />
          ))}
      </AnimatePresence>
    </motion.div>
  );

  const pageBreakCount = useMemo(() => {
    const A4_HEIGHT_MM = 297;
    const TOP_MARGIN_MM = 4;
    const BOTTOM_MARGIN_MM = 4;
    const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - TOP_MARGIN_MM - BOTTOM_MARGIN_MM;
    const MM_TO_PX = 3.78;

    const pageHeightPx = CONTENT_HEIGHT_MM * MM_TO_PX;
    return Math.max(0, Math.ceil(contentHeight / pageHeightPx) - 1);
  }, [contentHeight]);

  const renderBasicInfo = () => (
    <motion.div layout className="space-y-2">
      <SectionTitle
        title="个人简介"
        themeColor={currentThemeColor}
        globalSettings={globalSettings}
      />
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

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "basic":
        return renderBasicInfo();
      case "education":
        return (
          <EducationSection
            education={education}
            globalSettings={globalSettings}
            themeColor={currentThemeColor}
          />
        );
      case "experience":
        return (
          <ExperienceSection
            experience={experience}
            globalSettings={globalSettings}
            themeColor={currentThemeColor}
          />
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
      className={cn("flex-1 overflow-y-auto")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="py-4 px-4 min-h-screen flex justify-center">
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
          style={{
            // 设置与 html2pdf 配置一致的尺寸
            minHeight: "297mm"
          }}
        >
          <div
            className="relative"
            style={{
              padding: "4mm"
            }}
            id="resume-preview"
          >
            <motion.div layout className="space-y-8" ref={resumeContentRef}>
              {/* Header */}
              <ResumeHeader basic={basic} globalSettings={globalSettings} />

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

            {/* 动态分页指示线 */}
            {Array.from({ length: pageBreakCount }, (_, i) => (
              <PageBreakLine key={i} pageNumber={i + 1} />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
