"use client";
import { AnimatePresence, motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { GlobalSettings, CustomItem } from "@/types/resume";
import { useResumeStore } from "@/store/useResumeStore";
import { normalizeRichTextContent } from "@/lib/richText";
import { getRegionStyle } from "@/config/textStyles";

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
  const subtitleGap = globalSettings?.subtitleGap;
  const useOffsetLayout = centerSubtitle && subtitleGap;
  const gridColumns = centerSubtitle ? 3 : 2;

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
              marginTop: `${itemTitleStyle.marginTop || 8}px`,
            }}
          >
            {useOffsetLayout ? (
              <motion.div
                layout="position"
                className={`flex items-center justify-between`}
              >
                <div className="flex items-center">
                  <h4
                    style={{
                      fontSize: `${itemTitleStyle.fontSize}px`,
                      fontWeight: itemTitleStyle.fontWeight ? fontWeightMap[itemTitleStyle.fontWeight] : 600,
                      lineHeight: itemTitleStyle.lineHeight,
                    }}
                  >
                    {item.title}
                  </h4>
                  <motion.div 
                    layout="position" 
                    className="text-subtitleFont"
                    style={{ marginLeft: '16px', fontSize: `${itemSubtitleStyle.fontSize}px`, lineHeight: itemSubtitleStyle.lineHeight }}
                  >
                    {item.subtitle}
                  </motion.div>
                </div>

                <span className="text-subtitleFont shrink-0" style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}>
                  {item.dateRange}
                </span>
              </motion.div>
            ) : (
              <motion.div
                layout="position"
                className={`grid grid-cols-${gridColumns} gap-2 items-center justify-items-start [&>*:last-child]:justify-self-end`}
              >
                <div className="flex items-center gap-2">
                  <h4
                    style={{
                      fontSize: `${itemTitleStyle.fontSize}px`,
                      fontWeight: itemTitleStyle.fontWeight ? fontWeightMap[itemTitleStyle.fontWeight] : 600,
                      lineHeight: itemTitleStyle.lineHeight,
                    }}
                  >
                    {item.title}
                  </h4>
                </div>

                {centerSubtitle && (
                  <motion.div layout="position" className="text-subtitleFont" style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}>
                    {item.subtitle}
                  </motion.div>
                )}

                <span className="text-subtitleFont shrink-0" style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}>
                  {item.dateRange}
                </span>
              </motion.div>
            )}

            {!centerSubtitle && item.subtitle && (
              <motion.div layout="position" className="text-subtitleFont mt-1" style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}>
                {item.subtitle}
              </motion.div>
            )}

            {item.description && (
              <motion.div
                layout="position"
                className="mt-2 text-baseFont"
                style={{
                  fontSize: `${bodyStyle.fontSize}px`,
                  lineHeight: bodyStyle.lineHeight,
                  marginTop: bodyStyle.marginTop ? `${bodyStyle.marginTop}px` : undefined,
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
