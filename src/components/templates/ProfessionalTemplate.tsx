import React from "react";
import BaseInfo from "../preview/BaseInfo";
import ExperienceSection from "../preview/ExperienceSection";
import EducationSection from "../preview/EducationSection";
import SkillSection from "../preview/SkillPanel";
import ProjectSection from "../preview/ProjectSection";
import CustomSection from "../preview/CustomSection";
import { ResumeData } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";
import GithubContribution from "@/components/shared/GithubContribution";

interface ProfessionalTemplateProps {
  data: ResumeData;
  template: ResumeTemplate;
}

const ProfessionalTemplate: React.FC<ProfessionalTemplateProps> = ({ data, template }) => {
  const { colorScheme } = template;
  const enabledSections = data.menuSections.filter(
    (section) => section.enabled
  );
  const sortedSections = [...enabledSections].sort((a, b) => a.order - b.order);

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "basic":
        return (
          <>
            <BaseInfo
              basic={data.basic}
              globalSettings={data.globalSettings}
              template={template}
            />
            {data.basic.githubContributionsVisible && (
              <GithubContribution
                className="mt-2"
                githubKey={data.basic.githubKey}
                username={data.basic.githubUseName}
              />
            )}
          </>
        );
      case "experience":
        return (
          <ExperienceSection
            experiences={data.experience}
            globalSettings={data.globalSettings}
          />
        );
      case "education":
        return (
          <EducationSection
            education={data.education}
            globalSettings={data.globalSettings}
          />
        );
      case "skills":
        return (
          <SkillSection
            skill={data.skillContent}
            globalSettings={data.globalSettings}
          />
        );
      case "projects":
        return (
          <ProjectSection
            projects={data.projects}
            globalSettings={data.globalSettings}
          />
        );
      default:
        if (sectionId in data.customData) {
          const sectionTitle = data.menuSections.find(s => s.id === sectionId)?.title || sectionId;
          return (
            <CustomSection
              title={sectionTitle}
              key={sectionId}
              sectionId={sectionId}
              items={data.customData[sectionId]}
              globalSettings={data.globalSettings}
            />
          );
        }
        return null;
    }
  };

  const leftColumnSections = ["basic", "skills", "education"];
  const rightColumnSections = ["experience", "projects"];

  const leftSectionsToRender = sortedSections.filter(s => leftColumnSections.includes(s.id));
  const rightSectionsToRender = sortedSections.filter(s => rightColumnSections.includes(s.id));
  
  // Custom sections go to the right by default
  const customSections = sortedSections.filter(s => !leftColumnSections.includes(s.id) && !rightColumnSections.includes(s.id));

  return (
    <div className="grid grid-cols-12 w-full min-h-screen" style={{ backgroundColor: colorScheme.background, color: colorScheme.text }}>
      {/* 左侧区域（偏窄） */}
      <div
        className="col-span-4 p-6 border-r border-gray-200"
        style={{
          paddingTop: data.globalSettings.sectionSpacing,
        }}
      >
        {leftSectionsToRender.map((section) => (
          <div key={section.id}>{renderSection(section.id)}</div>
        ))}
      </div>

      {/* 右侧区域（偏宽） */}
      <div
        className="col-span-8 p-6"
        style={{
          paddingTop: data.globalSettings.sectionSpacing,
        }}
      >
        {rightSectionsToRender.map((section) => (
          <div key={section.id}>{renderSection(section.id)}</div>
        ))}
        {customSections.map((section) => (
          <div key={section.id}>{renderSection(section.id)}</div>
        ))}
      </div>
    </div>
  );
};

export default ProfessionalTemplate;
