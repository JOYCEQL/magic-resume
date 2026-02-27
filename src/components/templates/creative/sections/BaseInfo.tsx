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
 * Creative template BaseInfo — white text, designed for the colored header block.
 */
const BaseInfo = ({ basic = {} as BasicInfo, globalSettings, template }: BaseInfoProps) => {
    const t = useTranslations("workbench");
    const locale = useLocale();
    const useIconMode = globalSettings?.useIconMode ?? false;
    const layout = basic?.layout || "left";

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

    const layoutStyles = {
        left: { container: "flex items-center justify-between gap-6", leftContent: "flex items-center gap-6", fields: "grid grid-cols-2 gap-x-8 gap-y-2 justify-start", nameTitle: "text-left" },
        right: { container: "flex items-center justify-between gap-6 flex-row-reverse", leftContent: "flex justify-end items-center gap-6", fields: "grid grid-cols-2 gap-x-8 gap-y-2 justify-start", nameTitle: "text-right" },
        center: { container: "flex flex-col items-center gap-3", leftContent: "flex flex-col items-center gap-4", fields: "w-full flex justify-start items-center flex-wrap gap-3", nameTitle: "text-center" },
    };

    const styles = layoutStyles[layout as keyof typeof layoutStyles] || layoutStyles.left;

    return (
        <SectionWrapper sectionId="basic">
            <div className={styles.container}>
                <div className={styles.leftContent}>
                    {PhotoComponent}
                    <div className={cn("flex flex-col", styles.nameTitle)} style={{ color: "#fff" }}>
                        {nameField.visible !== false && basic[nameField.key] && (
                            <motion.h1 layout="position" className="font-bold" style={{ fontSize: "30px", color: "#fff" }}>{basic[nameField.key] as string}</motion.h1>
                        )}
                        {titleField.visible !== false && basic[titleField.key] && (
                            <motion.h2 layout="position" style={{ fontSize: "18px", color: "#fff" }}>{basic[titleField.key] as string}</motion.h2>
                        )}
                    </div>
                </div>
                <motion.div layout="position" className={styles.fields}
                    style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, color: "#fff", maxWidth: layout === "center" ? "none" : "600px" }}>
                    {allFields.map((item) => (
                        <motion.div key={item.key} className="flex items-center whitespace-nowrap overflow-hidden text-baseFont" style={{ color: "#fff" }}>
                            {useIconMode ? (
                                <div className="flex items-center gap-1" style={{ color: "#fff" }}>
                                    {getIcon(item.icon)}
                                    {item.key === "email" ? <a href={`mailto:${item.value}`} className="underline" style={{ color: "#fff" }}>{item.value}</a> : <span style={{ color: "#fff" }}>{item.value}</span>}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 overflow-hidden" style={{ color: "#fff" }}>
                                    {!item.custom && <span style={{ color: "#fff" }}>{t(`basicPanel.basicFields.${item.key}`)}:</span>}
                                    {item.custom && <span style={{ color: "#fff" }}>{item.label}:</span>}
                                    <span className="truncate" suppressHydrationWarning style={{ color: "#fff" }}>{item.value}</span>
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
