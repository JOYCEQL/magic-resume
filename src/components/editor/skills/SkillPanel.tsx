import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import Field from "../Field";

const SkillPanel = () => {
  const { activeResume, updateSkillContent } = useResumeStore();
  const { skillContent } = activeResume || {};
  const handleChange = (value: string) => {
    updateSkillContent(value);
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        "bg-card",
        "border-border"
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
