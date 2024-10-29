import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import {
  AnimatePresence,
  motion,
  Reorder,
  useDragControls
} from "framer-motion";
import { ChevronDown, GripVertical, Trash2 } from "lucide-react";
import { useState } from "react";
import Field from "../Field";

interface ProjectEditorProps {
  project: Project;
  onSave: (project: Project) => void;
  onDelete: () => void;
  onCancel: () => void;
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({
  project,
  onSave,
  onDelete,
  onCancel
}) => {
  const theme = useResumeStore((state) => state.theme);
  const [data, setData] = useState<Project>(project);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.name || !data.role || !data.date) return;
    onSave(data);
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="项目名称"
            value={data.name}
            onChange={(value) => setData((prev) => ({ ...prev, name: value }))}
            placeholder="项目名称"
            required
          />
          <Field
            label="担任角色"
            value={data.role}
            onChange={(value) => setData((prev) => ({ ...prev, role: value }))}
            placeholder="如：前端负责人"
            required
          />
        </div>
        <Field
          label="项目时间"
          value={data.date}
          onChange={(value) => setData((prev) => ({ ...prev, date: value }))}
          placeholder="如：2023.01 - 2023.06"
          required
        />
        <Field
          label="项目描述"
          value={data.description}
          onChange={(value) =>
            setData((prev) => ({ ...prev, description: value }))
          }
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

// ProjectEditor 组件用于编辑单个项目
interface Project {
  id: string;
  name: string;
  role: string;
  date: string;
  description: string;
  technologies: string;
  responsibilities: string;
  achievements: string;
}

const ProjectItem = ({ project }: { project: Project }) => {
  const dragControls = useDragControls();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { theme, updateProjects, deleteProject } = useResumeStore();
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
        theme === "dark"
          ? "bg-neutral-900/30 border-neutral-800"
          : "bg-white border-gray-100"
      )}
    >
      {/* 拖拽手柄区域 */}
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

      {/* 内容区域 */}
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
              className={cn(
                "text-sm",
                theme === "dark"
                  ? "hover:bg-red-900/50 text-red-400"
                  : "hover:bg-red-50 text-red-600"
              )}
              onClick={(e) => {
                e.stopPropagation();
                deleteProject(project.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
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
                    setExpandedId(null);
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
