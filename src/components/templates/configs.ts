import { ResumeTemplate } from "@/types/template";

import { classicConfig } from "./classic/config";
import { modernConfig } from "./modern/config";
import { leftRightConfig } from "./left-right/config";
import { timelineConfig } from "./timeline/config";
import { minimalistConfig } from "./minimalist/config";
import { elegantConfig } from "./elegant/config";
import { creativeConfig } from "./creative/config";
import { editorialConfig } from "./editorial/config";
import { swissConfig } from "./swiss/config";

export const DEFAULT_TEMPLATES: ResumeTemplate[] = [
  classicConfig,
  modernConfig,
  leftRightConfig,
  timelineConfig,
  minimalistConfig,
  elegantConfig,
  creativeConfig,
  editorialConfig,
  swissConfig,
];

export {
  classicConfig,
  modernConfig,
  leftRightConfig,
  timelineConfig,
  minimalistConfig,
  elegantConfig,
  creativeConfig,
  editorialConfig,
  swissConfig,
};
