
import React, { useEffect, useMemo, useState, useRef } from "react";
import throttle from "lodash/throttle";
import { toast } from "sonner";
import { DEFAULT_TEMPLATES } from "@/config";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { useAutoOnePage } from "@/hooks/useAutoOnePage";
import { useTranslations } from "@/i18n/compat/client";
import ResumeTemplateComponent from "../templates";

interface PreviewPanelProps {
  sidePanelCollapsed: boolean;
  editPanelCollapsed: boolean;
  previewPanelCollapsed: boolean;
  toggleSidePanel: () => void;
  toggleEditPanel: () => void;
  togglePreviewPanel: () => void;
}

const PageBreakLine = React.memo(
  ({
    pageNumber,
    contentPerPagePx,
    pagePadding,
  }: {
    pageNumber: number;
    contentPerPagePx: number;
    pagePadding: number;
  }) => {
    // 预览中 #resume-preview 有 padding-top，内容从 pagePadding 位置开始
    // 每页能容纳 contentPerPagePx 高度的内容（与 Puppeteer PDF margin 一致）
    // 第 N 页结束位置 = pagePadding + N * contentPerPagePx
    const top = pagePadding + pageNumber * contentPerPagePx;

    return (
      <div
        className="absolute left-0 right-0 pointer-events-none page-break-line"
        style={{ top: `${top}px` }}
      >
        <div className="relative w-full">
          <div className="absolute w-full border-t-2 border-dashed border-red-400" />
          <div className="absolute right-0 -top-6 text-xs text-red-500">
            第{pageNumber}页结束
          </div>
        </div>
      </div>
    );
  }
);

PageBreakLine.displayName = "PageBreakLine";

const PreviewPanel = React.forwardRef<HTMLDivElement, PreviewPanelProps>(
  (
    {
      sidePanelCollapsed,
      editPanelCollapsed,
      previewPanelCollapsed,
      toggleSidePanel,
      toggleEditPanel,
      togglePreviewPanel,
    },
    ref
  ) => {
    const { activeResume } = useResumeStore();
    const t = useTranslations("previewDock");
    const template = useMemo(() => {
      return (
        DEFAULT_TEMPLATES.find((t) => t.id === activeResume?.templateId) ||
        DEFAULT_TEMPLATES[0]
      );
    }, [activeResume?.templateId]);

    const startRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const internalResumeContentRef = useRef<HTMLDivElement>(null);
    const resumeContentRef = (ref as React.MutableRefObject<HTMLDivElement>) || internalResumeContentRef;
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

    const pagePadding = activeResume?.globalSettings?.pagePadding || 0;
    const autoOnePageEnabled = activeResume?.globalSettings?.autoOnePage || false;

    const { scaleFactor, isScaled, cannotFit } = useAutoOnePage({
      contentHeight,
      pagePadding,
      enabled: autoOnePageEnabled,
    });

    useEffect(() => {
      if (cannotFit) {
        toast.warning(t("autoOnePage.cannotFit"), {
          duration: 4000,
        });
      }
    }, [cannotFit, t]);

    const { contentPerPagePx, pageBreakCount } = useMemo(() => {
      const MM_TO_PX = 3.78;
      const A4_HEIGHT_PX = 297 * MM_TO_PX;

      // 与 Puppeteer PDF 导出一致：margin: pagePadding px（上下各一份）
      // 每页可用内容高度 = A4 总高度 - 上 margin - 下 margin
      const baseContentPerPage = A4_HEIGHT_PX - 2 * pagePadding;

      // 一页纸模式启用且内容能完美一页时，才隐藏分页线
      // cannotFit 时内容仍超出一页，需要保留分页线
      if ((isScaled && !cannotFit) || contentHeight <= 0) {
        return { contentPerPagePx: baseContentPerPage, pageBreakCount: 0 };
      }

      // 缩放时，在容器本地坐标系下每页能容纳更多内容
      // 因为视觉上 effectiveContentPerPage * scaleFactor = baseContentPerPage
      const effectiveContentPerPage = isScaled
        ? baseContentPerPage / scaleFactor
        : baseContentPerPage;

      // contentHeight 包含 #resume-preview 的 padding（上+下）
      // 实际内容高度 = contentHeight - 2 * pagePadding
      const actualContentHeight = contentHeight - 2 * pagePadding;
      const pageCount = Math.max(1, Math.ceil(actualContentHeight / effectiveContentPerPage));
      const pageBreakCount = Math.max(0, pageCount - 1);

      return { contentPerPagePx: effectiveContentPerPage, pageBreakCount };
    }, [contentHeight, pagePadding, isScaled, cannotFit, scaleFactor]);

    if (!activeResume) return null;

    return (
      <div
        ref={previewRef}
        className="relative w-full h-full  bg-gray-100"
        style={{
          fontFamily: "Alibaba PuHuiTi, sans-serif",
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
                ...(isScaled
                  ? {
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: "top left",
                    width: `${100 / scaleFactor}%`,
                  }
                  : {}),
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

                        const pageLinePosition =
                          pagePadding + pageNumber * contentPerPagePx;

                        if (pageLinePosition <= contentHeight) {
                          return (
                            <PageBreakLine
                              key={`page-break-${pageNumber}`}
                              pageNumber={pageNumber}
                              contentPerPagePx={contentPerPagePx}
                              pagePadding={pagePadding}
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
      </div>
    );
  });

PreviewPanel.displayName = "PreviewPanel";

export default PreviewPanel;
