"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { throttle } from "lodash";
import { DEFAULT_TEMPLATES } from "@/config";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import ResumeTemplateComponent from "../templates";
import { PreviewDock } from "./PreviewDock";

interface PreviewPanelProps {
  sidePanelCollapsed: boolean;
  editPanelCollapsed: boolean;
  previewPanelCollapsed: boolean;
  toggleSidePanel: () => void;
  toggleEditPanel: () => void;
}

const PageBreakLine = React.memo(({ pageNumber }: { pageNumber: number }) => {
  const { activeResume } = useResumeStore();
  const { globalSettings } = activeResume || {};
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
        breakBefore: "page",
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

const PreviewPanel = ({
  sidePanelCollapsed,
  editPanelCollapsed,
  toggleSidePanel,
  toggleEditPanel,
}: PreviewPanelProps) => {
  const { activeResume } = useResumeStore();
  const template = useMemo(() => {
    return (
      DEFAULT_TEMPLATES.find((t) => t.id === activeResume?.templateId) ||
      DEFAULT_TEMPLATES[0]
    );
  }, [activeResume?.templateId]);

  const startRef = useRef<HTMLDivElement>(null);

  const previewRef = React.useRef<HTMLDivElement>(null);
  const resumeContentRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

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

  const pageBreakCount = useMemo(() => {
    if (!activeResume?.globalSettings?.pagePadding) return 0;
    const A4_HEIGHT_MM = 297;
    const MM_TO_PX = 3.78;
    const TOP_MARGIN_MM = activeResume.globalSettings.pagePadding / MM_TO_PX;
    const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - TOP_MARGIN_MM;
    const pageHeightPx = CONTENT_HEIGHT_MM * MM_TO_PX;
    return Math.max(0, Math.ceil(contentHeight / pageHeightPx) - 1);
  }, [contentHeight, activeResume?.globalSettings?.pagePadding]);

  if (!activeResume) return null;

  return (
    <div
      ref={previewRef}
      className="relative w-full h-full overflow-auto bg-gray-100"
    >
      <div className="py-4 ml-4  px-4 min-h-screen flex justify-center scale-90 origin-top-left">
        <div
          ref={startRef}
          className={cn(
            "w-[210mm] min-w-[210mm] min-h-[297mm]",
            "bg-white",
            "shadow-lg",
            "relative mx-auto"
          )}
        >
          <div
            ref={resumeContentRef}
            id="resume-preview"
            style={{
              padding: `${activeResume.globalSettings?.pagePadding}px`,
            }}
          >
            <ResumeTemplateComponent data={activeResume} template={template} />
            {Array.from({ length: pageBreakCount }, (_, i) => (
              <PageBreakLine key={i} pageNumber={i + 1} />
            ))}
          </div>
        </div>
      </div>

      <PreviewDock
        sidePanelCollapsed={sidePanelCollapsed}
        editPanelCollapsed={editPanelCollapsed}
        toggleSidePanel={toggleSidePanel}
        toggleEditPanel={toggleEditPanel}
      />
    </div>
  );
};

export default PreviewPanel;
