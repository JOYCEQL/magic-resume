import React from "react";
import ClassicTemplate from "./ClassicTemplate";
import ModernTemplate from "./ModernTemplate";
import LeftRightTemplate from "./LeftRightTemplate";
import { ResumeData } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";

interface TemplateProps {
  data: ResumeData;
  template: ResumeTemplate;
}

const ResumeTemplateComponent: React.FC<TemplateProps> = ({
  data,
  template,
}) => {
  const renderTemplate = () => {
    switch (template.layout) {
      case "modern":
        return <ModernTemplate data={data} template={template} />;
      case "left-right":
        return <LeftRightTemplate data={data} template={template} />;
      default:
        return <ClassicTemplate data={data} template={template} />;
    }
  };

  return renderTemplate();
};

export default ResumeTemplateComponent;
