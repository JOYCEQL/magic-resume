import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { GlobalSettings } from "@/types/resume";
import { normalizeRichTextContent } from "@/lib/richText";

interface SkillSectionProps {
  skill?: string;
  globalSettings?: GlobalSettings;
  showTitle?: boolean;
}

const SkillSection = ({ skill, globalSettings, showTitle = true }: SkillSectionProps) => {
  return (
    <SectionWrapper sectionId="skills" className="w-full" style={{ marginTop: `${globalSettings?.sectionSpacing || 32}px` }}>
      <SectionTitle type="skills" globalSettings={globalSettings} showTitle={showTitle} />
      <motion.div style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
        <motion.div 
          className="text-gray-800 prose prose-sm max-w-none prose-p:my-1 prose-strong:font-bold prose-ul:my-1 prose-li:my-0.5 [&>ul]:pl-4 marker:text-black"
          layout="position"
          style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
          dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(skill) }}
        />
      </motion.div>
    </SectionWrapper>
  );
};

export default SkillSection;
