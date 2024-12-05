"use client";
import React from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import {
  BasicInfo,
  getBorderRadiusValue,
  GlobalSettings
} from "@/types/resume";

interface BaseInfoProps {
  basic: BasicInfo;
  globalSettings: GlobalSettings | undefined;
}

export function BaseInfo({ basic, globalSettings }: BaseInfoProps) {
  const useIconMode = globalSettings?.useIconMode ?? false;

  const getIcon = (iconName: string) => {
    const IconComponent = Icons[
      iconName as keyof typeof Icons
    ] as React.ElementType;
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
  };

  const getOrderedFields = React.useMemo(() => {
    if (!basic.fieldOrder) {
      return [
        {
          key: "email",
          value: basic.email,
          icon: basic.icons?.email || "Mail",
          label: "电子邮箱",
          visible: true
        }
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
        visible: field.visible
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
        visible: true
      })) || [])
  ];

  const getNameField = () => {
    const nameField = basic.fieldOrder?.find(
      (field) => field.key === "name"
    ) || {
      key: "name",
      label: "姓名",
      visible: true
    };
    return nameField.visible !== false ? nameField : null;
  };

  const getTitleField = () => {
    const titleField = basic.fieldOrder?.find(
      (field) => field.key === "title"
    ) || {
      key: "title",
      label: "职位",
      visible: true
    };
    return titleField.visible !== false ? titleField : null;
  };

  const nameField = getNameField();
  const titleField = getTitleField();

  return (
    <div className="text-center space-y-4">
      {/* 头像部分 */}
      {basic.photo && basic.photoConfig?.visible && (
        <motion.div layout="position" className="flex justify-center">
          <div
            style={{
              width: `${basic.photoConfig?.width || 100}px`,
              height: `${basic.photoConfig?.height || 100}px`,
              borderRadius: getBorderRadiusValue(
                basic.photoConfig || {
                  borderRadius: "none",
                  customBorderRadius: 0
                }
              ),
              overflow: "hidden"
            }}
          >
            <img
              src={basic.photo}
              alt={`${basic.name}'s photo`}
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>
      )}

      {/* 姓名 - 仅在可见时显示 */}
      {nameField && basic[nameField.key] && (
        <motion.h1
          layout="position"
          className="font-bold text-gray-900"
          style={{
            fontSize: `${(globalSettings?.headerSize || 24) * 1.5}px`
          }}
        >
          {basic[nameField.key] as string}
        </motion.h1>
      )}

      {/* 职位 - 仅在可见时显示 */}
      {titleField && basic[titleField.key] && (
        <motion.h2
          layout="position"
          className="text-gray-600"
          style={{
            fontSize: `${globalSettings?.subheaderSize || 16}px`
          }}
        >
          {basic[titleField.key] as string}
        </motion.h2>
      )}

      {/* 其他字段 */}
      <motion.div
        layout="position"
        className="flex justify-center items-center flex-wrap gap-3"
        style={{
          fontSize: `${globalSettings?.baseFontSize || 14}px`,
          color: "rgb(75, 85, 99)"
        }}
      >
        {allFields.map((item, index) => (
          <motion.div key={item.key} className="flex items-center">
            {useIconMode ? (
              <span className="flex items-center gap-1">
                {getIcon(item.icon)}
                <span>{item.value}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="text-gray-500">{item.label}:</span>
                <span suppressHydrationWarning>{item.value}</span>
              </span>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
