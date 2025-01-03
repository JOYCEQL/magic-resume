"use client";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { Reorder } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import EducationItem from "./EducationItem";
import { Education } from "@/types/resume";

const EducationPanel = () => {
  const t = useTranslations('workbench.educationPanel');
  const { activeResume, updateEducation, updateEducationBatch } =
    useResumeStore();
  const { education = [] } = activeResume || {};
  const handleCreateProject = () => {
    const newEducation: Education = {
      id: crypto.randomUUID(),
      school: t('defaultProject.school'),
      major: t('defaultProject.major'),
      degree: t('defaultProject.degree'),
      startDate: "2015-09-01",
      endDate: "2019-06-30",
      description: "",
      visible: true,
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
          updateEducationBatch(newOrder);
        }}
        className="space-y-3"
      >
        {(education || []).map((education) => (
          <EducationItem
            key={education.id}
            education={education}
          ></EducationItem>
        ))}

        <Button onClick={handleCreateProject} className="w-full">
          <PlusCircle className="w-4 h-4 mr-2" />
          {t('addButton')}
        </Button>
      </Reorder.Group>
    </div>
  );
};

export default EducationPanel;
