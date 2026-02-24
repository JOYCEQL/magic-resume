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

interface CreativeTemplateProps {
  data: ResumeData;
  template: ResumeTemplate;
}

const CreativeTemplate: React.FC<CreativeTemplateProps> = ({
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

  const basicSection = sortedSections.find((section) => section.id === "basic");
  const otherSections = sortedSections.filter(
    (section) => section.id !== "basic"
  );

  return (
    <div
      className="flex flex-col w-full min-h-screen"
      style={{
        backgroundColor: colorScheme.background,
        color: colorScheme.text,
      }}
    >
      {/* 顶部色块（如果存在basic区块） */}
      {basicSection && (
        <div 
          className="w-full relative py-8 px-8 mb-6 rounded-b-3xl"
          style={{
            backgroundColor: data.globalSettings.themeColor,
            color: "#ffffff"
          }}
        >
          <div className="relative z-10 w-full">
            <BaseInfo basic={data.basic} globalSettings={data.globalSettings} template={template} />
            {data.basic.githubContributionsVisible && (
              <GithubContribution
                className="mt-2 text-white"
                githubKey={data.basic.githubKey}
                username={data.basic.githubUseName}
              />
            )}
          </div>
        </div>
      )}

      {/* 下方内容区 */}
      <div className="px-8 w-full w-max-4xl mx-auto">
        {otherSections.map((section) => (
          <div key={section.id}>{renderSection(section.id)}</div>
        ))}
      </div>
    </div>
  );
};

export default CreativeTemplate;
