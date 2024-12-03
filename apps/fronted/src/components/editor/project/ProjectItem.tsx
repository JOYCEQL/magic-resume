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

interface Project {
  id: string;
  name: string;
  role: string;
  date: string;
  description: string;
  visible: boolean;
}

interface ProjectEditorProps {
  project: Project;
  onSave: (project: Project) => void;
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
            确认删除项目
          </AlertDialogTitle>
          <AlertDialogDescription
            className={cn(
              theme === "dark" ? "text-neutral-400" : "text-gray-500"
            )}
          >
            您确定要删除项目 {projectName} 吗？此操作无法撤销。
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

const ProjectEditor: React.FC<ProjectEditorProps> = ({ project, onSave }) => {
  const handleChange = (field: keyof Project, value: string) => {
    onSave({
      ...project,
      [field]: value
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="项目名称"
            value={project.name}
            onChange={(value) => handleChange("name", value)}
            placeholder="项目名称"
            required
          />
          <Field
            label="担任角色"
            value={project.role}
            onChange={(value) => handleChange("role", value)}
            placeholder="如：前端负责人"
            required
          />
        </div>
        <Field
          label="项目时间"
          value={project.date}
          onChange={(value) => handleChange("date", value)}
          placeholder="如：2023.01 - 2023.06"
          required
        />
        <Field
          label="项目描述"
          value={project.description}
          onChange={(value) => handleChange("description", value)}
          type="editor"
          placeholder="简要描述项目的背景和目标..."
        />
      </div>
    </div>
  );
};

const ProjectItem = ({ project }: { project: Project }) => {
  const dragControls = useDragControls();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { theme, updateProjects, deleteProject } = useResumeStore();

  const [isUpdating, setIsUpdating] = useState(false);

  const handleVisibilityToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isUpdating) return;

      setIsUpdating(true);
      setTimeout(() => {
        updateProjects({
          ...project,
          visible: !project.visible
        });
        setIsUpdating(false);
      }, 10);
    },
    [project, updateProjects, isUpdating]
  );

  return (
    <Reorder.Item
      id={project.id}
      value={project}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={() => {
        useResumeStore.getState().setDraggingProjectId(null);
      }}
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
          if (expandedId === project.id) return;
          dragControls.start(event);
          useResumeStore.getState().setDraggingProjectId(project.id);
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
          expandedId === project.id
            ? "cursor-not-allowed"
            : "cursor-grab hover:bg-gray-50 dark:hover:bg-neutral-800/50"
        )}
      >
        <GripVertical
          className={cn(
            "w-4 h-4",
            theme === "dark" ? "text-neutral-400" : "text-gray-400",
            expandedId === project.id && "opacity-50",
            "transform transition-transform group-hover:scale-110"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "px-4 py-4 flex items-center justify-between",
            expandedId === project.id &&
              (theme === "dark" ? "bg-neutral-800/50" : "bg-gray-50"),
            "cursor-pointer select-none"
          )}
          onClick={(e) => {
            if (expandedId === project.id) {
              setExpandedId(null);
            } else {
              setExpandedId(project.id);
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
              {project.name || "未命名项目"}
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
                  ? project.visible
                    ? "hover:bg-neutral-800 text-neutral-400"
                    : "hover:bg-neutral-800 text-neutral-600"
                  : project.visible
                    ? "hover:bg-gray-100 text-gray-500"
                    : "hover:bg-gray-100 text-gray-400"
              )}
              onClick={handleVisibilityToggle}
            >
              {project.visible ? (
                <Eye className="w-4 h-4 text-primary" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <DeleteConfirmDialog
              projectName={project.name}
              onDelete={() => {
                deleteProject(project.id);
                setExpandedId(null);
              }}
            />
            <motion.div
              initial={false}
              animate={{
                rotate: expandedId === project.id ? 180 : 0
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
          {expandedId === project.id && (
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
                  project={project}
                  onSave={(updatedProject) => {
                    updateProjects(updatedProject);
                  }}
                  onDelete={() => {
                    deleteProject(project.id);
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

export default ProjectItem;
