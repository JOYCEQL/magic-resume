import React from "react";
import ClassicTemplate from "./ClassicTemplate";
import ModernTemplate from "./ModernTemplate";
import LeftRightTemplate from "./LeftRightTemplate";
import TimelineTemplate from "./TimelineTemplate";
import MinimalistTemplate from "./MinimalistTemplate";

import ElegantTemplate from "./ElegantTemplate";
import CreativeTemplate from "./CreativeTemplate";

import { TemplateProvider } from "./TemplateContext";
import { ResumeData } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";

interface TemplateProps {
  data: ResumeData;
  template: ResumeTemplate;
}

const ResumeTemplateComponent: React.FC<TemplateProps> = ({
  data,
  template
}) => {
  const renderTemplate = () => {
    switch (template.layout) {
      case "modern":
        return <ModernTemplate data={data} template={template} />;
      case "left-right":
        return <LeftRightTemplate data={data} template={template} />;
      case "timeline":
        return <TimelineTemplate data={data} template={template} />;
      case "minimalist":
        return <MinimalistTemplate data={data} template={template} />;

      case "elegant":
        return <ElegantTemplate data={data} template={template} />;
      case "creative":
        return <CreativeTemplate data={data} template={template} />;

      default:
        return <ClassicTemplate data={data} template={template} />;
    }
  };

  return (
    <TemplateProvider templateId={template.id} menuSections={data.menuSections}>
      {renderTemplate()}
    </TemplateProvider>
  );
};

export default ResumeTemplateComponent;
