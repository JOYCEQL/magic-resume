import React from "react";
import { ResumeData } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";
import BaseInfo from "./sections/BaseInfo";
import GithubContribution from "@/components/shared/GithubContribution";
import ExperienceSection from "./sections/ExperienceSection";
import EducationSection from "./sections/EducationSection";
import ProjectSection from "./sections/ProjectSection";
import SkillSection from "./sections/SkillSection";
import CustomSection from "./sections/CustomSection";

interface CreativeTemplateProps {
    data: ResumeData;
    template: ResumeTemplate;
}

const CreativeTemplate: React.FC<CreativeTemplateProps> = ({ data, template }) => {
    const { colorScheme } = template;
    const enabledSections = data.menuSections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

    const basicSection = enabledSections.find((s) => s.id === "basic");
    const otherSections = enabledSections.filter((s) => s.id !== "basic");

    const renderSection = (sectionId: string) => {
        switch (sectionId) {
            case "experience":
                return <ExperienceSection experiences={data.experience} globalSettings={data.globalSettings} />;
            case "education":
                return <EducationSection education={data.education} globalSettings={data.globalSettings} />;
            case "skills":
                return <SkillSection skill={data.skillContent} globalSettings={data.globalSettings} />;
            case "projects":
                return <ProjectSection projects={data.projects} globalSettings={data.globalSettings} />;
            default:
                if (sectionId in data.customData) {
                    const title = data.menuSections.find((s) => s.id === sectionId)?.title || sectionId;
                    return <CustomSection title={title} sectionId={sectionId} items={data.customData[sectionId]} globalSettings={data.globalSettings} />;
                }
                return null;
        }
    };

    return (
        <div className="flex flex-col w-full min-h-screen" style={{ backgroundColor: colorScheme.background, color: colorScheme.text }}>
            {/* Top colored header block */}
            {basicSection && (
                <div className="w-full relative py-8 px-8 mb-6 rounded-b-3xl" style={{ backgroundColor: data.globalSettings.themeColor, color: "#ffffff" }}>
                    <div className="relative z-10 w-full">
                        <BaseInfo basic={data.basic} globalSettings={data.globalSettings} template={template} />
                        {data.basic.githubContributionsVisible && (
                            <GithubContribution className="mt-2 text-white" githubKey={data.basic.githubKey} username={data.basic.githubUseName} />
                        )}
                    </div>
                </div>
            )}
            {/* Content sections */}
            <div className="px-8 w-full w-max-4xl mx-auto">
                {otherSections.map((section) => (
                    <div key={section.id}>{renderSection(section.id)}</div>
                ))}
            </div>
        </div>
    );
};

export default CreativeTemplate;
