"use client";

import React from "react";
import { motion } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import BasicPanel from "./basic/BasicPanel";
import EducationPanel from "./education/EducationPanel";
import ProjectPanel from "./project/ProjectPanel";
import ExperiencePanel from "./experience/ExperiencePanel";
import CustomPanel from "./custom/CustomPanel";
import SkillPanel from "./skills/SkillPanel";

export function EditPanel() {
  const { theme, activeSection, menuSections, updateMenuSections } =
    useResumeStore();

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
        theme === "dark"
          ? "bg-neutral-950 border-neutral-800"
          : "bg-gray-50 border-gray-100"
      )}
    >
      <div className="p-4">
        <motion.div
          className={cn(
            "mb-4 p-4 rounded-lg border",
            theme === "dark"
              ? "bg-neutral-900/50 border-neutral-800"
              : "bg-white border-gray-100"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {menuSections?.find((s) => s.id === activeSection)?.icon}
            </span>
            <input
              className={cn(
                "flex-1 text-base  font-medium hover:border-indigo-600 hover:text-indigo-600 border-black  bg-transparent outline-none  border-b pb-1 text-gray-700",
                "dark:text-neutral-200 dark:border-white dark:hover:border-indigo-600 dark:hover:text-indigo-600"
              )}
              type="text"
              value={menuSections?.find((s) => s.id === activeSection)?.title}
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
          </div>
        </motion.div>

        <motion.div
          className={cn(
            "rounded-lg",
            theme === "dark"
              ? "bg-neutral-900/50 border-neutral-800"
              : "bg-white border-gray-100"
          )}
        >
          {renderFields()}
        </motion.div>
      </div>
    </motion.div>
  );
}
