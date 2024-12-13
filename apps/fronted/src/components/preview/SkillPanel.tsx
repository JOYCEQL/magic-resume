import { motion } from "framer-motion";
import { GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";

interface SkillSectionProps {
  skill: string | undefined;
  globalSettings: GlobalSettings | undefined;
}

const SkillSection = ({ skill, globalSettings }: SkillSectionProps) => {
  if (!skill) {
    return null;
  }

  return (
    <motion.div
      layout
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`,
      }}
    >
      <SectionTitle type="skills" globalSettings={globalSettings} />
      <div
        style={{
          marginTop: `${globalSettings?.paragraphSpacing}px`,
        }}
      >
        <div
          className="text-baseFont"
          style={{
            fontSize: `${globalSettings?.baseFontSize || 14}px`,
            lineHeight: globalSettings?.lineHeight || 1.6,
          }}
          dangerouslySetInnerHTML={{ __html: skill }}
        />
      </div>
    </motion.div>
  );
};

export default SkillSection;
