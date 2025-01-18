"use client";

import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Edit2, Menu, PanelLeft, Minimize2 } from "lucide-react";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { SidePanel } from "@/components/editor/SidePanel";
import { EditPanel } from "@/components/editor/EditPanel";
import PreviewPanel from "@/components/preview";
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
          "dark:bg-neutral-700/50 bg-gray-200"
        )}
      />
      <div
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-4 h-8 rounded-full opacity-0 group-hover:opacity-100",
          "flex items-center justify-center",
          "dark:bg-neutral-800 bg-gray-200"
        )}
      >
        <div className="w-0.5 h-4 bg-gray-400 rounded-full" />
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
        "dark:bg-neutral-900/80 dark:border dark:border-neutral-800 bg-white/80 border border-gray-200",
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

      <div className={cn("h-5 w-px mx-1", "dark:bg-neutral-800 bg-gray-200")} />

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

export default function Home() {
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
  const [editPanelCollapsed, setEditPanelCollapsed] = useState(false);
  const [previewPanelCollapsed, setPreviewPanelCollapsed] = useState(false);
  const [panelSizes, setPanelSizes] = useState<number[]>(LAYOUT_CONFIG.DEFAULT);

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
    let newSizes = [];

    // 侧边栏尺寸
    newSizes.push(sidePanelCollapsed ? 0 : 20);

    // 编辑区尺寸
    if (editPanelCollapsed) {
      newSizes.push(0);
    } else {
      if (sidePanelCollapsed) {
        newSizes.push(50);
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
          newSizes.push(48);
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
        "bg-white text-gray-900",
        "dark:bg-neutral-900 dark:text-neutral-200"
      )}
    >
      <EditorHeader />
      {/* 桌面端布局 */}
      <div className="h-[calc(100vh-64px)]">
        <ResizablePanelGroup
          key={panelSizes?.join("-")}
          direction="horizontal"
          className={cn(
            "h-full",
            "border border-gray-200 bg-white",
            "dark:border-neutral-800 dark:bg-neutral-900/50"
          )}
        >
          {/* 侧边栏面板 */}
          {!sidePanelCollapsed && (
            <>
              <ResizablePanel
                id="side-panel"
                order={1}
                defaultSize={panelSizes?.[0]}
                minSize={20}
                className={cn(
                  "dark:bg-neutral-900 dark:border-r dark:border-neutral-800"
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
                minSize={32}
                defaultSize={panelSizes?.[1]}
                className={cn(
                  "dark:bg-neutral-900 dark:border-r dark:border-neutral-800"
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
              minSize={48}
              className="bg-gray-100"
            >
              <div className="h-full overflow-y-auto">
                <PreviewPanel
                  sidePanelCollapsed={sidePanelCollapsed}
                  editPanelCollapsed={editPanelCollapsed}
                  previewPanelCollapsed={previewPanelCollapsed}
                  toggleSidePanel={toggleSidePanel}
                  toggleEditPanel={toggleEditPanel}
                />
              </div>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>

      {/* 移动端布局 */}
      <div className="md:hidden h-[calc(100vh-64px)]">
        <AnimatePresence mode="wait">
          {previewPanelCollapsed ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ type: "spring", damping: 20 }}
              className="h-full"
            >
              <EditPanel />
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 20 }}
              className="h-full"
            >
              <PreviewPanel
                sidePanelCollapsed={sidePanelCollapsed}
                editPanelCollapsed={editPanelCollapsed}
                previewPanelCollapsed={previewPanelCollapsed}
                toggleSidePanel={toggleSidePanel}
                toggleEditPanel={toggleEditPanel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
