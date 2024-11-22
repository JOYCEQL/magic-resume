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

export function EditPanel() {
  const { theme, activeSection, menuSections } = useResumeStore();

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
        return null;
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
            <h1
              className={cn(
                "text-base font-medium",
                theme === "dark" ? "text-neutral-200" : "text-gray-700"
              )}
            >
              {menuSections?.find((s) => s.id === activeSection)?.title}
            </h1>
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
