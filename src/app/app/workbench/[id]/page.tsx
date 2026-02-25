
import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Edit2, Menu, PanelLeft, Minimize2 } from "lucide-react";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { SidePanel } from "@/components/editor/SidePanel";
import { EditPanel } from "@/components/editor/EditPanel";
import PreviewPanel from "@/components/preview";
import PreviewDock from "@/components/preview/PreviewDock";
import { MobileWorkbench } from "@/components/mobile/MobileWorkbench";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LAYOUT_CONFIG = {
  DEFAULT: [20, 32, 48],
  SIDE_COLLAPSED: [50, 50],
  EDIT_FOCUSED: [20, 80],
  PREVIEW_FOCUSED: [20, 80],
};

const DragHandle = ({ show = true }) => {
  if (!show) return null;

  return (
    <ResizableHandle className="relative w-1.5 group">
      <div
        className={cn(
          "absolute inset-y-0 left-1/2 w-1 -translate-x-1/2",
          "group-hover:bg-primary/20 group-data-[dragging=true]:bg-primary",
          "bg-border"
        )}
      />
      <div
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-4 h-8 rounded-full opacity-0 group-hover:opacity-100",
          "flex items-center justify-center",
          "bg-background border border-border"
        )}
      >
        <div className="w-0.5 h-4 bg-muted-foreground/50 rounded-full" />
      </div>
    </ResizableHandle>
  );
};

