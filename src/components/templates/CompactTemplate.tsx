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

interface CompactTemplateProps {
  data: ResumeData;
  template: ResumeTemplate;
}

const CompactTemplate: React.FC<CompactTemplateProps> = ({
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
          <div className="border-b-2 border-gray-800 pb-2 mb-4">
            <BaseInfo basic={data.basic} globalSettings={data.globalSettings} template={template} />

            {data.basic.githubContributionsVisible && (
              <GithubContribution
                className="mt-1"
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

  const basicSection = sortedSections.find((section) => section.id === "basic");
  const otherSections = sortedSections.filter(
    (section) => section.id !== "basic"
  );
  
  // 紧凑排版：可以分为两列
  const leftSections = otherSections.filter((_, i) => i % 2 === 0);
  const rightSections = otherSections.filter((_, i) => i % 2 !== 0);

  return (
    <div
      className="flex flex-col w-full min-h-screen relative"
      style={{
        backgroundColor: colorScheme.background,
        color: colorScheme.text,
      }}
    >
      {/* 顶部个人信息占满全宽 */}
      {basicSection && <div className="w-full">{renderSection(basicSection.id)}</div>}
      
      {/* 瀑布流/双列紧凑排版 */}
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="flex flex-col">
          {leftSections.map((section) => (
            <div key={section.id} className="w-full">
              {renderSection(section.id)}
            </div>
          ))}
        </div>
        <div className="flex flex-col">
          {rightSections.map((section) => (
            <div key={section.id} className="w-full">
              {renderSection(section.id)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompactTemplate;
