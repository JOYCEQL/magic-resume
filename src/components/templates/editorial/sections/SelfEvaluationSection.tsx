import { motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { GlobalSettings } from "@/types/resume";
import { normalizeRichTextContent } from "@/lib/richText";

interface SelfEvaluationSectionProps {
  content?: string;
  globalSettings?: GlobalSettings;
  showTitle?: boolean;
}

const SelfEvaluationSection = ({ content, globalSettings, showTitle = true }: SelfEvaluationSectionProps) => {
  return (
    <SectionWrapper sectionId="selfEvaluation" className="w-full" style={{ marginTop: `${globalSettings?.sectionSpacing || 32}px` }}>
      <SectionTitle type="selfEvaluation" globalSettings={globalSettings} showTitle={showTitle} />
      <motion.div style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
        <motion.div
          className="text-gray-800 prose prose-sm max-w-none prose-p:my-1 [&>ul]:pl-4 [&>ul]:mt-0 [&>ul>li]:my-0.5 marker:text-black"
          layout="position"
          style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
          dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(content) }}
        />
      </motion.div>
    </SectionWrapper>
  );
};

export default SelfEvaluationSection;
