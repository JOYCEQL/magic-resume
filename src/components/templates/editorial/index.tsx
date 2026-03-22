import React from "react";
import { ResumeData } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";
import BaseInfo from "./sections/BaseInfo";
import ExperienceSection from "./sections/ExperienceSection";
import EducationSection from "./sections/EducationSection";
import ProjectSection from "./sections/ProjectSection";
import SkillSection from "./sections/SkillSection";
import SelfEvaluationSection from "./sections/SelfEvaluationSection";
import CustomSection from "./sections/CustomSection";
import SectionTitle from "./sections/SectionTitle";
import SectionWrapper from "../shared/SectionWrapper";
import CertificatesSection from "../shared/CertificatesSection";

interface EditorialTemplateProps {
  data: ResumeData;
  template: ResumeTemplate;
}

const EditorialTemplate: React.FC<EditorialTemplateProps> = ({ data, template }) => {
  const { colorScheme } = template;
  const enabledSections = data.menuSections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "basic":
        return <BaseInfo basic={data.basic} globalSettings={data.globalSettings} />;
      case "experience":
        return <ExperienceSection experiences={data.experience} globalSettings={data.globalSettings} />;
      case "education":
        return <EducationSection education={data.education} globalSettings={data.globalSettings} />;
      case "projects":
        return <ProjectSection projects={data.projects} globalSettings={data.globalSettings} />;
      case "skills":
        return <SkillSection skill={data.skillContent} globalSettings={data.globalSettings} />;
      case "selfEvaluation":
        return <SelfEvaluationSection content={data.selfEvaluationContent} globalSettings={data.globalSettings} />;
      case "certificates":
        return (
          <SectionWrapper sectionId="certificates" className="w-full" style={{ marginTop: `${data.globalSettings?.sectionSpacing || 32}px` }}>
            <SectionTitle type="certificates" globalSettings={data.globalSettings} />
            <CertificatesSection certificates={data.certificates} />
          </SectionWrapper>
        );
      default:
        if (sectionId in data.customData) {
          const sectionTitle = data.menuSections.find((s) => s.id === sectionId)?.title || sectionId;
          return <CustomSection title={sectionTitle} sectionId={sectionId} items={data.customData[sectionId]} globalSettings={data.globalSettings} />;
        }
        return null;
    }
  };

  return (
    <div
      className="flex flex-col min-h-[297mm] text-[#1a1a1a] editorial-print-container"
      style={{
        backgroundColor: colorScheme.background || "#FAF8F5",
        color: colorScheme.text || "#1a1a1a",
        margin: `-${data.globalSettings?.pagePadding || 0}px`,
        padding: `${data.globalSettings?.pagePadding || 0}px`,
        paddingTop: `${(data.globalSettings?.pagePadding || 0) + 16}px`,
      }}
    >
      {enabledSections.map((section) => (
        <div key={section.id} className="w-full mb-1 border-none ring-0">
          {renderSection(section.id)}
        </div>
      ))}
    </div>
  );
};

export default EditorialTemplate;
