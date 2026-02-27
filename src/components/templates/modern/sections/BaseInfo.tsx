import React from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { cn, formatDateString } from "@/lib/utils";
import { BasicInfo, getBorderRadiusValue, GlobalSettings } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";
import SectionWrapper from "../../shared/SectionWrapper";
import { useTranslations, useLocale } from "@/i18n/compat/client";

interface BaseInfoProps {
    basic: BasicInfo | undefined;
    globalSettings: GlobalSettings | undefined;
    template?: ResumeTemplate;
}

/**
 * Modern template BaseInfo — designed for sidebar (white text on theme color background).
 */
const BaseInfo = ({ basic = {} as BasicInfo, globalSettings, template }: BaseInfoProps) => {
    const t = useTranslations("workbench");
    const locale = useLocale();
    const useIconMode = globalSettings?.useIconMode ?? false;

    const getIcon = (iconName: string | undefined) => {
        const IconComponent = Icons[iconName as keyof typeof Icons] as React.ElementType;
        return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
    };

    const getOrderedFields = React.useMemo(() => {
        if (!basic.fieldOrder) {
            return [{ key: "email", value: basic.email, icon: basic.icons?.email || "Mail", label: "电子邮箱", visible: true, custom: false }]
                .filter((item) => Boolean(item.value && item.visible));
        }
        return basic.fieldOrder
            .filter((field) => field.visible !== false && field.key !== "name" && field.key !== "title")
            .map((field) => ({
                key: field.key, value: field.key === "birthDate" && basic[field.key] ? formatDateString(basic[field.key] as string, locale) : (basic[field.key] as string),
                icon: basic.icons?.[field.key] || "User", label: field.label, visible: field.visible, custom: field.custom,
            }))
            .filter((item) => Boolean(item.value));
    }, [basic]);

    const allFields = [
        ...getOrderedFields,
        ...(basic.customFields?.filter((field) => field.visible !== false).map((field) => ({
            key: field.id, value: field.value, icon: field.icon, label: field.label, visible: true, custom: true,
        })) || []),
    ];

    const nameField = basic.fieldOrder?.find((f) => f.key === "name") || { key: "name", visible: true };
    const titleField = basic.fieldOrder?.find((f) => f.key === "title") || { key: "title", visible: true };

    const PhotoComponent = basic.photo && basic.photoConfig?.visible && (
        <motion.div layout="position">
            <div style={{ width: `${basic.photoConfig?.width || 100}px`, height: `${basic.photoConfig?.height || 100}px`, borderRadius: getBorderRadiusValue(basic.photoConfig || { borderRadius: "none", customBorderRadius: 0 }), overflow: "hidden" }}>
                <img src={basic.photo} alt={`${basic.name}'s photo`} className="w-full h-full object-cover" />
            </div>
        </motion.div>
    );

    return (
        <SectionWrapper sectionId="basic">
            <div className="flex flex-col items-center gap-3">
                <div className="flex flex-col items-center gap-4">
                    {PhotoComponent}
                    <div className="flex flex-col text-center">
                        {nameField.visible !== false && basic[nameField.key] && (
                            <motion.h1 layout="position" className="font-bold" style={{ fontSize: "30px" }}>{basic[nameField.key] as string}</motion.h1>
                        )}
                        {titleField.visible !== false && basic[titleField.key] && (
                            <motion.h2 layout="position" style={{ fontSize: "18px" }}>{basic[titleField.key] as string}</motion.h2>
                        )}
                    </div>
                </div>
                <motion.div layout="position" className="w-full flex flex-col gap-2"
                    style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, color: "#fff" }}>
                    {allFields.map((item) => (
                        <motion.div key={item.key} className="flex items-center whitespace-nowrap overflow-hidden text-baseFont text-[#fff]" style={{ width: "100%" }}>
                            {useIconMode ? (
                                <div className="flex items-center gap-1">
                                    {getIcon(item.icon)}
                                    {item.key === "email" ? <a href={`mailto:${item.value}`} className="underline">{item.value}</a> : <span>{item.value}</span>}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {!item.custom && <span>{t(`basicPanel.basicFields.${item.key}`)}:</span>}
                                    {item.custom && <span>{item.label}:</span>}
                                    <span className="truncate" suppressHydrationWarning>{item.value}</span>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </SectionWrapper>
    );
};

export default BaseInfo;
