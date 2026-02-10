"use client";
import { AnimatePresence, motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { GlobalSettings, CustomItem } from "@/types/resume";
import { useResumeStore } from "@/store/useResumeStore";
import { normalizeRichTextContent } from "@/lib/richText";

interface CustomSectionProps {
  sectionId: string;
  title: string;
  items: CustomItem[];
  globalSettings?: GlobalSettings;
  showTitle?: boolean;
}

const CustomSection = ({
  sectionId,
  title,
  items,
  globalSettings,
  showTitle = true,
}: CustomSectionProps) => {
  const { setActiveSection } = useResumeStore();
  const visibleItems = items?.filter((item) => {
    return item.visible && (item.title || item.description);
  });

  const centerSubtitle = globalSettings?.centerSubtitle;
  const gridColumns = centerSubtitle ? 3 : 2;

  return (
    <motion.div
      className="hover:cursor-pointer hover:bg-gray-100 rounded-md transition-all duration-300 ease-in-out hover:shadow-md"
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`,
      }}
      onClick={() => {
        setActiveSection(sectionId);
      }}
    >
      <SectionTitle
        title={title}
        type="custom"
        globalSettings={globalSettings}
        showTitle={showTitle}
      />
      <AnimatePresence mode="popLayout">
        {visibleItems.map((item) => (
          <motion.div
            key={item.id}
            layout="position"
            style={{
              marginTop: `${globalSettings?.paragraphSpacing}px`,
            }}
          >
            <motion.div
              layout="position"
              className="flex items-center gap-2"
            >
              <div className={`flex items-center gap-2 ${globalSettings?.flexibleHeaderLayout ? '' : 'flex-[1.5]'}`}>
                <h4
                  className="font-bold"
                  style={{
                    fontSize: `${globalSettings?.subheaderSize || 16}px`,
                  }}
                >
                  {item.title}
                </h4>
              </div>

              {centerSubtitle && (
                <motion.div
                  layout="position"
                  className={`text-subtitleFont ${globalSettings?.flexibleHeaderLayout ? 'ml-[16px]' : 'flex-1'}`}
                  style={{
                    fontSize: `${globalSettings?.subheaderSize || 16}px`,
                  }}
                >
                  {item.subtitle}
                </motion.div>
              )}

              <span
                className={`text-subtitleFont shrink-0 ${globalSettings?.flexibleHeaderLayout ? 'ml-auto' : 'flex-1 text-right'}`}
                style={{
                  fontSize: `${globalSettings?.subheaderSize || 16}px`,
                }}
              >
                {item.dateRange}
              </span>
            </motion.div>

            {!centerSubtitle && item.subtitle && (
              <motion.div
                layout="position"
                className="text-subtitleFont mt-1"
                style={{
                  fontSize: `${globalSettings?.subheaderSize || 16}px`,
                }}
              >
                {item.subtitle}
              </motion.div>
            )}

            {item.description && (
              <motion.div
                layout="position"
                className="mt-2 text-baseFont"
                style={{
                  fontSize: `${globalSettings?.baseFontSize || 14}px`,
                  lineHeight: globalSettings?.lineHeight || 1.6,
                }}
                dangerouslySetInnerHTML={{
                  __html: normalizeRichTextContent(item.description),
                }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default CustomSection;
