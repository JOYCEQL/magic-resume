import { motion } from "framer-motion";
import { Experience, GlobalSettings } from "@/types/resume";
import { SectionTitle } from "./SectionTitle";

interface ExperienceSectionProps {
  experience: Experience[];
  globalSettings: GlobalSettings | undefined;
  themeColor: string;
}

export function ExperienceSection({
  experience,
  globalSettings,
  themeColor
}: ExperienceSectionProps) {
  return (
    <motion.div
      layout
      className="space-y-4"
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`
      }}
    >
      <SectionTitle
        title="工作经验"
        themeColor={themeColor}
        globalSettings={globalSettings}
      />
      {experience.map((exp) => (
        <div
          key={exp.id}
          className="space-y-2"
          style={{
            marginTop: `${globalSettings?.paragraphSpacing}px`
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4
                className="font-medium text-gray-800"
                style={{
                  fontSize: `${globalSettings?.subheaderSize || 16}px`
                }}
              >
                {exp.company}
              </h4>
              <p
                className="text-gray-600"
                style={{
                  fontSize: `${globalSettings?.baseFontSize || 14}px`
                }}
              >
                {exp.position}
              </p>
            </div>
            <span
              className="text-gray-600"
              style={{
                fontSize: `${globalSettings?.baseFontSize || 14}px`
              }}
            >
              {exp.date}
            </span>
          </div>
          <p
            className="text-gray-600"
            style={{
              fontSize: `${globalSettings?.baseFontSize || 14}px`,
              lineHeight: globalSettings?.lineHeight || 1.6
            }}
          >
            {exp.details}
          </p>
        </div>
      ))}
    </motion.div>
  );
}
