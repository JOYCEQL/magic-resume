import React from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { cn, formatDateString } from "@/lib/utils";
import { BasicInfo, getBorderRadiusValue, GlobalSettings } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";
import SectionWrapper from "../../shared/SectionWrapper";
import { useTranslations, useLocale } from "@/i18n/compat/client";
import { getCustomFieldDisplayText, getCustomFieldHref, shouldShowCustomFieldLabelPrefix } from "@/lib/customField";

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
    const layout = basic?.layout || "left";

    const getIcon = (iconName: string | undefined) => {
        const IconComponent = Icons[iconName as keyof typeof Icons] as React.ElementType;
        return IconComponent ? <IconComponent className="mt-[0.2em] h-4 w-4 shrink-0" /> : null;
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
        ...(basic.customFields?.filter((field) => field.visible !== false && Boolean(getCustomFieldDisplayText(field))).map((field) => ({
            key: field.id, value: getCustomFieldDisplayText(field), icon: field.icon, label: field.label, visible: true, custom: true, displayLabel: field.displayLabel, href: getCustomFieldHref(field),
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
        left: { container: "flex flex-col gap-3", header: "flex items-center gap-4", nameTitle: "text-left min-w-[10rem] max-w-full flex-1", fields: "w-full flex flex-col gap-2" },
        right: { container: "flex flex-col gap-3", header: "flex flex-row-reverse items-center gap-4", nameTitle: "text-right min-w-[10rem] max-w-full flex-1", fields: "w-full flex flex-col gap-2" },
        center: { container: "flex flex-col items-center gap-3", header: "flex flex-col items-center gap-4", nameTitle: "text-center min-w-0 max-w-full", fields: "w-full flex flex-col gap-2" },
    };

    const styles = layoutStyles[layout as keyof typeof layoutStyles] || layoutStyles.left;

    return (
        <SectionWrapper sectionId="basic">
            <div className={styles.container}>
                <div className={styles.header}>
                    {PhotoComponent}
                    <div className={`flex flex-col ${styles.nameTitle}`} style={{ color: "#fff" }}>
                        {nameField.visible !== false && basic[nameField.key] && (
                            <motion.h1 layout="position" className="font-bold whitespace-normal break-normal [overflow-wrap:normal]" style={{ fontSize: "30px", color: "#fff" }}>{basic[nameField.key] as string}</motion.h1>
                        )}
                        {titleField.visible !== false && basic[titleField.key] && (
                            <motion.h2 layout="position" className="whitespace-normal break-normal [overflow-wrap:normal]" style={{ fontSize: "18px", color: "#fff" }}>{basic[titleField.key] as string}</motion.h2>
                        )}
                    </div>
                </div>
                <motion.div layout="position" className={styles.fields}
                    style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, color: "#fff" }}>
                    {allFields.map((item) => {
                        const customFieldHref = item.custom && "href" in item && typeof item.href === "string" ? item.href : null;

                        return (
                        <motion.div key={item.key} className="flex min-w-0 items-start text-baseFont" style={{ width: "100%", color: "#fff" }}>
                            {useIconMode ? (
                                <div className="flex min-w-0 items-start gap-1" style={{ color: "#fff" }}>
                                    {getIcon(item.icon)}
                                    {item.key === "email" ? <a href={`mailto:${item.value}`} className="min-w-0 underline [overflow-wrap:anywhere]" style={{ color: "#fff" }}>{item.value}</a> : customFieldHref ? <a href={customFieldHref} target="_blank" rel="noopener noreferrer" className="min-w-0 underline [overflow-wrap:anywhere]" style={{ color: "#fff" }}>{item.value}</a> : <span className="min-w-0 [overflow-wrap:anywhere]" style={{ color: "#fff" }}>{item.value}</span>}
                                </div>
                            ) : (
                                <div className="flex min-w-0 items-start gap-2" style={{ color: "#fff" }}>
                                    {!item.custom && <span className="shrink-0" style={{ color: "#fff" }}>{t(`basicPanel.basicFields.${item.key}`)}:</span>}
                                    {item.custom && shouldShowCustomFieldLabelPrefix(item) && <span className="shrink-0" style={{ color: "#fff" }}>{item.label}:</span>}
                                    {customFieldHref ? <a href={customFieldHref} target="_blank" rel="noopener noreferrer" className="min-w-0 underline [overflow-wrap:anywhere]" suppressHydrationWarning style={{ color: "#fff" }}>{item.value}</a> : <span className="min-w-0 [overflow-wrap:anywhere]" suppressHydrationWarning style={{ color: "#fff" }}>{item.value}</span>}
                                </div>
                            )}
                        </motion.div>
                    )})}
                </motion.div>
            </div>
        </SectionWrapper>
    );
};

export default BaseInfo;
