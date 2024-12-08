"use client";
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
  const visibleEducation = education.filter((edu) => edu.visible);
  return (
    <motion.div
      layout
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`
      }}
    >
      {/* <SectionTitle
        title="教育经历"
        themeColor={themeColor}
        globalSettings={globalSettings}
      /> */}

      <SectionTitle
        type="education"
        themeColor={themeColor}
        globalSettings={globalSettings}
      ></SectionTitle>
      {visibleEducation.map((edu) => (
        <div
          key={edu.id}
          style={{
            marginTop: `${globalSettings?.paragraphSpacing}px`
          }}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4
                  className="font-semibold text-gray-800"
                  style={{
                    fontSize: `${globalSettings?.subheaderSize || 16}px`
                  }}
                >
                  {edu.school}
                </h4>
                {edu.location && (
                  <span
                    className="text-baseFont"
                    style={{
                      fontSize: `${globalSettings?.baseFontSize || 14}px`
                    }}
                  >
                    · {edu.location}
                  </span>
                )}
              </div>
              <p
                className="font-medium  text-baseFont"
                style={{
                  fontSize: `${globalSettings?.baseFontSize || 14}px`
                }}
              >
                {[edu.major, edu.degree].filter(Boolean).join(" · ")}
                {edu.gpa && ` · GPA ${edu.gpa}`}
              </p>
            </div>
            <span
              className="text-baseFont shrink-0 ml-4"
              style={{
                fontSize: `${globalSettings?.baseFontSize || 14}px`
              }}
              suppressHydrationWarning
            >
              {`${new Date(edu.startDate).toLocaleDateString()} - ${new Date(edu.endDate).toLocaleDateString()}`}
            </span>
          </div>
          {edu.description && (
            <div
              className="text-baseFont"
              style={{
                fontSize: `${globalSettings?.baseFontSize || 14}px`,
                lineHeight: globalSettings?.lineHeight || 1.6
              }}
              dangerouslySetInnerHTML={{ __html: edu.description }}
            />
          )}
        </div>
      ))}
    </motion.div>
  );
}
