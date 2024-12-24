"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Education, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import { useResumeStore } from "@/store/useResumeStore";
interface EducationSectionProps {
  education: Education[];
  globalSettings: GlobalSettings | undefined;
}

const EducationSection = ({
  education,
  globalSettings,
}: EducationSectionProps) => {
  const { setActiveSection } = useResumeStore();
  const visibleEducation = education?.filter((edu) => edu.visible);
  return (
    <motion.div
      className="hover:cursor-pointer
      hover:bg-gray-100
      rounded-md
      transition-all
      duration-300
      ease-in-out
      hover:shadow-md"
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`,
      }}
      onClick={() => {
        setActiveSection("education");
      }}
    >
      <SectionTitle
        type="education"
        globalSettings={globalSettings}
      ></SectionTitle>
      <AnimatePresence mode="popLayout">
        {visibleEducation?.map((edu) => (
          <motion.div
            layout="position"
            key={edu.id}
            style={{
              marginTop: `${globalSettings?.paragraphSpacing}px`,
            }}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4
                    className="font-semibold text-gray-800"
                    style={{
                      fontSize: `${globalSettings?.subheaderSize || 16}px`,
                    }}
                  >
                    {edu.school}
                  </h4>
                  {edu.location && (
                    <span
                      className="text-baseFont"
                      style={{
                        fontSize: `${globalSettings?.baseFontSize || 14}px`,
                      }}
                    >
                      · {edu.location}
                    </span>
                  )}
                </div>
                <p
                  className="font-medium  text-baseFont"
                  style={{
                    fontSize: `${globalSettings?.baseFontSize || 14}px`,
                  }}
                >
                  {[edu.major, edu.degree].filter(Boolean).join(" · ")}
                  {edu.gpa && ` · GPA ${edu.gpa}`}
                </p>
              </div>
              <span
                className="text-baseFont shrink-0 ml-4"
                style={{
                  fontSize: `${globalSettings?.baseFontSize || 14}px`,
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
                  lineHeight: globalSettings?.lineHeight || 1.6,
                }}
                dangerouslySetInnerHTML={{ __html: edu.description }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default EducationSection;
