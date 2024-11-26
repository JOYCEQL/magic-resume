"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import { throttle } from "lodash";
import { THEME_COLORS } from "@/types/resume";
import { BaseInfo } from "./BaseInfo";
import { SectionTitle } from "./SectionTitle";
import { ProjectItem } from "./ProjectItem";
import { ExperienceSection } from "./ExperienceSection";
import { EducationSection } from "./EducationSection";
import { CustomSection } from "./CustomSection";
import { SkillSection } from "./SkillPanel";

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

const PageBreakLine = React.memo(({ pageNumber }: PageBreakLineProps) => {
  const { globalSettings } = useResumeStore();
  if (!globalSettings?.pagePadding) return;
  const A4_HEIGHT_MM = 297;
  const MM_TO_PX = 3.78;

  const TOP_MARGIN_MM = globalSettings?.pagePadding / MM_TO_PX;

  const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - TOP_MARGIN_MM;
  const pageHeight = CONTENT_HEIGHT_MM * MM_TO_PX;

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none page-break-line"
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
});

PageBreakLine.displayName = "PageBreakLine";

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
    colorTheme,
    customData,
    skillContent
  } = useResumeStore();

  const previewRef = React.useRef<HTMLDivElement>(null);
  const resumeContentRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollBehavior, setScrollBehavior] =
    React.useState<ScrollBehavior>("smooth");

  const fontFamilyClass = getFontFamilyClass(
    globalSettings?.fontFamily || "sans"
  );

  const currentThemeColor = useMemo(() => {
    return colorTheme || THEME_COLORS[0];
  }, [colorTheme]);

  useEffect(() => {
    const updateContentHeight = throttle(() => {
      if (resumeContentRef.current) {
        setContentHeight(resumeContentRef.current.scrollHeight);
      }
    }, 100);

    const resizeObserver = new ResizeObserver(updateContentHeight);
    if (resumeContentRef.current) {
      resizeObserver.observe(resumeContentRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      updateContentHeight.cancel();
    };
  }, []);

  const handleScroll = useCallback(
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
    <LayoutGroup>
      <motion.div
        layout
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
    </LayoutGroup>
  );

  const pageBreakCount = useMemo(() => {
    if (!globalSettings?.pagePadding) return;
    const A4_HEIGHT_MM = 297;
    const MM_TO_PX = 3.78;

    const TOP_MARGIN_MM = globalSettings?.pagePadding / MM_TO_PX;

    const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - TOP_MARGIN_MM;

    const pageHeightPx = CONTENT_HEIGHT_MM * MM_TO_PX;
    return Math.max(0, Math.ceil(contentHeight / pageHeightPx) - 1);
  }, [contentHeight, globalSettings?.pagePadding]);

  const renderSection = (sectionId: string) => {
    if (sectionId.startsWith("custom")) {
      const sectionConfig = menuSections.find((s) => s.id === sectionId);
      return (
        <CustomSection
          sectionId={sectionId}
          title={sectionConfig?.title || "自定义模块"}
          items={customData[sectionId] || []}
          globalSettings={globalSettings}
          themeColor={currentThemeColor}
        />
      );
    }

    switch (sectionId) {
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
      case "skills":
        return (
          <SkillSection
            skill={skillContent}
            globalSettings={globalSettings}
            themeColor={currentThemeColor}
          />
        );
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
            minHeight: "297mm"
          }}
        >
          <div
            className="relative"
            style={{
              padding: `${globalSettings?.pagePadding || 20}px`
            }}
            id="resume-preview"
          >
            <LayoutGroup>
              <motion.div layout ref={resumeContentRef}>
                <BaseInfo basic={basic} globalSettings={globalSettings} />
                {menuSections
                  .filter((section) => section.enabled)
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <motion.div key={section.id} layout>
                      {renderSection(section.id)}
                    </motion.div>
                  ))}
              </motion.div>
            </LayoutGroup>

            {Array.from({ length: pageBreakCount }, (_, i) => (
              <PageBreakLine key={i} pageNumber={i + 1} />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
