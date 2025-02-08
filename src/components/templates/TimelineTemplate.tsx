import React from "react";
import GithubContribution from "@/components/shared/GithubContribution";
import BaseInfo from "../preview/BaseInfo";
import ExperienceSection from "../preview/ExperienceSection";
import EducationSection from "../preview/EducationSection";
import SkillSection from "../preview/SkillPanel";
import CustomSection from "../preview/CustomSection";
import { ResumeData } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";
import ProjectSection from "../preview/ProjectSection";

interface TimelineTemplateProps {
  data: ResumeData;
  template: ResumeTemplate;
}

const TimelineTemplate: React.FC<TimelineTemplateProps> = ({
  data,
  template,
}) => {
  const { colorScheme } = template;
  const enabledSections = data.menuSections.filter(
    (section) => section.enabled
  );
  const sortedSections = [...enabledSections].sort((a, b) => a.order - b.order);

  const renderTimelineItem = (content: React.ReactNode, title: string) => (
    <div className="relative pl-6">
      <div
        className="absolute left-0 top-2 h-full w-0.5"
        style={{ backgroundColor: "#e5e7eb" }}
      />
      <div
        className="absolute left-[-6px] top-2 w-3 h-3 rounded-full"
        style={{ backgroundColor: colorScheme.primary }}
      />
      <div
        className="text-xl font-bold mb-4"
        style={{ color: data.globalSettings.themeColor }}
      >
        {title}
      </div>
      <div>{content}</div>
    </div>
  );

  const renderSection = (sectionId: string) => {
    const sectionTitle =
      data.menuSections.find((s) => s.id === sectionId)?.title || sectionId;

    switch (sectionId) {
      case "basic":
        return (
          <>
            <BaseInfo
              basic={data.basic}
              globalSettings={data.globalSettings}
              showTitle={false}
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
          <div className="timeline-section">
            {renderTimelineItem(
              <ExperienceSection
                experiences={data.experience}
                globalSettings={data.globalSettings}
                showTitle={false}
              />,
              sectionTitle
            )}
          </div>
        );
      case "education":
        return (
          <div className="timeline-section">
            {renderTimelineItem(
              <EducationSection
                education={data.education}
                globalSettings={data.globalSettings}
                showTitle={false}
              />,
              sectionTitle
            )}
          </div>
        );
      case "skills":
        return (
          <div className="timeline-section">
            {renderTimelineItem(
              <SkillSection
                skill={data.skillContent}
                globalSettings={data.globalSettings}
                showTitle={false}
              />,
              sectionTitle
            )}
          </div>
        );
      case "projects":
        return (
          <div className="timeline-section">
            {renderTimelineItem(
              <ProjectSection
                projects={data.projects}
                globalSettings={data.globalSettings}
                showTitle={false}
              />,
              sectionTitle
            )}
          </div>
        );
      default:
        if (sectionId in data.customData) {
          return (
            <div className="timeline-section">
              {renderTimelineItem(
                <CustomSection
                  title={sectionTitle}
                  sectionId={sectionId}
                  items={data.customData[sectionId]}
                  globalSettings={data.globalSettings}
                  showTitle={false}
                />,
                sectionTitle
              )}
            </div>
          );
        }
        return null;
    }
  };

  return (
    <div
      className="flex flex-col w-full min-h-screen pl-[6px] "
      style={{
        backgroundColor: colorScheme.background,
        color: colorScheme.text,
      }}
    >
      {sortedSections.map((section) => (
        <div key={section.id} className="mb-4">
          {renderSection(section.id)}
        </div>
      ))}
    </div>
  );
};

export default TimelineTemplate;
