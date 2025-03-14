"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { throttle } from "lodash";
import { DEFAULT_TEMPLATES } from "@/config";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import ResumeTemplateComponent from "../templates";
import PreviewDock from "./PreviewDock";

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
  if (!globalSettings?.pagePadding) return null;

  const A4_HEIGHT_MM = 297;
  const MM_TO_PX = 3.78;

  const pagePaddingMM = globalSettings.pagePadding / MM_TO_PX;

  const CONTENT_HEIGHT_MM = A4_HEIGHT_MM + pagePaddingMM;
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
  const previewRef = useRef<HTMLDivElement>(null);
  const resumeContentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const updateContentHeight = () => {
    if (resumeContentRef.current) {
      const height = resumeContentRef.current.clientHeight;
      if (height > 0) {
        if (height !== contentHeight) {
          setContentHeight(height);
        }
      }
    }
  };

  useEffect(() => {
    const debouncedUpdate = throttle(() => {
      requestAnimationFrame(() => {
        updateContentHeight();
      });
    }, 100);

    const observer = new MutationObserver(debouncedUpdate);

    if (resumeContentRef.current) {
      observer.observe(resumeContentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      updateContentHeight();
    }

    const resizeObserver = new ResizeObserver(debouncedUpdate);

    if (resumeContentRef.current) {
      resizeObserver.observe(resumeContentRef.current);
    }

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (activeResume) {
      const timer = setTimeout(updateContentHeight, 300);
      return () => clearTimeout(timer);
    }
  }, [activeResume]);

  const { pageHeightPx, pageBreakCount } = useMemo(() => {
    const MM_TO_PX = 3.78;
    const A4_HEIGHT_MM = 297;

    let pagePaddingMM = 0;
    if (activeResume?.globalSettings?.pagePadding) {
      pagePaddingMM = activeResume.globalSettings.pagePadding / MM_TO_PX;
    }

    const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - pagePaddingMM;
    const pageHeightPx = CONTENT_HEIGHT_MM * MM_TO_PX;

    if (contentHeight <= 0) {
      return { pageHeightPx, pageBreakCount: 0 };
    }

    const pageCount = Math.max(1, Math.ceil(contentHeight / pageHeightPx));
    const pageBreakCount = Math.max(0, pageCount - 1);

    return { pageHeightPx, pageBreakCount };
  }, [contentHeight, activeResume?.globalSettings?.pagePadding]);

  if (!activeResume) return null;

  return (
    <div
      ref={previewRef}
      className="relative w-full h-full  bg-gray-100"
      style={{
        fontFamily: "MiSans VF, sans-serif",
      }}
    >
      <div className="py-4 ml-4 px-4 min-h-screen flex justify-center scale-[58%] origin-top md:scale-90 md:origin-top-left">
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
            {contentHeight > 0 && (
              <>
                <div key={`page-breaks-container-${contentHeight}`}>
                  {Array.from(
                    { length: Math.min(pageBreakCount, 20) },
                    (_, i) => {
                      const pageNumber = i + 1;

                      const pageLinePosition = pageHeightPx * pageNumber;

                      if (pageLinePosition <= contentHeight) {
                        return (
                          <PageBreakLine
                            key={`page-break-${pageNumber}`}
                            pageNumber={pageNumber}
                          />
                        );
                      }
                      return null;
                    }
                  ).filter(Boolean)}
                </div>
              </>
            )}
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
