"use client";
import { motion } from "framer-motion";
import { GlobalSettings } from "@/types/resume";
import { SectionTitle } from "./SectionTitle";
import { CustomItem } from "@/types/resume";

interface CustomSectionProps {
  sectionId: string;
  title: string;
  items: CustomItem[];
  globalSettings: GlobalSettings | undefined;
  themeColor: string;
}

export function CustomSection({
  title,
  items,
  globalSettings,
  themeColor
}: CustomSectionProps) {
  const visibleItems = items.filter((item) => {
    return item.visible && (item.title || item.description);
  });

  return (
    <motion.div
      layout
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`
      }}
    >
      <SectionTitle
        title={title}
        type="custom"
        themeColor={themeColor}
        globalSettings={globalSettings}
      />
      {visibleItems.map((item) => (
        <div
          key={item.id}
          style={{
            marginTop: `${globalSettings?.paragraphSpacing}px`
          }}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div>
                <h4
                  className="font-medium text-gray-800"
                  style={{
                    fontSize: `${globalSettings?.subheaderSize || 16}px`
                  }}
                >
                  {item.title}
                </h4>
                <motion.div
                  layout
                  className={"text-gray-600"}
                  style={{
                    fontSize: `${globalSettings?.baseFontSize || 14}px`
                  }}
                >
                  {item.subtitle}
                </motion.div>
              </div>
            </div>
            {item.dateRange && (
              <span
                className="text-gray-600 shrink-0 ml-4"
                style={{
                  fontSize: `${globalSettings?.baseFontSize || 14}px`
                }}
              >
                {item.dateRange}
              </span>
            )}
          </div>
          {item.description && (
            <div
              className="text-gray-600 mt-1"
              style={{
                fontSize: `${globalSettings?.baseFontSize || 14}px`,
                lineHeight: globalSettings?.lineHeight || 1.6
              }}
              dangerouslySetInnerHTML={{ __html: item.description }}
            />
          )}
        </div>
      ))}
    </motion.div>
  );
}
