import React from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BasicInfo,
  getBorderRadiusValue,
  GlobalSettings,
} from "@/types/resume";
import { ResumeTemplate } from "@/types/template";
import { useResumeStore } from "@/store/useResumeStore";
import { useTranslations } from "next-intl";

interface BaseInfoProps {
  basic: BasicInfo | undefined;
  globalSettings: GlobalSettings | undefined;
  template?: ResumeTemplate;
}

const BaseInfo = ({
  basic = {} as BasicInfo,
  globalSettings,
  template,
}: BaseInfoProps) => {
  const t = useTranslations("workbench");
  const { setActiveSection } = useResumeStore();
  const useIconMode = globalSettings?.useIconMode ?? false;
  const layout = basic?.layout || "left";

  const getIcon = (iconName: string | undefined) => {
    const IconComponent = Icons[
      iconName as keyof typeof Icons
    ] as React.ElementType;
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
  };

  const isModernTemplate = React.useMemo(() => {
    return template?.layout === "modern";
  }, [template]);

  const getOrderedFields = React.useMemo(() => {
    if (!basic.fieldOrder) {
      return [
        {
          key: "email",
          value: basic.email,
          icon: basic.icons?.email || "Mail",
          label: "电子邮箱",
          visible: true,
          custom: false,
        },
      ].filter((item) => Boolean(item.value && item.visible));
    }

    return basic.fieldOrder
      .filter(
        (field) =>
          field.visible !== false &&
          field.key !== "name" &&
          field.key !== "title"
      )
      .map((field) => ({
        key: field.key,
        value:
          field.key === "birthDate" && basic[field.key]
            ? new Date(basic[field.key] as string).toLocaleDateString()
            : (basic[field.key] as string),
        icon: basic.icons?.[field.key] || "User",
        label: field.label,
        visible: field.visible,
        custom: field.custom,
      }))
      .filter((item) => Boolean(item.value));
  }, [basic]);

  const allFields = [
    ...getOrderedFields,
    ...(basic.customFields
      ?.filter((field) => field.visible !== false)
      .map((field) => ({
        key: field.id,
        value: field.value,
        icon: field.icon,
        label: field.label,
        visible: true,
        custom: true,
      })) || []),
  ];

  const getNameField = () => {
    const nameField = basic.fieldOrder?.find(
      (field) => field.key === "name"
    ) || {
      key: "name",
      label: "姓名",
      visible: true,
    };
    return nameField.visible !== false ? nameField : null;
  };

  const getTitleField = () => {
    const titleField = basic.fieldOrder?.find(
      (field) => field.key === "title"
    ) || {
      key: "title",
      label: "职位",
      visible: true,
    };
    return titleField.visible !== false ? titleField : null;
  };

  const nameField = getNameField();
  const titleField = getTitleField();

  const PhotoComponent = basic.photo && basic.photoConfig?.visible && (
    <motion.div layout="position">
      <div
        style={{
          width: `${basic.photoConfig?.width || 100}px`,
          height: `${basic.photoConfig?.height || 100}px`,
          borderRadius: getBorderRadiusValue(
            basic.photoConfig || {
              borderRadius: "none",
              customBorderRadius: 0,
            }
          ),
          overflow: "hidden",
        }}
      >
        <img
          src={basic.photo}
          alt={`${basic.name}'s photo`}
          className="w-full h-full object-cover"
        />
      </div>
    </motion.div>
  );

  // 基础样式
  const baseContainerClass =
    "hover:cursor-pointer hover:bg-gray-100 rounded-md transition-all duration-300 ease-in-out hover:shadow-md";
  const baseFieldsClass = "";
  const baseFieldItemClass =
    "flex items-center whitespace-nowrap overflow-hidden text-baseFont";
  const baseNameTitleClass = "flex flex-col";

  // 左对齐布局样式
  const leftLayoutStyles = {
    container: "flex items-center justify-between gap-6",
    leftContent: "flex  items-center gap-6 ",
    fields: "grid grid-cols-2 gap-x-8 gap-y-2 justify-start",
    nameTitle: "text-left",
  };

  // 右对齐布局样式
  const rightLayoutStyles = {
    container: "flex items-center justify-between gap-6 flex-row-reverse",
    leftContent: "flex justify-end items-center gap-6 ",
    fields: "grid grid-cols-2 gap-x-8 gap-y-2 justify-start",
    nameTitle: "text-right",
  };

  // 居中布局样式
  const centerLayoutStyles = {
    container: "flex flex-col items-center gap-3",
    leftContent: "flex flex-col items-center gap-4",
    fields: "w-full flex justify-start items-center flex-wrap gap-3",
    nameTitle: "text-center",
  };

  // 根据布局选择样式
  const getLayoutStyles = () => {
    switch (layout) {
      case "right":
        return rightLayoutStyles;
      case "center":
        return centerLayoutStyles;
      default:
        return leftLayoutStyles;
    }
  };

  const layoutStyles = getLayoutStyles();

  const containerClass = cn(baseContainerClass, layoutStyles.container);
  const leftContentClass = cn(layoutStyles.leftContent);
  const fieldsContainerClass = cn(baseFieldsClass, layoutStyles.fields);
  const nameTitleClass = cn(baseNameTitleClass, layoutStyles.nameTitle);

  const NameTitleComponent = (
    <div className={nameTitleClass}>
      {nameField && basic[nameField.key] && (
        <motion.h1
          layout="position"
          className="font-bold"
          style={{
            fontSize: `30px`,
          }}
        >
          {basic[nameField.key] as string}
        </motion.h1>
      )}
      {titleField && basic[titleField.key] && (
        <motion.h2
          layout="position"
          style={{
            fontSize: `${globalSettings?.headerSize || 18}px`,
          }}
        >
          {basic[titleField.key] as string}
        </motion.h2>
      )}
    </div>
  );

  const FieldsComponent = (
    <motion.div
      layout="position"
      className={fieldsContainerClass}
      style={{
        fontSize: `${globalSettings?.baseFontSize || 14}px`,
        color: isModernTemplate ? "#fff" : "rgb(75, 85, 99)",
        maxWidth: layout === "center" ? "none" : "600px",
      }}
    >
      {allFields.map((item) => (
        <motion.div
          key={item.key}
          className={cn(baseFieldItemClass)}
          style={{
            width: isModernTemplate ? "100%" : "",
          }}
        >
          {useIconMode ? (
            <div className="flex items-center gap-1">
              {getIcon(item.icon)}
              <span>{item.value}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-hidden">
              {!item.custom && (
                <span>{t(`basicPanel.basicFields.${item.key}`)}:</span>
              )}
              {item.custom && <span>{item.label}:</span>}
              <span className="truncate" suppressHydrationWarning>
                {item.value}
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );

  return (
    <div className={containerClass} onClick={() => setActiveSection("basic")}>
      <div className={leftContentClass}>
        {PhotoComponent}
        {NameTitleComponent}
      </div>
      {FieldsComponent}
    </div>
  );
};

export default BaseInfo;
