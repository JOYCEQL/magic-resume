"use client";
import { cn } from "@/lib/utils";
import { Reorder } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExperienceItem from "./ExperienceItem";
import { Experience } from "@/types/resume";
import { useResumeStore } from "@/store/useResumeStore";

const ExperiencePanel = () => {
  const { activeResume, updateExperience, updateExperienceBatch } =
    useResumeStore();
  const { experience = [] } = activeResume || {};
  const handleCreateProject = () => {
    const newProject: Experience = {
      id: crypto.randomUUID(),
      company: "某科技有限公司",
      position: "高级前端工程师",
      date: "2020-至今",
      details: "负责公司核心产品...",
      visible: true,
    };
    updateExperience(newProject);
  };

  return (
    <div
      className={cn(
        "space-y-4 px-4 py-4 rounded-lg",
        "bg-white dark:bg-neutral-900/30"
      )}
    >
      <Reorder.Group
        axis="y"
        values={experience}
        onReorder={(newOrder) => {
          updateExperienceBatch(newOrder);
        }}
        className="space-y-3"
      >
        {experience.map((item) => (
          <ExperienceItem key={item.id} experience={item}></ExperienceItem>
        ))}

        <Button onClick={handleCreateProject} className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" />
          添加
        </Button>
      </Reorder.Group>
    </div>
  );
};
export default ExperiencePanel;
