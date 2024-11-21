"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import {
  AnimatePresence,
  motion,
  Reorder,
  useDragControls
} from "framer-motion";
import { ChevronDown, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import Field from "../Field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Experience } from "@/types/resume";

interface ProjectEditorProps {
  experience: Experience;
  onSave: (experience: Experience) => void;
  onDelete: () => void;
  onCancel: () => void;
}

interface DeleteConfirmDialogProps {
  projectName: string;
  onDelete: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  projectName,
  onDelete
}) => {
  const theme = useResumeStore((state) => state.theme);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "text-sm",
            theme === "dark"
              ? "hover:bg-red-900/50 text-red-400"
              : "hover:bg-red-50 text-red-600"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className={cn(
          theme === "dark" ? "bg-neutral-900 border-neutral-800" : "bg-white"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle
            className={cn(
              theme === "dark" ? "text-neutral-200" : "text-gray-900"
            )}
          >
            确认删除经历
          </AlertDialogTitle>
          <AlertDialogDescription
            className={cn(
              theme === "dark" ? "text-neutral-400" : "text-gray-500"
            )}
          >
            您确定要删除经历 {projectName} 吗？此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className={cn(
              theme === "dark"
                ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700"
                : ""
            )}
          >
            取消
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: { preventDefault: () => void }) => {
              e.preventDefault();
              onDelete();
            }}
            className={cn(
              theme === "dark"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            )}
          >
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const ProjectEditor: React.FC<ProjectEditorProps> = ({
  experience,
  onSave
}) => {
  const theme = useResumeStore((state) => state.theme);
  const [data, setData] = useState<Experience>(experience);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.company || !data.position || !data.date) return;
    onSave(data);
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="公司名称"
            value={data.company}
            onChange={(value) =>
              setData((prev) => ({ ...prev, company: value }))
            }
            placeholder="项目名称"
            required
          />
          <Field
            label="岗位"
            value={data.position}
            onChange={(value) =>
              setData((prev) => ({ ...prev, position: value }))
            }
            placeholder="如：前端工程师"
            required
          />
        </div>
        <Field
          label="开始时间-结束时间"
          value={data.date}
          onChange={(value) => setData((prev) => ({ ...prev, date: value }))}
          placeholder="如：2023.01 - 2023.06"
          required
        />
        <Field
          label="主要职责"
          value={data.details}
          onChange={(value) => setData((prev) => ({ ...prev, details: value }))}
          type="editor"
          placeholder="简要描述项目的背景和目标..."
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="submit"
          size="sm"
          className={cn(
            theme === "dark"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-black hover:bg-neutral-800 text-white"
          )}
        >
          保存修改
        </Button>
      </div>
    </form>
  );
};

const ExperienceItem = ({ experience }: { experience: Experience }) => {
  const dragControls = useDragControls();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { theme, updateExperience, deleteExperience } = useResumeStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleVisibilityToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isUpdating) return;

      setIsUpdating(true);
      setTimeout(() => {
        updateExperience({
          ...experience,
          visible: !experience.visible
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
      onDragEnd={() => {
        useResumeStore.getState().setDraggingProjectId(null);
      }}
      className={cn(
        "rounded-lg border overflow-hidden flex group",
        theme === "dark"
          ? "bg-neutral-900/30 border-neutral-800"
          : "bg-white border-gray-100"
      )}
    >
      {/* 拖拽手柄区域 */}
      <div
        onPointerDown={(event) => {
          if (expandedId === experience.id) return;
          dragControls.start(event);
          useResumeStore.getState().setDraggingProjectId(experience.id);
        }}
        onPointerUp={() => {
          useResumeStore.getState().setDraggingProjectId(null);
        }}
        onPointerCancel={() => {
          useResumeStore.getState().setDraggingProjectId(null);
        }}
        className={cn(
          "w-12 flex items-center justify-center border-r shrink-0 touch-none",
          theme === "dark" ? "border-neutral-800" : "border-gray-100",
          expandedId === experience.id
            ? "cursor-not-allowed"
            : "cursor-grab hover:bg-gray-50 dark:hover:bg-neutral-800/50"
        )}
      >
        <GripVertical
          className={cn(
            "w-4 h-4",
            theme === "dark" ? "text-neutral-400" : "text-gray-400",
            expandedId === experience.id && "opacity-50",
            "transform transition-transform group-hover:scale-110"
          )}
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "px-4 py-4 flex items-center justify-between",
            expandedId === experience.id &&
              (theme === "dark" ? "bg-neutral-800/50" : "bg-gray-50"),
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
                theme === "dark" ? "text-neutral-200" : "text-gray-700"
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
                theme === "dark"
                  ? experience.visible
                    ? "hover:bg-neutral-800 text-neutral-400"
                    : "hover:bg-neutral-800 text-neutral-600"
                  : experience.visible
                    ? "hover:bg-gray-100 text-gray-500"
                    : "hover:bg-gray-100 text-gray-400"
              )}
              onClick={handleVisibilityToggle}
            >
              {experience.visible ? (
                <Eye className="w-4 h-4 text-indigo-600" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <DeleteConfirmDialog
              projectName={experience.company}
              onDelete={() => {
                deleteExperience(experience.id);
                setExpandedId(null);
              }}
            />
            <motion.div
              initial={false}
              animate={{
                rotate: expandedId === experience.id ? 180 : 0
              }}
            >
              <ChevronDown
                className={cn(
                  "w-5 h-5",
                  theme === "dark" ? "text-neutral-400" : "text-gray-500"
                )}
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
                  theme === "dark" ? "border-neutral-800" : "border-gray-100"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={cn(
                    "h-px w-full",
                    theme === "dark" ? "bg-neutral-800" : "bg-gray-100"
                  )}
                />
                <ProjectEditor
                  experience={experience}
                  onSave={(updatedData) => {
                    updateExperience(updatedData);
                    setExpandedId(null);
                  }}
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
