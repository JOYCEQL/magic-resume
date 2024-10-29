"use client";

import React from "react";
import {
  motion,
  AnimatePresence,
  Reorder,
  useDragControls
} from "framer-motion";
import {
  CalendarIcon,
  PlusCircle,
  ChevronDown,
  Trash2,
  X,
  GripVertical
} from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Field from "./Field";
import ProjectItem from "./project/ProjectItem";

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

// 主面板组件
export function EditPanel() {
  const {
    theme,
    activeSection,
    menuSections,
    basic,
    projects = [],
    updateBasicInfo,
    updateProjects,
    deleteProject
  } = useResumeStore();

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const handleCreateProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: "Project Name",
      role: "Project Role",
      date: "",
      description: "",
      technologies: "",
      responsibilities: "",
      achievements: ""
    };
    setEditingId(newProject.id);
    updateProjects(newProject);
  };

  const renderFields = () => {
    switch (activeSection) {
      case "basic":
        return (
          <div className="space-y-5 p-4">
            <Field
              label="姓名"
              value={basic.name}
              onChange={(value) => updateBasicInfo({ name: value })}
              placeholder="请输入你的姓名"
              required
            />
            <Field
              label="职位"
              value={basic.title}
              onChange={(value) => updateBasicInfo({ title: value })}
              placeholder="期望职位"
              required
            />
            <Field
              label="出生日期"
              value={basic.birthDate}
              onChange={(value) => updateBasicInfo({ birthDate: value })}
              type="date"
            />
            <div className="grid grid-cols-2 gap-5">
              <Field
                label="电子邮箱"
                value={basic.email}
                onChange={(value) => updateBasicInfo({ email: value })}
                placeholder="your@email.com"
                required
              />
              <Field
                label="电话"
                value={basic.phone}
                onChange={(value) => updateBasicInfo({ phone: value })}
                placeholder="手机号码"
                required
              />
            </div>
            <Field
              label="所在地"
              value={basic.location}
              onChange={(value) => updateBasicInfo({ location: value })}
              placeholder="城市"
              required
            />
            <Field
              label="个人简介"
              value={basic.summary}
              onChange={(value) => updateBasicInfo({ summary: value })}
              type="textarea"
              placeholder="简单介绍一下自己..."
            />
          </div>
        );

      case "projects":
        return (
          <div
            className={cn(
              "space-y-4 px-4 py-4 rounded-lg",
              theme === "dark" ? "bg-neutral-900/30" : "bg-white"
            )}
          >
            <Reorder.Group
              axis="y"
              values={projects}
              onReorder={(newOrder) => {
                useResumeStore.setState({ projects: newOrder });
              }}
              className="space-y-3"
            >
              {projects.map((project) => (
                <ProjectItem key={project.id} project={project}></ProjectItem>
              ))}

              {/* 添加项目按钮 */}
              <Button
                onClick={handleCreateProject}
                className={cn(
                  "w-full",
                  theme === "dark"
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-black hover:bg-neutral-800 text-white"
                )}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                添加项目
              </Button>
            </Reorder.Group>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={cn(
        "w-full  h-full border-r overflow-y-auto",
        theme === "dark"
          ? "bg-neutral-950 border-neutral-800"
          : "bg-gray-50 border-gray-100"
      )}
    >
      <div className="p-4">
        <motion.div
          className={cn(
            "mb-4 p-4 rounded-lg border",
            theme === "dark"
              ? "bg-neutral-900/50 border-neutral-800"
              : "bg-white border-gray-100"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {menuSections?.find((s) => s.id === activeSection)?.icon}
            </span>
            <h1
              className={cn(
                "text-base font-medium",
                theme === "dark" ? "text-neutral-200" : "text-gray-700"
              )}
            >
              {menuSections?.find((s) => s.id === activeSection)?.title}
            </h1>
          </div>
        </motion.div>

        <motion.div
          className={cn(
            "rounded-lg",
            editingId === null &&
              (theme === "dark"
                ? "bg-neutral-900/50 border-neutral-800"
                : "bg-white border-gray-100")
          )}
        >
          {renderFields()}
        </motion.div>
      </div>
    </motion.div>
  );
}
