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
      className="
      hover:cursor-pointer
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
            <motion.div
              layout="position"
              className={`grid grid-cols-${
                globalSettings?.centerSubtitle ? "3" : "2"
              } gap-2 items-center justify-items-start [&>*:last-child]:justify-self-end`}
            >
              <div className="font-bold text-baseFont flex items-center gap-2">
                <span>{edu.school}</span>
                {edu.location && (
                  <span className="text-subtitleFont">· {edu.location}</span>
                )}
              </div>

              {globalSettings?.centerSubtitle && (
                <motion.div layout="position" className="text-subtitleFont">
                  {[edu.major, edu.degree].filter(Boolean).join(" · ")}
                  {edu.gpa && ` · GPA ${edu.gpa}`}
                </motion.div>
              )}

              <span
                className="text-subtitleFont shrink-0"
                suppressHydrationWarning
              >
                {`${new Date(edu.startDate).toLocaleDateString()} - ${new Date(
                  edu.endDate
                ).toLocaleDateString()}`}
              </span>
            </motion.div>

            {!globalSettings?.centerSubtitle && (
              <motion.div layout="position" className="text-subtitleFont mt-1">
                {[edu.major, edu.degree].filter(Boolean).join(" · ")}
                {edu.gpa && ` · GPA ${edu.gpa}`}
              </motion.div>
            )}

            {edu.description && (
              <motion.div
                layout="position"
                className="mt-2"
                style={{
                  fontSize: `${globalSettings?.baseFontSize || 14}px`,
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
