import React from "react";
import { ResumeTemplate } from "@/types/template";
import {
  DEFAULT_TEMPLATES,
  classicConfig,
  modernConfig,
  leftRightConfig,
  timelineConfig,
  minimalistConfig,
  elegantConfig,
  creativeConfig,
  editorialConfig,
  swissConfig,
} from "./configs";
import { registerTemplateComponent } from "./loader";

import ClassicTemplate from "./classic";
import ModernTemplate from "./modern";
import LeftRightTemplate from "./left-right";
import TimelineTemplate from "./timeline";
import MinimalistTemplate from "./minimalist";
import ElegantTemplate from "./elegant";
import CreativeTemplate from "./creative";
import EditorialTemplate from "./editorial";
import SwissTemplate from "./swiss";

export interface TemplateRegistryEntry {
  config: ResumeTemplate;
  Component: React.ComponentType<{ data: any; template: ResumeTemplate }>;
}

export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = [
  { config: classicConfig, Component: ClassicTemplate },
  { config: modernConfig, Component: ModernTemplate },
  { config: leftRightConfig, Component: LeftRightTemplate },
  { config: timelineConfig, Component: TimelineTemplate },
  { config: minimalistConfig, Component: MinimalistTemplate },
  { config: elegantConfig, Component: ElegantTemplate },
  { config: creativeConfig, Component: CreativeTemplate },
  { config: editorialConfig, Component: EditorialTemplate },
  { config: swissConfig, Component: SwissTemplate },
];

for (const entry of TEMPLATE_REGISTRY) {
  registerTemplateComponent(entry.config.layout, entry.Component);
}

export { DEFAULT_TEMPLATES };

export function getTemplateComponent(
  layout: string
): React.ComponentType<{ data: any; template: ResumeTemplate }> {
  return (
    TEMPLATE_REGISTRY.find((entry) => entry.config.layout === layout)
      ?.Component ?? ClassicTemplate
  );
}
