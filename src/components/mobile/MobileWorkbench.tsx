
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Palette, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { EditPanel } from "@/components/editor/EditPanel";
import { SidePanel } from "@/components/editor/SidePanel";
import PreviewPanel from "@/components/preview";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type TabType = "content" | "style" | "preview";

export function MobileWorkbench() {
  const [activeTab, setActiveTab] = useState<TabType>("content");
  const { activeResume, setActiveSection } = useResumeStore();
  const { activeSection, menuSections } = activeResume || {};

  // 渲染底部导航项
  const renderNavItem = (tab: TabType, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "flex flex-col items-center justify-center py-2 px-4 flex-1 transition-colors",
        activeTab === tab
          ? "text-primary"
          : "text-muted-foreground hover:text-primary/80"
      )}
    >
      <div className={cn("mb-1", activeTab === tab && "scale-110 duration-200")}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
      {activeTab === tab && (
        <motion.div
          layoutId="mobile-nav-indicator"
          className="absolute bottom-0 w-12 h-1 bg-primary rounded-t-full"
        />
      )}
    </button>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === "content" && (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col"
            >
              {/* 顶部模块选择器 */}
              <div className="border-b bg-background/95 backdrop-blur z-10">
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex p-2 space-x-2">
                    {/* 基础信息 */}
                    <button
                      onClick={() => setActiveSection("basic")}
                      className={cn(
                        "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                        activeSection === "basic"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      <span className="mr-1.5">👤</span>
                      基本信息
                    </button>
                    
                    {/* 其他模块 */}
                    {menuSections
                      ?.filter((s) => s.id !== "basic" && s.enabled)
                      .map((section) => (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={cn(
                            "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                            activeSection === section.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:bg-muted"
                          )}
                        >
                          <span className="mr-1.5">{section.icon}</span>
                          {section.title}
                        </button>
                      ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
              </div>
              
              {/* 编辑区域 */}
              <div className="flex-1 overflow-hidden">
                <EditPanel />
              </div>
            </motion.div>
          )}

          {activeTab === "style" && (
            <motion.div
              key="style"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-hidden"
            >
              <SidePanel />
            </motion.div>
          )}

          {activeTab === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto bg-gray-100"
              data-preview-scroll-container="true"
            >
              <PreviewPanel
                sidePanelCollapsed={true}
                editPanelCollapsed={true}
                previewPanelCollapsed={false}
                toggleSidePanel={() => {}}
                toggleEditPanel={() => {}}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部导航栏 */}
      <div className="h-16 border-t bg-background flex items-center justify-around relative shadow-[0_-1px_3px_rgba(0,0,0,0.05)] z-50">
        {renderNavItem("content", <FileText className="w-5 h-5" />, "内容")}
        {renderNavItem("style", <Palette className="w-5 h-5" />, "样式")}
        {renderNavItem("preview", <Eye className="w-5 h-5" />, "预览")}
      </div>
    </div>
  );
}
