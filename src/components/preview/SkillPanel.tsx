"use client";
import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { GlobalSettings } from "@/types/resume";
import { useResumeStore } from "@/store/useResumeStore";
import { normalizeRichTextContent } from "@/lib/richText";
import { getRegionStyle } from "@/config/textStyles";

interface SkillSectionProps {
  skill?: string;
  globalSettings?: GlobalSettings;
  showTitle?: boolean;
}

const SkillSection = ({ skill, globalSettings, showTitle = true }: SkillSectionProps) => {
  const { setActiveSection } = useResumeStore();
  const bodyStyle = getRegionStyle('body', globalSettings?.regionStyles);

  return (
    <motion.div
      className="hover:cursor-pointer hover:bg-gray-100 rounded-md transition-all duration-300 ease-in-out hover:shadow-md"
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`,
      }}
      onClick={() => {
        setActiveSection("skills");
      }}
    >
      {showTitle && <SectionTitle type="skills" globalSettings={globalSettings} />}
      <motion.div
        style={{
          marginTop: bodyStyle.marginTop ? `${bodyStyle.marginTop}px` : undefined,
        }}
      >
        <motion.div
          className="text-baseFont"
          layout="position"
          style={{
            fontSize: `${bodyStyle.fontSize}px`,
            lineHeight: bodyStyle.lineHeight,
          }}
          dangerouslySetInnerHTML={{
            __html: normalizeRichTextContent(skill),
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default SkillSection;
