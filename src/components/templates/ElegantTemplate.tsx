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

interface ElegantTemplateProps {
  data: ResumeData;
  template: ResumeTemplate;
}

const ElegantTemplate: React.FC<ElegantTemplateProps> = ({
  data,
  template,
}) => {
  const { colorScheme } = template;
  const enabledSections = data.menuSections.filter(
    (section) => section.enabled
  );
  const sortedSections = [...enabledSections].sort((a, b) => a.order - b.order);

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "basic":
        return (
          <div className="text-center w-full flex flex-col items-center">
            <BaseInfo basic={data.basic} globalSettings={data.globalSettings} template={template} />

            {data.basic.githubContributionsVisible && (
              <GithubContribution
                className="mt-2 justify-center"
                githubKey={data.basic.githubKey}
                username={data.basic.githubUseName}
              />
            )}
          </div>
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

  return (
    <div
      className="flex flex-col w-full min-h-screen items-center"
      style={{
        backgroundColor: colorScheme.background,
        color: colorScheme.text,
      }}
    >
      {/* 优雅版采用单行且较为居中的排版风格 */}
      <div className="w-full max-w-4xl px-8">
        {sortedSections.map((section) => (
          <div key={section.id} className="w-full">
            {renderSection(section.id)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ElegantTemplate;
