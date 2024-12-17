"use client";
import { AnimatePresence, motion } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { GlobalSettings, CustomItem } from "@/types/resume";

interface CustomSectionProps {
  sectionId: string;
  title: string;
  items: CustomItem[];
  globalSettings: GlobalSettings | undefined;
}

const CustomSection = ({
  title,
  items,
  globalSettings,
}: CustomSectionProps) => {
  const visibleItems = items.filter((item) => {
    return item.visible && (item.title || item.description);
  });

  return (
    <motion.div
      layout
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`,
      }}
    >
      <SectionTitle
        title={title}
        type="custom"
        globalSettings={globalSettings}
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
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div>
                  <h4
                    className="font-semibold text-gray-800"
                    style={{
                      fontSize: `${globalSettings?.subheaderSize || 16}px`,
                    }}
                  >
                    {item.title}
                  </h4>
                  <motion.div
                    layout
                    className={"font-medium text-baseFont"}
                    style={{
                      fontSize: `${globalSettings?.baseFontSize || 14}px`,
                    }}
                  >
                    {item.subtitle}
                  </motion.div>
                </div>
              </div>
              {item.dateRange && (
                <span
                  className="text-baseFont shrink-0 ml-4"
                  style={{
                    fontSize: `${globalSettings?.baseFontSize || 14}px`,
                  }}
                >
                  {item.dateRange}
                </span>
              )}
            </div>
            {item.description && (
              <div
                className="text-baseFont mt-1"
                style={{
                  fontSize: `${globalSettings?.baseFontSize || 14}px`,
                  lineHeight: globalSettings?.lineHeight || 1.6,
                }}
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default CustomSection;
