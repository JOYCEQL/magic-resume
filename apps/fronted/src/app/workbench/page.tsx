"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";
import { EditorHeader } from "@/components/editor/EditorHeader";
import { SidePanel } from "@/components/editor/SidePanel";
import { EditPanel } from "@/components/editor/EditPanel";
import { PreviewPanel } from "@/components/editor/PreviewPanel";
import { getThemeConfig } from "@/theme/themeConfig";
import { Eye, Edit2, Menu } from "lucide-react";

export default function Home() {
  const theme = useResumeStore((state) => state.theme);
  const previewRef = useRef<HTMLDivElement>(null);
  const themeConfig = getThemeConfig(theme === "dark");

  // 移动端状态管理
  const [showSidebar, setShowSidebar] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // 移动端切换按钮
  const MobileNav = () => (
    <div className={`fixed bottom-6 right-6 flex gap-2 md:hidden z-50`}>
      <motion.button
        className={`p-3 rounded-full ${themeConfig.buttonPrimary} text-white shadow-lg`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowSidebar(true)}
      >
        <Menu size={24} />
      </motion.button>
      <motion.button
        className={`p-3 rounded-full ${themeConfig.buttonPrimary} text-white shadow-lg`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsPreviewMode(!isPreviewMode)}
      >
        {isPreviewMode ? <Edit2 size={24} /> : <Eye size={24} />}
      </motion.button>
    </div>
  );

  // 移动端侧边栏
  const MobileSidebar = () => (
    <AnimatePresence>
      {showSidebar && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSidebar(false)}
          />
          <motion.div
            className="fixed top-0 left-0 h-full w-80 z-50 md:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 20 }}
          >
            <SidePanel onClose={() => setShowSidebar(false)} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <main
      className={`w-full h-screen ${themeConfig.bg} ${themeConfig.text} overflow-hidden`}
    >
      <EditorHeader previewRef={previewRef} isMobile={true} />

      {/* 桌面端布局 */}
      <div className="hidden md:flex h-[calc(100vh-4rem)]">
        <SidePanel />
        <EditPanel />
        <PreviewPanel />
      </div>

      {/* 移动端布局 */}
      <div className="md:hidden h-[calc(100vh-4rem)] overflow-hidden">
        <AnimatePresence mode="wait">
          {isPreviewMode ? (
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

      <MobileNav />
      <MobileSidebar />
    </main>
  );
}
