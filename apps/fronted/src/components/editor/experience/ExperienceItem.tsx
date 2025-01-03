"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  Reorder,
  useDragControls,
} from "framer-motion";
import { ChevronDown, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import Field from "../Field";
import { Experience } from "@/types/resume";
import ThemeModal from "@/components/shared/ThemeModal";
import { useResumeStore } from "@/store/useResumeStore";
import { useTranslations } from "next-intl";

interface ProjectEditorProps {
  experience: Experience;
  onSave: (experience: Experience) => void;
  onDelete: () => void;
  onCancel: () => void;
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({
  experience,
  onSave,
}) => {
  const t = useTranslations("workbench.experiencePanel");

  const handleChange = (field: keyof Experience, value: string) => {
    onSave({
      ...experience,
      [field]: value,
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label={t("placeholders.company")}
            value={experience.company}
            onChange={(value) => handleChange("company", value)}
            placeholder={t("placeholders.company")}
            required
          />
          <Field
            label={t("placeholders.position")}
            value={experience.position}
            onChange={(value) => handleChange("position", value)}
            placeholder={t("placeholders.position")}
            required
          />
        </div>
        <Field
          label={t("placeholders.date")}
          value={experience.date}
          onChange={(value) => handleChange("date", value)}
          placeholder={t("placeholders.date")}
          required
        />
        <Field
          label={t("placeholders.details")}
          value={experience.details}
          onChange={(value) => handleChange("details", value)}
          type="editor"
          placeholder={t("placeholders.details")}
        />
      </div>
    </div>
  );
};

const ExperienceItem = ({ experience }: { experience: Experience }) => {
  const dragControls = useDragControls();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { updateExperience, deleteExperience } = useResumeStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleVisibilityToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isUpdating) return;

      setIsUpdating(true);
      setTimeout(() => {
        updateExperience({
          ...experience,
          visible: !experience.visible,
        });
        setIsUpdating(false);
      }, 10);
    },
    [experience, updateExperience, isUpdating]
  );

  return (
    <Reorder.Item
      id={experience.id}
      value={experience}
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        "rounded-lg border overflow-hidden flex group",
        "bg-white hover:border-primary",
        "dark:bg-neutral-900/30",
        "border-gray-100 dark:border-neutral-800",
        "dark:hover:border-primary"
      )}
    >
      <div
        onPointerDown={(event) => {
          if (expandedId === experience.id) return;
          dragControls.start(event);
        }}
        className={cn(
          "w-12 flex items-center justify-center border-r shrink-0 touch-none",
          "border-gray-100 dark:border-neutral-800",
          expandedId === experience.id
            ? "cursor-not-allowed"
            : "cursor-grab hover:bg-gray-50 dark:hover:bg-neutral-800/50"
        )}
      >
        <GripVertical
          className={cn(
            "w-4 h-4",
            "text-gray-400 dark:text-neutral-400",
            expandedId === experience.id && "opacity-50",
            "transform transition-transform group-hover:scale-110"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "px-4 py-4 flex items-center justify-between",
            expandedId === experience.id && "bg-gray-50 dark:bg-neutral-800/50",
            "cursor-pointer select-none"
          )}
          onClick={(e) => {
            if (expandedId === experience.id) {
              setExpandedId(null);
            } else {
              setExpandedId(experience.id);
            }
          }}
        >
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-medium truncate",
                "text-gray-700 dark:text-neutral-200"
              )}
            >
              {experience.company || "家里蹲公司"}
            </h3>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              className={cn(
                "text-sm",
                experience.visible
                  ? "hover:bg-gray-100 text-gray-500 dark:hover:bg-neutral-800 dark:text-neutral-400"
                  : "hover:bg-gray-100 text-gray-400 dark:hover:bg-neutral-800 dark:text-neutral-600"
              )}
              onClick={handleVisibilityToggle}
            >
              {experience.visible ? (
                <Eye className="w-4 h-4 text-primary" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-sm",
                "dark:hover:bg-red-900/50 dark:text-red-400 hover:bg-red-50 text-red-600"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <ThemeModal
              isOpen={deleteDialogOpen}
              title={experience.company}
              onClose={() => setDeleteDialogOpen(false)}
              onConfirm={() => {
                deleteExperience(experience.id);
                setExpandedId(null);
                setDeleteDialogOpen(false);
              }}
            />

            <motion.div
              initial={false}
              animate={{
                rotate: expandedId === experience.id ? 180 : 0,
              }}
            >
              <ChevronDown
                className={cn("w-5 h-5", "text-gray-500 dark:text-neutral-400")}
              />
            </motion.div>
          </div>
        </div>
        <AnimatePresence>
          {expandedId === experience.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  "px-4 pb-4 space-y-4",
                  "border-gray-100 dark:border-neutral-800"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={cn(
                    "h-px w-full",
                    "bg-gray-100 dark:bg-neutral-800"
                  )}
                />
                <ProjectEditor
                  experience={experience}
                  onSave={updateExperience}
                  onDelete={() => {
                    deleteExperience(experience.id);
                    setExpandedId(null);
                  }}
                  onCancel={() => setExpandedId(null)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  );
};

export default ExperienceItem;
