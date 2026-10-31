import SectionIcon from "@/components/shared/SectionIcon";
import React from "react";
import { Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import BasicPanel from "./basic/BasicPanel";
import { preloadRichTextEditor } from "./Field";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const EducationPanel = React.lazy(() => import("./education/EducationPanel"));
const ProjectPanel = React.lazy(() => import("./project/ProjectPanel"));
const ExperiencePanel = React.lazy(
  () => import("./experience/ExperiencePanel")
);
const CustomPanel = React.lazy(() => import("./custom/CustomPanel"));
const SkillPanel = React.lazy(() => import("./skills/SkillPanel"));
const SelfEvaluationPanel = React.lazy(
  () => import("./self-evaluation/SelfEvaluationPanel")
);
const CertificatesPanel = React.lazy(
  () => import("./certificates/CertificatesPanel")
);
const PublicationsPanel = React.lazy(
  () => import("./publications/PublicationsPanel")
);

export function preloadEditorPanel(sectionId?: string | null) {
  if (!sectionId || sectionId === "basic") return;
  switch (sectionId) {
    case "projects":
      void import("./project/ProjectPanel");
      void preloadRichTextEditor();
      break;
    case "education":
      void import("./education/EducationPanel");
      void preloadRichTextEditor();
      break;
    case "experience":
      void import("./experience/ExperiencePanel");
      void preloadRichTextEditor();
      break;
    case "skills":
      void import("./skills/SkillPanel");
      void preloadRichTextEditor();
      break;
    case "selfEvaluation":
      void import("./self-evaluation/SelfEvaluationPanel");
      void preloadRichTextEditor();
      break;
    case "publications":
      void import("./publications/PublicationsPanel");
      void preloadRichTextEditor();
      break;
    case "certificates":
      void import("./certificates/CertificatesPanel");
      break;
    default:
      if (sectionId.startsWith("custom")) {
        void import("./custom/CustomPanel");
        void preloadRichTextEditor();
      }
      break;
  }
}

export function EditPanel() {
  const resumeId = useResumeStore((state) => state.activeResume?.id);
  const activeSection = useResumeStore(
    (state) => state.activeResume?.activeSection || ""
  );
  const menuSections = useResumeStore(
    (state) => state.activeResume?.menuSections || []
  );
  const updateMenuSections = useResumeStore(
    (state) => state.updateMenuSections
  );
  if (!resumeId) return;

  const renderFields = () => {
    switch (activeSection) {
      case "basic":
        return <BasicPanel />;

      case "projects":
        return (
          <React.Suspense fallback={null}>
            <ProjectPanel />
          </React.Suspense>
        );
      case "education":
        return (
          <React.Suspense fallback={null}>
            <EducationPanel />
          </React.Suspense>
        );
      case "experience":
        return (
          <React.Suspense fallback={null}>
            <ExperiencePanel />
          </React.Suspense>
        );
      case "skills":
        return (
          <React.Suspense fallback={null}>
            <SkillPanel />
          </React.Suspense>
        );
      case "selfEvaluation":
        return (
          <React.Suspense fallback={null}>
            <SelfEvaluationPanel />
          </React.Suspense>
        );
      case "publications":
        return (
          <React.Suspense fallback={null}>
            <PublicationsPanel key={resumeId} />
          </React.Suspense>
        );
      case "certificates":
        return (
          <React.Suspense fallback={null}>
            <CertificatesPanel />
          </React.Suspense>
        );
      default:
        if (activeSection?.startsWith("custom")) {
          return (
            <React.Suspense fallback={null}>
              <CustomPanel sectionId={activeSection} />
            </React.Suspense>
          );
        } else {
          return <BasicPanel />;
        }
    }
  };

  return (
    <motion.div
      className={cn(
        "w-full h-full border-r overflow-y-auto",
        "bg-background border-border"
      )}
    >
      <div className="p-4">
        <motion.div
          className={cn(
            "mb-4 p-4 rounded-lg border",
            "bg-card border-border"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              <SectionIcon
                icon={menuSections?.find((s) => s.id === activeSection)?.icon}
              />
            </span>

            {/* 如果是基本信息的展示话展示div */}
            {activeSection === "basic" ? (
              <div>
                <span className="text-lg font-semibold text-primary">
                  {menuSections?.find((s) => s.id === activeSection)?.title}
                </span>
              </div>
            ) : (
              <>
                <input
                  className={cn(
                    "flex-1 text-lg  font-medium  text-primary border-black  bg-transparent outline-none   pb-1 text-primary"
                  )}
                  type="text"
                  value={
                    menuSections?.find((s) => s.id === activeSection)?.title
                  }
                  onChange={(e) => {
                    const newMenuSections = menuSections.map((s) => {
                      if (s.id === activeSection) {
                        return {
                          ...s,
                          title: e.target.value,
                        };
                      }
                      return s;
                    });
                    updateMenuSections(newMenuSections);
                  }}
                />
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Pencil size={16} className="text-primary" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>点击文字部分即可聚焦编辑</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </motion.div>

        <motion.div className={cn("rounded-lg", "bg-card border-border")}>
          {renderFields()}
        </motion.div>
      </div>
    </motion.div>
  );
}
