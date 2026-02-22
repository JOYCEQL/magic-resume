"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Experience, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import { useResumeStore } from "@/store/useResumeStore";
import { normalizeRichTextContent } from "@/lib/richText";
import { formatDateString } from "@/lib/utils";
import { useLocale } from "@/i18n/compat/client";

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
    const flexLayout = globalSettings?.flexibleHeaderLayout;
    const gridColumns = centerSubtitle ? 3 : 2;
    const locale = useLocale();

    return (
      <motion.div
        style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}
        layout="position"
      >
        <motion.div
          className="flex items-center gap-2"
        >
          <div
            className={`font-bold ${flexLayout ? '' : 'flex-[1.5]'}`}
            style={{
              fontSize: `${globalSettings?.subheaderSize || 16}px`,
            }}
          >
            {experience.company}
          </div>
          {centerSubtitle && (
            <motion.div
              className={`text-subtitleFont ${flexLayout ? 'ml-[16px]' : 'flex-1'}`}
              style={{
                fontSize: `${globalSettings?.subheaderSize || 16}px`,
              }}
            >
              {experience.position}
            </motion.div>
          )}
          <div
            className={`text-subtitleFont shrink-0 ${flexLayout ? 'ml-auto' : 'flex-1 text-right'}`}
            style={{
              fontSize: `${globalSettings?.subheaderSize || 16}px`,
            }}
          >
            {formatDateString(experience.date, locale)}
          </div>
        </motion.div>
        {experience.position && !centerSubtitle && (
          <motion.div
            className="text-subtitleFont"
            style={{
              fontSize: `${globalSettings?.subheaderSize || 16}px`,
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
              fontSize: `${globalSettings?.baseFontSize || 14}px`,
              lineHeight: globalSettings?.lineHeight || 1.6,
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
