import React from "react";
import { ResumeData } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";
import BaseInfo from "./sections/BaseInfo";
import ExperienceSection from "./sections/ExperienceSection";
import EducationSection from "./sections/EducationSection";
import ProjectSection from "./sections/ProjectSection";
import SkillSection from "./sections/SkillSection";
import CustomSection from "./sections/CustomSection";

interface TimelineTemplateProps {
    data: ResumeData;
    template: ResumeTemplate;
}

const TimelineTemplate: React.FC<TimelineTemplateProps> = ({ data, template }) => {
    const { colorScheme } = template;
    const enabledSections = data.menuSections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

    const renderTimelineItem = (content: React.ReactNode, title: string) => (
        <div className="relative pl-6">
            <div className="absolute left-0 top-2 h-full w-0.5" style={{ backgroundColor: "#e5e7eb" }} />
            <div className="absolute left-[-6px] top-2 w-3 h-3 rounded-full" style={{ backgroundColor: colorScheme.primary }} />
            <div className="text-xl font-bold mb-4" style={{ color: data.globalSettings.themeColor, fontSize: `${data.globalSettings.headerSize || 20}px` }}>
                {title}
            </div>
            <div>{content}</div>
        </div>
    );

    const renderSection = (sectionId: string) => {
        switch (sectionId) {
            case "basic":
                return <BaseInfo basic={data.basic} globalSettings={data.globalSettings} template={template} />;
            case "experience":
                return <ExperienceSection experiences={data.experience} globalSettings={data.globalSettings} showTitle={false} />;
            case "education":
                return <EducationSection education={data.education} globalSettings={data.globalSettings} showTitle={false} />;
            case "skills":
                return <SkillSection skill={data.skillContent} globalSettings={data.globalSettings} showTitle={false} />;
            case "projects":
                return <ProjectSection projects={data.projects} globalSettings={data.globalSettings} showTitle={false} />;
            default:
                if (sectionId in data.customData) {
                    const title = data.menuSections.find((s) => s.id === sectionId)?.title || sectionId;
                    return <CustomSection title={title} sectionId={sectionId} items={data.customData[sectionId]} globalSettings={data.globalSettings} showTitle={false} />;
                }
                return null;
        }
    };

    return (
        <div className="flex flex-col w-full min-h-screen pl-[6px]" style={{ backgroundColor: colorScheme.background, color: colorScheme.text }}>
            {enabledSections.map((section) => {
                if (section.id === "basic") {
                    return <div key={section.id} className="mb-4">{renderSection(section.id)}</div>;
                }
                const sectionTitle = data.menuSections.find((s) => s.id === section.id)?.title || section.id;
                return (
                    <div key={section.id} className="mb-4">
                        <div className="timeline-section">
                            {renderTimelineItem(renderSection(section.id), sectionTitle)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TimelineTemplate;
