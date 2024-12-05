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
import ThemeModal from "@/components/shared/ThemeModal";

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
  const { updateProjects, deleteProject } = useResumeStore();
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
          "border-gray-100 dark:border-neutral-800",
          expandedId === project.id
            ? "cursor-not-allowed"
            : "cursor-grab hover:bg-gray-50 dark:hover:bg-neutral-800/50"
        )}
      >
        <GripVertical
          className={cn(
            "w-4 h-4",
            "text-gray-400 dark:text-neutral-400",
            expandedId === project.id && "opacity-50",
            "transform transition-transform group-hover:scale-110"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "px-4 py-4 flex items-center justify-between",
            expandedId === project.id && "bg-gray-50 dark:bg-neutral-800/50",
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
                "text-gray-700 dark:text-neutral-200"
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
                project.visible
                  ? "hover:bg-gray-100 text-gray-500 dark:hover:bg-neutral-800 dark:text-neutral-400"
                  : "hover:bg-gray-100 text-gray-400 dark:hover:bg-neutral-800 dark:text-neutral-600"
              )}
              onClick={handleVisibilityToggle}
            >
              {project.visible ? (
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
              title={project.name}
              onClose={() => setDeleteDialogOpen(false)}
              onConfirm={() => {
                deleteProject(project.id);
                setExpandedId(null);
                setDeleteDialogOpen(false);
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
                  "dark:text-neutral-400",
                  "text-gray-500"
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
                  "dark:border-neutral-800 border-gray-100"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className={cn(
                    "h-px w-full",
                    "dark:bg-neutral-800 bg-gray-100"
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
