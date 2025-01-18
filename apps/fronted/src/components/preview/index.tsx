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
  const CONTENT_HEIGHT_MM = A4_HEIGHT_MM;
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

  const updateContentHeight = () => {
    if (resumeContentRef.current) {
      const height = resumeContentRef.current.scrollHeight;
      if (height > 0) {
        setContentHeight(height);
      }
    }
  };

  useEffect(() => {
    const observer = new MutationObserver(updateContentHeight);
    if (resumeContentRef.current) {
      observer.observe(resumeContentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      updateContentHeight();
    }

    const resizeObserver = new ResizeObserver(
      throttle(updateContentHeight, 100)
    );
    if (resumeContentRef.current) {
      resizeObserver.observe(resumeContentRef.current);
    }

    const timeoutId = setTimeout(updateContentHeight, 100);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [activeResume]);

  const pageBreakCount = useMemo(() => {
    let TOP_MARGIN_MM;
    const MM_TO_PX = 3.78;
    const A4_HEIGHT_MM = 297;
    if (activeResume?.globalSettings?.pagePadding) {
      TOP_MARGIN_MM = activeResume.globalSettings.pagePadding / MM_TO_PX;
    } else {
      TOP_MARGIN_MM = 0;
    }
    const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - TOP_MARGIN_MM - TOP_MARGIN_MM;
    const pageHeightPx = CONTENT_HEIGHT_MM * MM_TO_PX;
    return Math.max(0, Math.ceil(contentHeight / pageHeightPx) - 1);
  }, [contentHeight, activeResume?.globalSettings?.pagePadding]);

  if (!activeResume) return null;

  return (
    <div ref={previewRef} className="relative w-full h-full  bg-gray-100">
      <div className="py-4 ml-4 px-4 min-h-screen flex justify-center scale-90 origin-top-left">
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
            className="relative"
          >
            <style jsx global>{`
              .grammar-error {
                cursor: help;
                border-bottom: 2px dashed;
                transition: background-color 0.2s ease;
              }

              .grammar-error.spelling {
                border-color: #ef4444;
              }

              .grammar-error.grammar {
                border-color: #f59e0b;
              }

              .grammar-error:hover {
                background-color: rgba(239, 68, 68, 0.1);
              }

              /* 使用属性选择器匹配所有active-*类 */
              .grammar-error[class*="active-"] {
                animation: highlight 2s ease-in-out;
              }

              @keyframes highlight {
                0% {
                  background-color: transparent;
                }
                20% {
                  background-color: rgba(239, 68, 68, 0.2);
                }
                80% {
                  background-color: rgba(239, 68, 68, 0.2);
                }
                100% {
                  background-color: transparent;
                }
              }
            `}</style>
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
        resumeContentRef={resumeContentRef}
      />
    </div>
  );
};

export default PreviewPanel;
