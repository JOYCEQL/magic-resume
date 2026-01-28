"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Experience, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import { useResumeStore } from "@/store/useResumeStore";
import { normalizeRichTextContent } from "@/lib/richText";
import { getRegionStyle } from "@/config/textStyles";

interface ExperienceSectionProps {
  experiences?: Experience[];
  globalSettings?: GlobalSettings;
  showTitle?: boolean;
}

interface ExperienceItemProps {
  experience: Experience;
  globalSettings?: GlobalSettings;
}

const ExperienceItem = React.forwardRef<HTMLDivElement, ExperienceItemProps>(
  ({ experience, globalSettings }, ref) => {
    const centerSubtitle = globalSettings?.centerSubtitle;
    const subtitleGap = globalSettings?.subtitleGap;
    const useOffsetLayout = centerSubtitle && subtitleGap;

    const itemTitleStyle = getRegionStyle('itemTitle', globalSettings?.regionStyles);
    const itemSubtitleStyle = getRegionStyle('itemSubtitle', globalSettings?.regionStyles);
    const bodyStyle = getRegionStyle('body', globalSettings?.regionStyles);

    const fontWeightMap: Record<string, number> = {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    };

    return (
      <motion.div
        style={{ marginTop: `${itemTitleStyle.marginTop || 8}px` }}
        layout="position"
      >
        {useOffsetLayout ? (
          <motion.div className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                style={{
                  fontSize: `${itemTitleStyle.fontSize}px`,
                  fontWeight: itemTitleStyle.fontWeight ? fontWeightMap[itemTitleStyle.fontWeight] : 600,
                  lineHeight: itemTitleStyle.lineHeight,
                }}
              >
                {experience.company}
              </div>
              <motion.div 
                className="text-subtitleFont"
                style={{ 
                  marginLeft: '16px', 
                  fontSize: `${itemSubtitleStyle.fontSize}px`,
                  lineHeight: itemSubtitleStyle.lineHeight,
                }}
              >
                {experience.position}
              </motion.div>
            </div>
            <div className="text-subtitleFont" style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}>{experience.date}</div>
          </motion.div>
        ) : (
          <motion.div
            className={`grid grid-cols-${centerSubtitle ? 3 : 2} gap-2 items-center justify-items-start [&>*:last-child]:justify-self-end`}
          >
            <div
              style={{
                fontSize: `${itemTitleStyle.fontSize}px`,
                fontWeight: itemTitleStyle.fontWeight ? fontWeightMap[itemTitleStyle.fontWeight] : 600,
                lineHeight: itemTitleStyle.lineHeight,
              }}
            >
              {experience.company}
            </div>
            {centerSubtitle && (
              <motion.div className="text-subtitleFont" style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}>
                {experience.position}
              </motion.div>
            )}
            <div className="text-subtitleFont" style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}>{experience.date}</div>
          </motion.div>
        )}
        {experience.position && !centerSubtitle && (
          <motion.div 
            className="text-subtitleFont" 
            style={{ 
              fontSize: `${itemSubtitleStyle.fontSize}px`,
              marginTop: itemSubtitleStyle.marginTop ? `${itemSubtitleStyle.marginTop}px` : undefined,
            }}
          >
            {experience.position}
          </motion.div>
        )}
        {experience.details && (
          <motion.div
            className="mt-2 text-baseFont"
            dangerouslySetInnerHTML={{
              __html: normalizeRichTextContent(experience.details),
            }}
            style={{
              fontSize: `${bodyStyle.fontSize}px`,
              lineHeight: bodyStyle.lineHeight,
              marginTop: bodyStyle.marginTop ? `${bodyStyle.marginTop}px` : undefined,
            }}
          ></motion.div>
        )}
      </motion.div>
    );
  }
);

ExperienceItem.displayName = "ExperienceItem";

const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  experiences,
  globalSettings,
  showTitle = true,
}) => {
  const { setActiveSection } = useResumeStore();

  const visibleExperiences = experiences?.filter(
    (experience) => experience.visible
  );

  return (
    <motion.div
      className="hover:cursor-pointer hover:bg-gray-100 rounded-md transition-all duration-300 ease-in-out hover:shadow-md"
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`,
      }}
      onClick={() => {
        setActiveSection("experience");
      }}
    >
      {showTitle && (
        <SectionTitle type="experience" globalSettings={globalSettings} />
      )}
      <div>
        <AnimatePresence mode="popLayout">
          {visibleExperiences?.map((experience) => (
            <ExperienceItem
              key={experience.id}
              experience={experience}
              globalSettings={globalSettings}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ExperienceSection;
