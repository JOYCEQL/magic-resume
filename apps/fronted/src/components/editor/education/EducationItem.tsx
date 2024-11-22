"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { Education } from "@/types/resume";
import {
  useDragControls,
  Reorder,
  motion,
  AnimatePresence
} from "framer-motion";
import { GripVertical, Eye, EyeOff, ChevronDown, Trash2 } from "lucide-react";
import { useState, useCallback } from "react";
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

interface EducationEditorProps {
  education: Education;
  onSave: (educaton: Education) => void;
  onDelete: () => void;
  onCancel: () => void;
}

interface DeleteConfirmDialogProps {
  schoolName: string;
  onDelete: () => void;
}

const EducationEditor: React.FC<EducationEditorProps> = ({
  education,
  onSave
}) => {
  const theme = useResumeStore((state) => state.theme);
  const [data, setData] = useState<Education>(education);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !data.school ||
      !data.major ||
      !data.degree ||
      !data.startDate ||
      !data.endDate
    )
      return;
    onSave(data);
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="学校名称"
            value={data.school}
            onChange={(value) =>
              setData((prev) => ({ ...prev, school: value }))
            }
            placeholder="学校名称"
            required
          />
          <Field
            label="所在地"
            value={data.location || ""}
            onChange={(value) =>
              setData((prev) => ({ ...prev, location: value }))
            }
            placeholder="城市"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="专业"
            value={data.major}
            onChange={(value) => setData((prev) => ({ ...prev, major: value }))}
            placeholder="专业名称"
            required
          />
          <Field
            label="学历"
            value={data.degree}
            onChange={(value) =>
              setData((prev) => ({ ...prev, degree: value }))
            }
            placeholder="学历"
            required
          />
        </div>

        {/* 时间和GPA */}
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="开始时间"
            value={data.startDate}
            onChange={(value) =>
              setData((prev) => ({ ...prev, startDate: value }))
            }
            type="date"
            placeholder="YYYY-MM"
            required
          />
          <Field
            label="结束时间"
            value={data.endDate}
            onChange={(value) =>
              setData((prev) => ({ ...prev, endDate: value }))
            }
            type="date"
            placeholder="YYYY-MM"
            required
          />
        </div>

        <Field
          label="GPA"
          value={data.gpa || ""}
          onChange={(value) => setData((prev) => ({ ...prev, gpa: value }))}
          placeholder="选填"
        />

        {/* 在校经历描述 */}
        <Field
          label="在校经历"
          value={data.description}
          onChange={(value) =>
            setData((prev) => ({ ...prev, description: value }))
          }
          type="editor"
          placeholder="描述你的在校表现、获奖经历等..."
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

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  schoolName,
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
            您确定要删除经历 {schoolName} 吗？此操作无法撤销。
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

const EducationItem = ({ education }: { education: Education }) => {
  const dragControls = useDragControls();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { theme, updateEducation, deleteEducation } = useResumeStore();

  const [isUpdating, setIsUpdating] = useState(false);

  const handleVisibilityToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isUpdating) return;

      setIsUpdating(true);
      setTimeout(() => {
        updateEducation({
          ...education,
          visible: !education.visible
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
        "bg-white hover:border-indigo-600",
        "dark:bg-neutral-900/30",
        "border-gray-100 dark:border-neutral-800",
        "dark:hover:border-indigo-600"
      )}
    >
      {/* 拖拽手柄区域 */}
      <div
        onPointerDown={(event) => {
          if (expandedId === education.id) return;
          dragControls.start(event);
        }}
        className={cn(
          "w-12 flex items-center justify-center border-r shrink-0 touch-none",
          theme === "dark" ? "border-neutral-800" : "border-gray-100",
          expandedId === education.id
            ? "cursor-not-allowed"
            : "cursor-grab hover:bg-gray-50 dark:hover:bg-neutral-800/50"
        )}
      >
        <GripVertical
          className={cn(
            "w-4 h-4",
            theme === "dark" ? "text-neutral-400" : "text-gray-400",
            expandedId === education.id && "opacity-50",
            "transform transition-transform group-hover:scale-110"
          )}
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "px-4 py-4 flex items-center justify-between",
            expandedId === education.id &&
              (theme === "dark" ? "bg-neutral-800/50" : "bg-gray-50"),
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
                    theme === "dark" ? "text-neutral-200" : "text-gray-700"
                  )}
                >
                  {education.school || "未填写学校"}
                </h3>
                {(education.major || education.degree) && (
                  <p
                    className={cn(
                      "text-sm truncate",
                      theme === "dark" ? "text-neutral-400" : "text-gray-500"
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
              className={cn(
                "text-sm",
                theme === "dark"
                  ? education.visible
                    ? "hover:bg-neutral-800 text-neutral-400"
                    : "hover:bg-neutral-800 text-neutral-600"
                  : education.visible
                    ? "hover:bg-gray-100 text-gray-500"
                    : "hover:bg-gray-100 text-gray-400"
              )}
              onClick={handleVisibilityToggle}
            >
              {education.visible ? (
                <Eye className="w-4 h-4 text-indigo-600" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <DeleteConfirmDialog
              schoolName={education.school}
              onDelete={() => {
                deleteEducation(education.id);
                setExpandedId(null);
              }}
            />
            <motion.div
              initial={false}
              animate={{
                rotate: expandedId === education.id ? 180 : 0
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
                <EducationEditor
                  education={education}
                  onSave={(updatedEducation) => {
                    updateEducation(updatedEducation);
                    setExpandedId(null);
                  }}
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
