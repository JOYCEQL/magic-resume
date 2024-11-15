import { motion } from "framer-motion";
import { Education, GlobalSettings } from "@/types/resume";
import { SectionTitle } from "./SectionTitle";

interface EducationSectionProps {
  education: Education[];
  globalSettings: GlobalSettings | undefined;
  themeColor: string;
}

export function EducationSection({
  education,
  globalSettings,
  themeColor
}: EducationSectionProps) {
  return (
    <motion.div
      layout
      className="space-y-4"
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`
      }}
    >
      <SectionTitle
        title="教育经历"
        themeColor={themeColor}
        globalSettings={globalSettings}
      />
      {education.map((edu) => (
        <div
          key={edu.id}
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
                {edu.school}
              </h4>
              <p
                className="text-gray-600"
                style={{
                  fontSize: `${globalSettings?.baseFontSize || 14}px`
                }}
              >
                {edu.degree}
              </p>
            </div>
            <span
              className="text-gray-600"
              style={{
                fontSize: `${globalSettings?.baseFontSize || 14}px`
              }}
            >
              {edu.date}
            </span>
          </div>
          <p
            className="text-gray-600"
            style={{
              fontSize: `${globalSettings?.baseFontSize || 14}px`,
              lineHeight: globalSettings?.lineHeight || 1.6
            }}
          >
            {edu.details}
          </p>
        </div>
      ))}
    </motion.div>
  );
}
