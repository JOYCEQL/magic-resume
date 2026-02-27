import React from "react";
import { TemplateProvider } from "./TemplateContext";
import { getTemplateComponent } from "./registry";
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
  const TemplateComponent = getTemplateComponent(template.layout);

  return (
    <TemplateProvider templateId={template.id} menuSections={data.menuSections}>
      <TemplateComponent data={data} template={template} />
    </TemplateProvider>
  );
};

export default ResumeTemplateComponent;