const LayoutControls = memo(
  ({
    sidePanelCollapsed,
    editPanelCollapsed,
    previewPanelCollapsed,
    toggleSidePanel,
    toggleEditPanel,
    togglePreviewPanel,
  }: {
    sidePanelCollapsed: boolean;
    editPanelCollapsed: boolean;
    previewPanelCollapsed: boolean;
    toggleSidePanel: () => void;
    toggleEditPanel: () => void;
    togglePreviewPanel: () => void;
  }) => (
    <div
      className={cn(
        "absolute bottom-6 left-1/2 -translate-x-1/2",
        "flex items-center gap-2 z-10 p-2 rounded-full",
        "flex items-center gap-2 z-10 p-2 rounded-full",
        "bg-background/80 border border-border",
        "backdrop-blur-sm shadow-lg"
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={sidePanelCollapsed ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={toggleSidePanel}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {sidePanelCollapsed ? "展开侧边栏" : "收起侧边栏"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className={cn("h-5 w-px mx-1", "bg-border")} />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={editPanelCollapsed ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={toggleEditPanel}
            >
              {editPanelCollapsed ? (
                <Edit2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {editPanelCollapsed ? "展开编辑面板" : "收起编辑面板"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={previewPanelCollapsed ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={togglePreviewPanel}
            >
              {previewPanelCollapsed ? (
                <Eye className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {previewPanelCollapsed ? "展开预览面板" : "收起预览面板"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
);

LayoutControls.displayName = "LayoutControls";

export const runtime = "edge";

export default function Home() {
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
  const [editPanelCollapsed, setEditPanelCollapsed] = useState(false);
  const [previewPanelCollapsed, setPreviewPanelCollapsed] = useState(false);
  const [panelSizes, setPanelSizes] = useState<number[]>(LAYOUT_CONFIG.DEFAULT);
  
  // Create a ref for the resume content that PreviewDock can access
  // Currently we can't get the inner ref easily across component boundaries
  // But we need to pass a mock or implement forwardRef in PreviewPanel later
  // For now we pass null to satisfy the prop requirement
  const resumeContentRef = React.useRef<HTMLDivElement>(null);

  const toggleSidePanel = () => {
    setSidePanelCollapsed(!sidePanelCollapsed);
  };

  const toggleEditPanel = () => {
    setEditPanelCollapsed(!editPanelCollapsed);
  };

  const togglePreviewPanel = () => {
    setPreviewPanelCollapsed(!previewPanelCollapsed);
  };

  const updateLayout = (sizes: number[]) => {
    setPanelSizes(sizes);
  };

  useEffect(() => {
    // 如果预览面板已经收起，则不需要自动收起侧边栏，因为空间足够
    if (previewPanelCollapsed) return;

    // 初始化检查屏幕宽度
    if (window.innerWidth < 1440) {
      setSidePanelCollapsed(true);
    }
    
    // 监听 resize
    const handleResize = () => {
      // 屏幕改变时，如果此时预览面板收起，也可以让侧边栏展开
      if (previewPanelCollapsed) return;

      if (window.innerWidth < 1440) {
        setSidePanelCollapsed(true);
      } else {
        setSidePanelCollapsed(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [previewPanelCollapsed]);

  useEffect(() => {
    document.body.classList.add("workbench-body-lock");
    return () => {
      document.body.classList.remove("workbench-body-lock");
    };
  }, []);

  useEffect(() => {
    let newSizes = [];

    // 侧边栏尺寸
    newSizes.push(sidePanelCollapsed ? 0 : 20);

    // 编辑区尺寸
    if (editPanelCollapsed) {
      newSizes.push(0);
    } else {
      if (sidePanelCollapsed) {
        newSizes.push(36);
      } else {
        if (previewPanelCollapsed) {
          newSizes.push(80);
        } else {
          newSizes.push(32);
        }
      }
    }

    // 预览区尺寸
    if (previewPanelCollapsed) {
      newSizes.push(0);
    } else {
      if (editPanelCollapsed && sidePanelCollapsed) {
        newSizes.push(100);
      } else {
        if (editPanelCollapsed) {
          newSizes.push(80);
        } else {
          // 如果侧边栏收起且编辑区展开，预览区占64，编辑区占36
          if (sidePanelCollapsed) {
             newSizes.push(64);
          } else {
             newSizes.push(48);
          }
        }
      }
    }

    // 确保总和为 100
    const total = newSizes.reduce((a, b) => a + b, 0);
    if (total < 100) {
      const lastNonZeroIndex = newSizes
        .map((size, index) => ({ size, index }))
        .filter(({ size }) => size > 0)
        .pop()?.index;

      if (lastNonZeroIndex !== undefined) {
        newSizes[lastNonZeroIndex] += 100 - total;
      }
    }
    updateLayout([...newSizes]);
  }, [sidePanelCollapsed, editPanelCollapsed, previewPanelCollapsed]);

  return (
    <main
      className={cn(
        "w-full min-h-screen  overflow-hidden",
        "w-full min-h-screen overflow-hidden",
        "bg-background text-foreground"
      )}
    >
      <EditorHeader />
      {/* 桌面端布局 */}
      <div className="hidden md:block h-[calc(100vh-64px)] relative flex w-full">
        <div className={cn(
          "h-full transition-all duration-300",
          previewPanelCollapsed ? "w-[calc(100%-4rem)]" : "w-full"
        )}>
          <ResizablePanelGroup
          key={panelSizes?.join("-")}
          direction="horizontal"
          className={cn(
            "h-full",
            "h-full",
            "border border-border bg-background"
          )}
        >
          {/* 侧边栏面板 */}
          {!sidePanelCollapsed && (
            <>
              <ResizablePanel
                id="side-panel"
                order={1}
                defaultSize={panelSizes?.[0]}
                className={cn(
                  "bg-background border-r border-border"
                )}
              >
                <div className="h-full overflow-y-auto">
                  <SidePanel />
                </div>
              </ResizablePanel>
              <DragHandle />
            </>
          )}

          {/* 编辑面板 */}
          {!editPanelCollapsed && (
            <>
              <ResizablePanel
                id="edit-panel"
                order={2}
                defaultSize={panelSizes?.[1]}
                className={cn(
                  "bg-background border-r border-border"
                )}
              >
                <div className="h-full">
                  <EditPanel />
                </div>
              </ResizablePanel>
              <DragHandle />
            </>
          )}
          {/* 预览面板 */}
          {!previewPanelCollapsed && (
            <ResizablePanel
              id="preview-panel"
              order={3}
              collapsible={false}
              defaultSize={panelSizes?.[2]}
              className="bg-gray-100"
            >
              <div
                className="h-full overflow-y-auto"
                data-preview-scroll-container="true"
              >
                <PreviewPanel
                  sidePanelCollapsed={sidePanelCollapsed}
                  editPanelCollapsed={editPanelCollapsed}
                  previewPanelCollapsed={previewPanelCollapsed}
                  toggleSidePanel={toggleSidePanel}
                  toggleEditPanel={toggleEditPanel}
                  togglePreviewPanel={togglePreviewPanel}
                />
              </div>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
        </div>
        
        <PreviewDock
          sidePanelCollapsed={sidePanelCollapsed}
          editPanelCollapsed={editPanelCollapsed}
          previewPanelCollapsed={previewPanelCollapsed}
          toggleSidePanel={toggleSidePanel}
          toggleEditPanel={toggleEditPanel}
          togglePreviewPanel={togglePreviewPanel}
          resumeContentRef={resumeContentRef}
        />
      </div>

      {/* 移动端布局 */}
      <div className="md:hidden h-[calc(100vh-64px)]">
        <MobileWorkbench />
      </div>
    </main>
  );
}
