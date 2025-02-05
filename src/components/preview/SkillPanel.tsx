"use client";
import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { GlobalSettings } from "@/types/resume";
import { useResumeStore } from "@/store/useResumeStore";

interface SkillSectionProps {
  skill: string | undefined;
  globalSettings: GlobalSettings | undefined;
}

const SkillSection = ({ skill, globalSettings }: SkillSectionProps) => {
  const { setActiveSection } = useResumeStore();

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
      <SectionTitle type="skills" globalSettings={globalSettings} />
      <motion.div
        style={{
          marginTop: `${globalSettings?.paragraphSpacing}px`,
        }}
      >
        <motion.div
          className="text-baseFont"
          layout="position"
          style={{
            fontSize: `${globalSettings?.baseFontSize || 14}px`,
            lineHeight: globalSettings?.lineHeight || 1.6,
          }}
          dangerouslySetInnerHTML={{ __html: skill }}
        />
      </motion.div>
    </motion.div>
  );
};

export default SkillSection;
