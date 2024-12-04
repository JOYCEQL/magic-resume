"use client";
import React from "react";
import { Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import BasicPanel from "./basic/BasicPanel";
import EducationPanel from "./education/EducationPanel";
import ProjectPanel from "./project/ProjectPanel";
import ExperiencePanel from "./experience/ExperiencePanel";
import CustomPanel from "./custom/CustomPanel";
import SkillPanel from "./skills/SkillPanel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../ui/tooltip";

export function EditPanel() {
  const { activeSection, menuSections, updateMenuSections } = useResumeStore();

  const renderFields = () => {
    switch (activeSection) {
      case "basic":
        return <BasicPanel />;

      case "projects":
        return <ProjectPanel />;
      case "education":
        return <EducationPanel />;
      case "experience":
        return <ExperiencePanel />;
      case "skills":
        return <SkillPanel />;
      default:
        if (activeSection.startsWith("custom")) {
          return <CustomPanel sectionId={activeSection} />;
        } else {
          return <BasicPanel />;
        }
    }
  };

  return (
    <motion.div
      className={cn(
        "w-full  h-full border-r overflow-y-auto",
        "dark:bg-neutral-950 dark:border-neutral-800",
        "bg-gray-50 border-gray-100"
      )}
    >
      <div className="p-4">
        <motion.div
          className={cn(
            "mb-4 p-4 rounded-lg border",
            "dark:bg-neutral-900/50 dark:border-neutral-800",
            "bg-white border-gray-100"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {menuSections?.find((s) => s.id === activeSection)?.icon}
            </span>

            {/* 如果是基本信息的展示话展示div */}
            {activeSection === "basic" ? (
              <div>
                <span className="text-lg font-semibold text-primary">
                  {menuSections?.find((s) => s.id === activeSection)?.title}
                </span>
              </div>
            ) : (
              <>
                <input
                  className={cn(
                    "flex-1 text-lg  font-medium  text-primary border-black  bg-transparent outline-none   pb-1 text-primary"
                  )}
                  type="text"
                  value={
                    menuSections?.find((s) => s.id === activeSection)?.title
                  }
                  onChange={(e) => {
                    const newMenuSections = menuSections.map((s) => {
                      if (s.id === activeSection) {
                        return {
                          ...s,
                          title: e.target.value
                        };
                      }
                      return s;
                    });
                    updateMenuSections(newMenuSections);
                  }}
                />
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Pencil size={16} className="text-primary" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>点击文字部分即可聚焦编辑</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          className={cn(
            "rounded-lg",
            "dark:bg-neutral-900/50 dark:border-neutral-800",
            "bg-white border-gray-100"
          )}
        >
          {renderFields()}
        </motion.div>
      </div>
    </motion.div>
  );
}
