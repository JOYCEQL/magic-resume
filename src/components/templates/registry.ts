import React from "react";
import { ResumeTemplate } from "@/types/template";

// Import configs
import { classicConfig } from "./classic/config";
import { modernConfig } from "./modern/config";
import { leftRightConfig } from "./left-right/config";
import { timelineConfig } from "./timeline/config";
import { minimalistConfig } from "./minimalist/config";
import { elegantConfig } from "./elegant/config";
import { creativeConfig } from "./creative/config";

// Import components
import ClassicTemplate from "./classic";
import ModernTemplate from "./modern";
import LeftRightTemplate from "./left-right";
import TimelineTemplate from "./timeline";
import MinimalistTemplate from "./minimalist";
import ElegantTemplate from "./elegant";
import CreativeTemplate from "./creative";

export interface TemplateRegistryEntry {
  config: ResumeTemplate;
  Component: React.FC<{ data: any; template: ResumeTemplate }>;
}

/**
 * Unified template registry.
 * To add a new template, create a directory under `templates/` with config.ts + index.tsx,
 * then add one line here. No other files need to change.
 */
export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = [
  { config: classicConfig, Component: ClassicTemplate },
  { config: modernConfig, Component: ModernTemplate },
  { config: leftRightConfig, Component: LeftRightTemplate },
  { config: timelineConfig, Component: TimelineTemplate },
  { config: minimalistConfig, Component: MinimalistTemplate },
  { config: elegantConfig, Component: ElegantTemplate },
  { config: creativeConfig, Component: CreativeTemplate },
];

/** All template configs — drop-in replacement for the old DEFAULT_TEMPLATES */
export const DEFAULT_TEMPLATES: ResumeTemplate[] = TEMPLATE_REGISTRY.map(
  (entry) => entry.config
);

/** Look up a template component by layout id */
export function getTemplateComponent(
  layout: string
): React.FC<{ data: any; template: ResumeTemplate }> {
  return (
    TEMPLATE_REGISTRY.find((entry) => entry.config.layout === layout)
      ?.Component ?? ClassicTemplate
  );
}
