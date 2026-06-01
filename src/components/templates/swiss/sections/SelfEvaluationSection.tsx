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
    const themeColor = globalSettings?.themeColor || "#E31C24";

    return (
        <SectionWrapper sectionId="selfEvaluation" style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle type="selfEvaluation" globalSettings={globalSettings} showTitle={showTitle} />
            <motion.div style={{ marginTop: `${globalSettings?.paragraphSpacing || 16}px` }}>
                <motion.div 
                    layout="position"
                    className="relative pl-5 py-2 text-slate-600 prose prose-sm max-w-none prose-p:my-1 [&>ul]:pl-4 [&>ul]:mt-1 [&>ul>li]:my-0.5 marker:text-slate-400 bg-slate-50/30 rounded-r-xl"
                >
                    {/* 瑞士经典引言左侧实线 */}
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l"
                        style={{ backgroundColor: themeColor }}
                    />
                    <div
                        style={{ 
                            fontSize: `${globalSettings?.baseFontSize || 13}px`, 
                            lineHeight: globalSettings?.lineHeight || 1.6 
                        }}
                        dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(content) }}
                    />
                </motion.div>
            </motion.div>
        </SectionWrapper>
    );
};

export default SelfEvaluationSection;
