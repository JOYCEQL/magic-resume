"use client";
import { useResumeStore } from "@/store/useResumeStore";
import Field from "../Field";
import { cn } from "@/lib/utils";

const SkillPanel = () => {
  const { updateSkillContent, skillContent } = useResumeStore();

  const handleChange = (value: string) => {
    updateSkillContent(value);
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        "bg-white",
        "dark:bg-neutral-900/30",
        "border-gray-100 dark:border-neutral-800"
      )}
    >
      <Field
        value={skillContent}
        onChange={handleChange}
        type="editor"
        placeholder="描述你的技能、专长等..."
      />
    </div>
  );
};

export default SkillPanel;
