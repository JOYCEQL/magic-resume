"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Edit2, Menu, PanelLeft, Minimize2 } from "lucide-react";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { SidePanel } from "@/components/editor/SidePanel";
import { EditPanel } from "@/components/editor/EditPanel";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
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
  DEFAULT: [20, 35, 45],
  SIDE_COLLAPSED: [0, 50, 50],
  EDIT_FOCUSED_WITH_SIDE: [0, 100, 0],
  PREVIEW_FOCUSED_WITH_SIDE: [0, 0, 100],
  EDIT_FOCUSED_NO_SIDE: [0, 100, 0],
  PREVIEW_FOCUSED_NO_SIDE: [0, 0, 100],
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

export default function Home() {
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
  const [focusedPanel, setFocusedPanel] = useState<null | "edit" | "preview">(
    null
  );
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [panelSizes, setPanelSizes] = useState(LAYOUT_CONFIG.DEFAULT);
  const [layoutKey, setLayoutKey] = useState(0);

  const updateLayout = (newSizes: number[]) => {
    setPanelSizes(newSizes);
    setLayoutKey((prev) => prev + 1);
  };

  useEffect(() => {
    let newSizes;
    if (sidePanelCollapsed) {
      if (focusedPanel === "edit") {
        newSizes = [...LAYOUT_CONFIG.EDIT_FOCUSED_NO_SIDE];
      } else if (focusedPanel === "preview") {
        newSizes = [...LAYOUT_CONFIG.PREVIEW_FOCUSED_NO_SIDE];
      } else {
        newSizes = [...LAYOUT_CONFIG.SIDE_COLLAPSED];
      }
    } else {
      if (focusedPanel === "edit") {
        newSizes = [...LAYOUT_CONFIG.EDIT_FOCUSED_WITH_SIDE];
      } else if (focusedPanel === "preview") {
        newSizes = [...LAYOUT_CONFIG.PREVIEW_FOCUSED_WITH_SIDE];
      } else {
        newSizes = [...LAYOUT_CONFIG.DEFAULT];
      }
    }
    updateLayout([...newSizes]);
  }, [sidePanelCollapsed, focusedPanel]);

  const toggleSidePanel = () => {
    setSidePanelCollapsed(!sidePanelCollapsed);
  };

  const togglePanelFocus = (panel: "edit" | "preview") => {
    setFocusedPanel(focusedPanel === panel ? null : panel);
  };

  // 底部控制栏
  const LayoutControls = () => (
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
              variant={focusedPanel === "edit" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => togglePanelFocus("edit")}
            >
              {focusedPanel === "edit" ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Edit2 className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {focusedPanel === "edit" ? "退出编辑模式" : "专注编辑"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={focusedPanel === "preview" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => togglePanelFocus("preview")}
            >
              {focusedPanel === "preview" ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {focusedPanel === "preview" ? "退出预览模式" : "专注预览"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  // 移动端控制栏
  const MobileControls = () => (
    <div
      className={cn(
        "fixed bottom-6 right-6 flex gap-2 md:hidden z-50",
        "p-2 rounded-full",
        "dark:bg-neutral-900/80 dark:border dark:border-neutral-800 bg-white/80 border border-gray-200",
        "backdrop-blur-sm shadow-lg"
      )}
    >
      <motion.button
        className={cn(
          "p-3 rounded-full",
          "dark:hover:bg-neutral-800 hover:bg-gray-100"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMobileSidebar(true)}
      >
        <Menu className="h-5 w-5" />
      </motion.button>
      <motion.button
        className={cn(
          "p-3 rounded-full",
          "dark:hover:bg-neutral-800 hover:bg-gray-100"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMobilePreview(!isMobilePreview)}
      >
        {isMobilePreview ? (
          <Edit2 className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </motion.button>
    </div>
  );

  // 移动端侧边栏
  const MobileSidebar = () => (
    <AnimatePresence>
      {showMobileSidebar && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileSidebar(false)}
          />
          <motion.div
            className={cn(
              "fixed top-0 left-0 h-full w-80 z-50 md:hidden",
              "dark:bg-neutral-900 bg-white"
            )}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 20 }}
          >
            <SidePanel />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <main
      className={cn(
        "w-full h-screen overflow-hidden",
        "bg-white text-gray-900",
        "dark:bg-neutral-900 dark:text-neutral-200"
      )}
    >
      <EditorHeader />
      {/* 桌面端布局 */}
      <div className="hidden md:block h-[calc(100vh-64px)]">
        <ResizablePanelGroup
          key={layoutKey}
          direction="horizontal"
          className={cn(
            "h-full rounded-lg",
            "border border-gray-200 bg-white",
            "dark:border-neutral-800 dark:bg-neutral-900/50"
          )}
        >
          {/* 侧边栏面板 */}
          {!sidePanelCollapsed && (
            <>
              <ResizablePanel
                defaultSize={panelSizes[0]}
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
          <ResizablePanel
            defaultSize={panelSizes[1]}
            className={cn(
              "dark:bg-neutral-900 dark:border-r dark:border-neutral-800"
            )}
          >
            <div className="h-full">
              <EditPanel />
            </div>
          </ResizablePanel>
          <DragHandle />

          {/* 预览面板 */}
          <ResizablePanel defaultSize={panelSizes[2]} className="bg-gray-100">
            <div className="h-full overflow-y-auto">
              <PreviewPanel />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        <LayoutControls />
      </div>

      {/* 移动端布局 */}
      <div className="md:hidden h-[calc(100vh-64px)]">
        <AnimatePresence mode="wait">
          {isMobilePreview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 20 }}
              className="h-full"
            >
              <PreviewPanel />
            </motion.div>
          ) : (
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
          )}
        </AnimatePresence>
      </div>

      <MobileControls />
      <MobileSidebar />
    </main>
  );
}
