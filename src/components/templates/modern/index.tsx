import React from "react";
import { ResumeData } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";
import BaseInfo from "./sections/BaseInfo";
import ExperienceSection from "./sections/ExperienceSection";
import EducationSection from "./sections/EducationSection";
import ProjectSection from "./sections/ProjectSection";
import SkillSection from "./sections/SkillSection";
import CustomSection from "./sections/CustomSection";

interface ModernTemplateProps {
    data: ResumeData;
    template: ResumeTemplate;
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({ data, template }) => {
    const { colorScheme } = template;
    const enabledSections = data.menuSections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

    const renderSection = (sectionId: string) => {
        switch (sectionId) {
            case "basic":
                return <BaseInfo basic={data.basic} globalSettings={data.globalSettings} template={template} />;
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

    const basicSection = enabledSections.find((s) => s.id === "basic");
    const otherSections = enabledSections.filter((s) => s.id !== "basic");

    return (
        <div className="grid grid-cols-3 w-full">
            <div className="col-span-1 p-4" style={{ backgroundColor: data.globalSettings.themeColor, color: "#ffffff", paddingTop: data.globalSettings.sectionSpacing }}>
                {basicSection && renderSection(basicSection.id)}
            </div>
            <div className="col-span-2 p-4 pt-0" style={{ backgroundColor: colorScheme.background, color: colorScheme.text }}>
                {otherSections.map((section) => (
                    <div key={section.id}>{renderSection(section.id)}</div>
                ))}
            </div>
        </div>
    );
};

export default ModernTemplate;
