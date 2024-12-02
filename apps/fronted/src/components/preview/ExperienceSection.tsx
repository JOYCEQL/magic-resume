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
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`
      }}
    >
      <SectionTitle
        type="experience"
        themeColor={themeColor}
        globalSettings={globalSettings}
      />
      {experience.map(
        (exp) =>
          exp.visible && (
            <div
              key={exp.id}
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
              <div
                className="text-gray-600"
                style={{
                  fontSize: `${globalSettings?.baseFontSize || 14}px`,
                  lineHeight: globalSettings?.lineHeight || 1.6
                }}
                dangerouslySetInnerHTML={{ __html: exp.details }}
              />
            </div>
          )
      )}
    </motion.div>
  );
}
