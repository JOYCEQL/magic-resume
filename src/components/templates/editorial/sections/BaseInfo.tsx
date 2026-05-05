import React from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { BasicInfo, GlobalSettings, getBorderRadiusValue } from "@/types/resume";
import SectionWrapper from "../../shared/SectionWrapper";
import { formatDateString } from "@/lib/utils";
import { useLocale, useTranslations } from "@/i18n/compat/client";
import { getCustomFieldDisplayText, getCustomFieldHref, shouldShowCustomFieldLabelPrefix } from "@/lib/customField";

interface BaseInfoProps {
  basic: BasicInfo;
  globalSettings?: GlobalSettings;
}

const BaseInfo: React.FC<BaseInfoProps> = ({ basic, globalSettings }) => {
  const locale = useLocale();
  const t = useTranslations("workbench");

  const getOrderedFields = React.useMemo(() => {
    if (!basic.fieldOrder) {
      return [
        { key: "email", value: basic.email, custom: false, label: "" },
        { key: "phone", value: basic.phone, custom: false, label: "" },
        { key: "location", value: basic.location, custom: false, label: "" },
      ].filter((f) => !!f.value);
    }
    return basic.fieldOrder
      .filter((field) => field.visible !== false && field.key !== "name" && field.key !== "title")
      .map((field) => ({
        key: field.key,
        value: field.key === "birthDate" && basic[field.key] ? formatDateString(basic[field.key] as string, locale) : (basic[field.key] as string),
        label: field.label,
        custom: false,
      }))
      .filter((item) => !!item.value);
  }, [basic, locale]);

  const customFields =
    basic.customFields?.filter(
      (f) => f.visible !== false && Boolean(getCustomFieldDisplayText(f))
    ) || [];

  const allFields = [
    ...getOrderedFields,
    ...customFields.map((f) => ({
      key: f.id,
      value: getCustomFieldDisplayText(f),
      custom: true,
      label: f.label,
      icon: f.icon,
      displayLabel: f.displayLabel,
      href: getCustomFieldHref(f),
    })),
  ];

  const nameField = basic.fieldOrder?.find((f) => f.key === "name") || { visible: true };
  const titleField = basic.fieldOrder?.find((f) => f.key === "title") || { visible: true };

  const getIcon = (iconName: string | undefined) => {
    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ElementType;
    return IconComponent ? <IconComponent className="mt-[0.2em] h-3.5 w-3.5 shrink-0" /> : null;
  };

  const showPhoto = basic.photo && basic.photoConfig?.visible;

  return (
    <SectionWrapper sectionId="basic" className=" w-full">
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            {basic.name && nameField.visible !== false && (
              <motion.h1
                layout="position"
                className="font-bold tracking-widest whitespace-normal break-normal [overflow-wrap:normal] text-black"
                style={{ fontSize: `${(globalSettings?.headerSize || 20) * 2}px`, lineHeight: "1.1", marginBottom: "8px" }}
              >
                {basic.name}
              </motion.h1>
            )}
          </div>
          {showPhoto && (
            <motion.div layout="position" className="shrink-0">
              <div
                style={{
                  width: `${basic.photoConfig?.width || 100}px`,
                  height: `${basic.photoConfig?.height || 100}px`,
                  borderRadius: getBorderRadiusValue(basic.photoConfig || { borderRadius: "none", customBorderRadius: 0 }),
                  overflow: "hidden",
                }}
              >
                <img src={basic.photo} alt={`${basic.name}'s photo`} className="w-full h-full object-cover" />
              </div>
            </motion.div>
          )}
        </div>

        <div className="w-full h-[3px] my-4" style={{ backgroundColor: globalSettings?.themeColor || "#000" }} />

        <div className="flex justify-between items-start mt-10 w-full">
          {basic.title && titleField.visible !== false && (
            <div className="flex-1 min-w-[100px] shrink-0">
              <motion.h2
                layout="position"
                className="font-normal tracking-wide text-gray-700 whitespace-normal break-normal [overflow-wrap:normal]"
                style={{ fontSize: `${globalSettings?.subheaderSize || 16}px`, lineHeight: "1.3" }}
              >
                {basic.title}
              </motion.h2>
            </div>
          )}

          <motion.div layout="position" className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 uppercase tracking-[0.05em] text-gray-500 w-[80%] flex-shrink-0" style={{ fontSize: `${globalSettings?.baseFontSize || 14}px` }}>
            {allFields.map((item) => {
              const customFieldHref =
                item.custom && "href" in item && typeof item.href === "string"
                  ? item.href
                  : null;

              return (
                <div key={item.key} className="flex items-start gap-2">
                  {globalSettings?.useIconMode && (
                    <span className="inline-flex shrink-0 text-gray-400">
                      {getIcon(item.custom ? (item as any).icon : basic.icons?.[item.key as keyof typeof basic.icons])}
                    </span>
                  )}
                  <div className="min-w-0">
                    {item.key === "email" ? (
                      <a href={`mailto:${item.value}`} className="block min-w-0 transition-colors [overflow-wrap:anywhere] hover:text-black">
                        {globalSettings?.useIconMode ? "" : `${t(`basicPanel.basicFields.${item.key}`)}: `}
                        {item.value}
                      </a>
                    ) : item.key === "website" || item.key === "github" ? (
                      <a href={item.value.startsWith("http") ? item.value : `https://${item.value}`} className="block min-w-0 transition-colors [overflow-wrap:anywhere] hover:text-black">
                        {globalSettings?.useIconMode ? "" : `${item.label}: `}
                        {item.value.replace(/^https?:\/\//, "")}
                      </a>
                    ) : customFieldHref ? (
                      <a href={customFieldHref} target="_blank" rel="noopener noreferrer" className="block min-w-0 underline transition-colors [overflow-wrap:anywhere] hover:text-black">
                        {item.value}
                      </a>
                    ) : (
                      <span className="block min-w-0 [overflow-wrap:anywhere]">
                        {globalSettings?.useIconMode
                          ? ""
                          : item.custom
                            ? shouldShowCustomFieldLabelPrefix(item)
                              ? `${item.label}: `
                              : ""
                            : `${t(`basicPanel.basicFields.${item.key}`)}: `}
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default BaseInfo;
