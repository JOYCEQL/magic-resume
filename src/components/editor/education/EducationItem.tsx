"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { Education } from "@/types/resume";
import {
  useDragControls,
  Reorder,
  motion,
  AnimatePresence,
} from "framer-motion";
import { GripVertical, Eye, EyeOff, ChevronDown, Trash2 } from "lucide-react";
import { useState, useCallback } from "react";
import Field from "../Field";
import ThemeModal from "@/components/shared/ThemeModal";
import { useTranslations } from "next-intl";

interface EducationEditorProps {
  education: Education;
  onSave: (education: Education) => void;
  onDelete: () => void;
  onCancel: () => void;
}

const EducationEditor: React.FC<EducationEditorProps> = ({
  education,
  onSave,
}) => {
  const t = useTranslations("workbench.educationItem");
  const handleChange = (field: keyof Education, value: string) => {
    onSave({
      ...education,
      [field]: value,
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label={t("labels.school")}
            value={education.school}
            onChange={(value) => handleChange("school", value)}
            placeholder={t("placeholders.school")}
            required
          />
          <Field
            label={t("labels.major")}
            value={education.major}
            onChange={(value) => handleChange("major", value)}
            placeholder={t("placeholders.major")}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label={t("labels.degree")}
            value={education.degree}
            onChange={(value) => handleChange("degree", value)}
            placeholder={t("placeholders.degree")}
            required
          />

          <Field
            label={t("labels.gpa")}
            value={education.gpa || ""}
            onChange={(value) => handleChange("gpa", value)}
            placeholder={t("placeholders.gpa")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label={t("labels.startDate")}
            value={education.startDate}
            onChange={(value) => handleChange("startDate", value)}
            type="date"
            placeholder="YYYY-MM"
            required
          />
          <Field
            label={t("labels.endDate")}
            value={education.endDate}
            onChange={(value) => handleChange("endDate", value)}
            type="date"
            placeholder="YYYY-MM"
            required
          />
        </div>

        <Field
          label={t("labels.description")}
          value={education.description}
          onChange={(value) => handleChange("description", value)}
          type="editor"
          placeholder={t("placeholders.description")}
        />
      </div>
    </div>
  );
};

const EducationItem = ({ education }: { education: Education }) => {
  const { updateEducation, deleteEducation } = useResumeStore();
  const dragControls = useDragControls();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleVisibilityToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isUpdating) return;

      setIsUpdating(true);
      setTimeout(() => {
        updateEducation({
          ...education,
          visible: !education.visible,
        });
        setIsUpdating(false);
      }, 10);
    },
    [education, updateEducation, isUpdating]
  );

  return (
    <Reorder.Item
      id={education.id}
      value={education}
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
          if (expandedId === education.id) return;
          dragControls.start(event);
        }}
        className={cn(
          "w-12 flex items-center justify-center border-r shrink-0 touch-none",
          "dark:border-neutral-800",
          "border-gray-100",
          expandedId === education.id
            ? "cursor-not-allowed"
            : "cursor-grab hover:bg-gray-50 dark:hover:bg-neutral-800/50"
        )}
      >
        <GripVertical
          className={cn(
            "w-4 h-4",
            "dark:text-neutral-400",
            "text-gray-400",
            expandedId === education.id && "opacity-50",
            "transform transition-transform group-hover:scale-110"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "px-4 py-4 flex items-center justify-between",
            expandedId === education.id && "dark:bg-neutral-800/50 ",
            "cursor-pointer select-none"
          )}
          onClick={(e) => {
            if (expandedId === education.id) {
              setExpandedId(null);
            } else {
              setExpandedId(education.id);
            }
          }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div>
                <h3
                  className={cn(
                    "font-medium truncate",
                    "dark:text-neutral-200",
                    "text-gray-700"
                  )}
                >
                  {education.school || "未填写学校"}
                </h3>
                {(education.major || education.degree) && (
                  <p
                    className={cn(
                      "text-sm truncate",
                      "dark:text-neutral-400",
                      "text-gray-500"
                    )}
                  >
                    {[education.major, education.degree]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              className={cn("text-sm")}
              onClick={handleVisibilityToggle}
            >
              {education.visible ? (
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
              title={education.school}
              onClose={() => setDeleteDialogOpen(false)}
              onConfirm={() => {
                deleteEducation(education.id);
                setExpandedId(null);
                setDeleteDialogOpen(false);
              }}
            />

            <motion.div
              initial={false}
              animate={{
                rotate: expandedId === education.id ? 180 : 0,
              }}
            >
              <ChevronDown
                className={cn("w-5 h-5", "text-gray-500 dark:text-neutral-400")}
              />
            </motion.div>
          </div>
        </div>
        <AnimatePresence>
          {expandedId === education.id && (
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
                <EducationEditor
                  education={education}
                  onSave={updateEducation}
                  onDelete={() => {
                    deleteEducation(education.id);
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

export default EducationItem;
