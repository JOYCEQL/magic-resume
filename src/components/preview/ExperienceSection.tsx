"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Experience, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import { useResumeStore } from "@/store/useResumeStore";

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
    const gridColumns = centerSubtitle ? 3 : 2;

    return (
      <motion.div
        style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}
        layout="position"
      >
        <motion.div
          className={`grid grid-cols-${gridColumns} gap-2 items-center justify-items-start [&>*:last-child]:justify-self-end`}
        >
          <div
            className="font-bold"
            style={{
              fontSize: `${globalSettings?.subheaderSize || 16}px`,
            }}
          >
            {experience.company}
          </div>
          {experience.position && centerSubtitle && (
            <motion.div className="text-subtitleFont">
              {experience.position}
            </motion.div>
          )}
          {experience.date && (
            <div className="text-subtitleFont">{experience.date}</div>
          )}
        </motion.div>
        {experience.position && !centerSubtitle && (
          <motion.div className="text-subtitleFont">
            {experience.position}
          </motion.div>
        )}
        {experience.details && (
          <motion.div
            className="mt-2 text-baseFont"
            dangerouslySetInnerHTML={{ __html: experience.details }}
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
