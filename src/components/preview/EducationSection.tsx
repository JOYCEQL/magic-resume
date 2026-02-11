"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Education, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import { useResumeStore } from "@/store/useResumeStore";
import { useLocale } from "next-intl";
import { normalizeRichTextContent } from "@/lib/richText";
import { formatDateString } from "@/lib/utils";

interface EducationSectionProps {
  education?: Education[];
  globalSettings?: GlobalSettings;
  showTitle?: boolean;
}

const EducationSection = ({
  education,
  globalSettings,
  showTitle = true,
}: EducationSectionProps) => {
  const { setActiveSection } = useResumeStore();
  const locale = useLocale();
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
        showTitle={showTitle}
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
              className="flex items-center gap-2"
            >
              <div
                className={`font-bold ${globalSettings?.flexibleHeaderLayout ? '' : 'flex-1'}`}
                style={{
                  fontSize: `${globalSettings?.subheaderSize || 16}px`,
                }}
              >
                <span>{edu.school}</span>
              </div>

              {globalSettings?.centerSubtitle && (
                <motion.div
                  layout="position"
                  className={`text-subtitleFont ${globalSettings?.flexibleHeaderLayout ? 'ml-[16px]' : 'flex-1'}`}
                  style={{
                    fontSize: `${globalSettings?.subheaderSize || 16}px`,
                  }}
                >
                  {[edu.major, edu.degree].filter(Boolean).join(" · ")}
                  {edu.gpa && ` · GPA ${edu.gpa}`}
                </motion.div>
              )}

              <span
                className={`text-subtitleFont shrink-0 ${globalSettings?.flexibleHeaderLayout ? 'ml-auto' : 'flex-1 text-right'}`}
                suppressHydrationWarning
                style={{
                  fontSize: `${globalSettings?.subheaderSize || 16}px`,
                }}
              >
                {`${formatDateString(edu.startDate)} - ${formatDateString(
                  edu.endDate
                )}`}
              </span>
            </motion.div>

            {!globalSettings?.centerSubtitle && (
              <motion.div
                layout="position"
                className="text-subtitleFont mt-1"
                style={{
                  fontSize: `${globalSettings?.subheaderSize || 16}px`,
                }}
              >
                {[edu.major, edu.degree].filter(Boolean).join(" · ")}
                {edu.gpa && ` · GPA ${edu.gpa}`}
              </motion.div>
            )}

            {edu.description && (
              <motion.div
                layout="position"
                className="mt-2 text-baseFont"
                style={{
                  fontSize: `${globalSettings?.baseFontSize || 14}px`,
                  lineHeight: globalSettings?.lineHeight || 1.6,
                }}
                dangerouslySetInnerHTML={{
                  __html: normalizeRichTextContent(edu.description),
                }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default EducationSection;
