import React, { useEffect, useState } from "react";
import { TemplateProvider } from "./TemplateContext";
import {
  getLoadedTemplateComponent,
  preloadTemplateComponent,
  type TemplateComponentType,
} from "./loader";
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
  const layout = template.layout || "classic";
  const synchronousComponent = getLoadedTemplateComponent(layout);
  const [loadedLayout, setLoadedLayout] = useState<{
    layout: string;
    Component: TemplateComponentType;
  } | null>(() =>
    synchronousComponent
      ? { layout, Component: synchronousComponent }
      : null
  );

  useEffect(() => {
    const existing = getLoadedTemplateComponent(layout);
    if (existing) {
      setLoadedLayout((prev) =>
        prev?.layout === layout && prev.Component === existing
          ? prev
          : { layout, Component: existing }
      );
      return;
    }

    let cancelled = false;
    void preloadTemplateComponent(layout).then((Component) => {
      if (!cancelled) {
        setLoadedLayout({ layout, Component });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [layout]);

  const ActiveComponent =
    synchronousComponent ??
    (loadedLayout?.layout === layout ? loadedLayout.Component : null);

  if (!ActiveComponent) {
    return null;
  }

  return (
    <TemplateProvider templateId={template.id} menuSections={data.menuSections}>
      <ActiveComponent data={data} template={template} />
    </TemplateProvider>
  );
};

export default React.memo(ResumeTemplateComponent);
