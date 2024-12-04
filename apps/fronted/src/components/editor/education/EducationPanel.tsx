"use client";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { Reorder } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import EducationItem from "./EducationItem";
import { Education, Project } from "@/types/resume";

const ProjectPanel = () => {
  const { education = [], updateEducation } = useResumeStore();

  const handleCreateProject = () => {
    const newEducation: Education = {
      id: crypto.randomUUID(),
      school: "家里蹲大学",
      major: "",
      degree: "",
      startDate: "2015-09-01",
      endDate: "2019-06-30",
      description: "",
      visible: true
    };
    updateEducation(newEducation);
  };

  return (
    <div
      className={cn(
        "space-y-4 px-4 py-4 rounded-lg",
        "dark:bg-neutral-900/30",
        "bg-white"
      )}
    >
      <Reorder.Group
        axis="y"
        values={education}
        onReorder={(newOrder) => {
          useResumeStore.setState({ education: newOrder });
        }}
        className="space-y-3"
      >
        {education.map((education) => (
          <EducationItem
            key={education.id}
            education={education}
          ></EducationItem>
        ))}

        <Button onClick={handleCreateProject} className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" />
          添加
        </Button>
      </Reorder.Group>
    </div>
  );
};
export default ProjectPanel;
