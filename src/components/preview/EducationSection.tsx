"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Education, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import { useResumeStore } from "@/store/useResumeStore";
import { useLocale } from "next-intl";
import { normalizeRichTextContent } from "@/lib/richText";
import { getRegionStyle } from "@/config/textStyles";

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

  const itemTitleStyle = getRegionStyle('itemTitle', globalSettings?.regionStyles);
  const itemSubtitleStyle = getRegionStyle('itemSubtitle', globalSettings?.regionStyles);
  const bodyStyle = getRegionStyle('body', globalSettings?.regionStyles);

  const fontWeightMap: Record<string, number> = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  };
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
              marginTop: `${itemTitleStyle.marginTop || 8}px`,
            }}
          >
            {globalSettings?.centerSubtitle && globalSettings?.subtitleGap ? (
              <motion.div
                layout="position"
                className={`flex items-center justify-between`}
              >
                <div className="flex items-center">
                  <div
                    style={{
                      fontSize: `${itemTitleStyle.fontSize}px`,
                      fontWeight: itemTitleStyle.fontWeight ? fontWeightMap[itemTitleStyle.fontWeight] : 600,
                      lineHeight: itemTitleStyle.lineHeight,
                    }}
                  >
                    <span>{edu.school}</span>
                  </div>
                  <motion.div 
                    layout="position" 
                    className="text-subtitleFont"
                    style={{ marginLeft: '16px', fontSize: `${itemSubtitleStyle.fontSize}px`, lineHeight: itemSubtitleStyle.lineHeight }}
                  >
                    {[edu.major, edu.degree].filter(Boolean).join(" · ")}
                    {edu.gpa && ` · GPA ${edu.gpa}`}
                  </motion.div>
                </div>

                <span
                  className="text-subtitleFont shrink-0"
                  style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}
                  suppressHydrationWarning
                >
                  {`${new Date(edu.startDate).toLocaleDateString(
                    locale
                  )} - ${new Date(edu.endDate).toLocaleDateString(locale)}`}
                </span>
              </motion.div>
            ) : (
              <motion.div
                layout="position"
                className={`grid grid-cols-${
                  globalSettings?.centerSubtitle ? "3" : "2"
                } gap-2 items-center justify-items-start [&>*:last-child]:justify-self-end`}
              >
                <div
                  style={{
                    fontSize: `${itemTitleStyle.fontSize}px`,
                    fontWeight: itemTitleStyle.fontWeight ? fontWeightMap[itemTitleStyle.fontWeight] : 600,
                    lineHeight: itemTitleStyle.lineHeight,
                  }}
                >
                  <span>{edu.school}</span>
                </div>

                {globalSettings?.centerSubtitle && (
                  <motion.div layout="position" className="text-subtitleFont" style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}>
                    {[edu.major, edu.degree].filter(Boolean).join(" · ")}
                    {edu.gpa && ` · GPA ${edu.gpa}`}
                  </motion.div>
                )}

                <span
                  className="text-subtitleFont shrink-0"
                  style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}
                  suppressHydrationWarning
                >
                  {`${new Date(edu.startDate).toLocaleDateString(
                    locale
                  )} - ${new Date(edu.endDate).toLocaleDateString(locale)}`}
                </span>
              </motion.div>
            )}

            {!globalSettings?.centerSubtitle && (
              <motion.div layout="position" className="text-subtitleFont mt-1" style={{ fontSize: `${itemSubtitleStyle.fontSize}px`, marginTop: itemSubtitleStyle.marginTop ? `${itemSubtitleStyle.marginTop}px` : undefined }}>
                {[edu.major, edu.degree].filter(Boolean).join(" · ")}
                {edu.gpa && ` · GPA ${edu.gpa}`}
              </motion.div>
            )}

            {edu.description && (
              <motion.div
                layout="position"
                className="mt-2 text-baseFont"
                style={{
                  fontSize: `${bodyStyle.fontSize}px`,
                  lineHeight: bodyStyle.lineHeight,
                  marginTop: bodyStyle.marginTop ? `${bodyStyle.marginTop}px` : undefined,
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
