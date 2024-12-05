import { motion } from "framer-motion";
import { GlobalSettings } from "@/types/resume";
import { SectionTitle } from "./SectionTitle";

interface SkillSectionProps {
  skill: string;
  globalSettings: GlobalSettings | undefined;
  themeColor: string;
}

export function SkillSection({
  skill,
  globalSettings,
  themeColor
}: SkillSectionProps) {
  if (!skill) {
    return null;
  }

  return (
    <motion.div
      layout
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`
      }}
    >
      <SectionTitle
        type="skills"
        themeColor={themeColor}
        globalSettings={globalSettings}
      />
      <div
        style={{
          marginTop: `${globalSettings?.paragraphSpacing}px`
        }}
      >
        <div
          className="text-baseFont"
          style={{
            fontSize: `${globalSettings?.baseFontSize || 14}px`,
            lineHeight: globalSettings?.lineHeight || 1.6
          }}
          dangerouslySetInnerHTML={{ __html: skill }}
        />
      </div>
    </motion.div>
  );
}
