"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Experience, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";

interface ExperienceSectionProps {
  experiences?: Experience[];
  globalSettings?: GlobalSettings;
}

interface ExperienceItemProps {
  experience: Experience;
  globalSettings?: GlobalSettings;
}

const ExperienceItem = React.forwardRef<HTMLDivElement, ExperienceItemProps>(
  ({ experience, globalSettings }, ref) => {
    return (
      <motion.div
        style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}
        layout
      >
        <motion.div
          layout="position"
          className="flex items-center justify-between"
        >
          <div className="font-medium text-baseFont">{experience.company}</div>
          {experience.date && <div>{experience.date}</div>}
        </motion.div>
        {experience.position && (
          <motion.div layout="position" className="font-medium text-baseFont">
            {experience.position}
          </motion.div>
        )}
        {experience.details && (
          <motion.div
            layout="position"
            dangerouslySetInnerHTML={{ __html: experience.details }}
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
}) => {
  if (!experiences?.length) return null;

  const visibleExperiences = experiences.filter(
    (experience) => experience.visible
  );

  return (
    <motion.div
      layout
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`,
      }}
    >
      <SectionTitle type="experience" globalSettings={globalSettings} />
      <div>
        <AnimatePresence mode="popLayout">
          {visibleExperiences.map((experience) => (
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
