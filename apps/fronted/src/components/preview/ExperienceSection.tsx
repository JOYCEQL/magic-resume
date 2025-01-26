"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Experience, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import { useResumeStore } from "@/store/useResumeStore";

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
          <div className="font-bold text-baseFont">{experience.company}</div>
          {experience.date && (
            <div className="text-subtitleFont">{experience.date}</div>
          )}
        </motion.div>
        {experience.position && (
          <motion.div layout="position" className="text-subtitleFont">
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
  const { setActiveSection } = useResumeStore();

  const visibleExperiences = experiences?.filter(
    (experience) => experience.visible
  );

  return (
    <motion.div
      className="hover:cursor-pointer hover:bg-gray-100 rounded-md transition-all duration-300 ease-in-out hover:shadow-md"
      layout
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`,
      }}
      onClick={() => {
        setActiveSection("experience");
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
