"use client";

import React, { useMemo } from "react";
import { useParams } from "@tanstack/react-router";
import { DEFAULT_TEMPLATES } from "../../config";
import { initialResumeState, initialResumeStateEn } from "../../config/initialResumeData";
import ResumeTemplateComponent from "../templates";
import { cn } from "../../lib/utils";
import { ResumeData } from "../../types/resume";
import { ResumeTemplate } from "../../types/template";

const IframeTemplateViewer = () => {
  const { id } = useParams({ from: "/app/preview-template/$id" });
  
  // Use cookie to determine locale
  const locale =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("NEXT_LOCALE="))
          ?.split("=")[1] || "zh"
      : "zh";

  const template = useMemo(() => {
    return DEFAULT_TEMPLATES.find((t: ResumeTemplate) => t.id === id) || DEFAULT_TEMPLATES[0];
  }, [id]);

  const mockData: ResumeData = useMemo(() => {
    const baseData = locale === "en" ? initialResumeStateEn : initialResumeState;
    return {
      ...baseData,
      id: "preview-mock-id",
      templateId: template.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      globalSettings: {
        ...baseData.globalSettings,
        themeColor: template.colorScheme.primary,
        sectionSpacing: template.spacing.sectionGap,
        paragraphSpacing: template.spacing.itemGap,
        pagePadding: template.spacing.contentPadding,
      },
      basic: {
        ...baseData.basic,
        layout: template.basic.layout,
      },
    } as ResumeData;
  }, [locale, template]);

  return (
    <div className="w-full h-full min-h-screen bg-white flex justify-center items-start overflow-hidden">
      <div
        className={cn(
          "w-[210mm] min-w-[210mm] min-h-[297mm]",
          "bg-white",
          "relative mx-auto origin-top-left"
        )}
        style={{
          fontFamily: "Alibaba PuHuiTi, sans-serif",
          padding: `${template.spacing.contentPadding}px`,
        }}
      >
        <ResumeTemplateComponent data={mockData} template={template} />
      </div>
    </div>
  );
};

export default IframeTemplateViewer;
