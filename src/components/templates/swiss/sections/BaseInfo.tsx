import React from "react";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { cn, formatDateString } from "@/lib/utils";
import { BasicInfo, getBorderRadiusValue, GlobalSettings } from "@/types/resume";
import { ResumeTemplate } from "@/types/template";
import SectionWrapper from "../../shared/SectionWrapper";
import { useTranslations, useLocale } from "@/i18n/compat/client";
import GithubContribution from "@/components/shared/GithubContribution";
import { getCustomFieldDisplayText, getCustomFieldHref, shouldShowCustomFieldLabelPrefix } from "@/lib/customField";

interface BaseInfoProps {
    basic: BasicInfo | undefined;
    globalSettings: GlobalSettings | undefined;
    template?: ResumeTemplate;
}

const BaseInfo = ({ basic = {} as BasicInfo, globalSettings, template }: BaseInfoProps) => {
    const t = useTranslations("workbench");
    const locale = useLocale();
    const useIconMode = globalSettings?.useIconMode ?? false;
    const layout = basic?.layout || "left";
    const themeColor = globalSettings?.themeColor || "#E31C24";

    const getIcon = (iconName: string | undefined) => {
        const IconComponent = Icons[iconName as keyof typeof Icons] as React.ElementType;
        return IconComponent ? <IconComponent className="h-3.5 w-3.5 shrink-0" style={{ color: themeColor }} /> : null;
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

    const nameField = basic.fieldOrder?.find((f) => f.key === "name") || { key: "name", label: "姓名", visible: true };
    const titleField = basic.fieldOrder?.find((f) => f.key === "title") || { key: "title", label: "职位", visible: true };

    const PhotoComponent = basic.photo && basic.photoConfig?.visible && (
        <motion.div layout="position" className="shrink-0">
            <div 
                style={{ 
                    width: `${basic.photoConfig?.width || 90}px`, 
                    height: `${basic.photoConfig?.height || 90}px`, 
                    borderRadius: getBorderRadiusValue(basic.photoConfig || { borderRadius: "none", customBorderRadius: 0 }), 
                    overflow: "hidden" 
                }}
                className="border-2 border-white shadow-md ring-2 ring-slate-100"
            >
                <img src={basic.photo} alt={`${basic.name}'s photo`} className="w-full h-full object-cover" />
            </div>
        </motion.div>
    );

    // 瑞士风格全新的不对称排版样式，完全基于 Framer Motion 实现丝滑的动态排版交互
    const layoutStyles = {
        left: {
            container: "flex flex-col gap-6 w-full items-start justify-start",
            headerRow: "flex items-center gap-6 w-full text-left",
            nameTitle: "flex flex-col min-w-0 flex-1 relative pl-5",
            accentBar: "absolute left-0 top-1.5 bottom-1.5 w-1 rounded-sm",
            cardWrapper: "flex flex-wrap gap-2.5 w-full justify-start mt-2"
        },
        right: {
            container: "flex flex-col gap-6 w-full items-end justify-start",
            headerRow: "flex flex-row-reverse items-center gap-6 w-full text-right",
            nameTitle: "flex flex-col min-w-0 flex-1 relative pr-5",
            accentBar: "absolute right-0 top-1.5 bottom-1.5 w-1 rounded-sm",
            cardWrapper: "flex flex-wrap gap-2.5 w-full justify-end mt-2"
        },
        center: {
            container: "flex flex-col gap-6 w-full items-center justify-start text-center",
            headerRow: "flex flex-col items-center gap-4 w-full",
            nameTitle: "flex flex-col items-center min-w-0 w-full relative pb-4",
            accentBar: "absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-sm",
            cardWrapper: "flex flex-wrap gap-2.5 w-full justify-center mt-2"
        },
    };

    const styles = layoutStyles[layout as keyof typeof layoutStyles] || layoutStyles.left;

    return (
        <SectionWrapper sectionId="basic">
            <div className={styles.container}>
                {/* 第一排：雕塑级姓名与职位锚点 */}
                <div className={styles.headerRow}>
                    {PhotoComponent}
                    <div className={styles.nameTitle}>
                        {/* 瑞士美学标志性几何侧边/底部高亮线，高灵动质感 */}
                        <motion.div 
                            key={`accent-${layout}`}
                            layout="position"
                            className={styles.accentBar}
                            style={{ backgroundColor: themeColor }}
                        />
                        {nameField.visible !== false && basic[nameField.key] && (
                            <motion.h1 
                                layout="position" 
                                className="font-black tracking-tight whitespace-normal break-normal [overflow-wrap:normal] leading-none text-slate-800" 
                                style={{ fontSize: "38px" }}
                            >
                                {basic[nameField.key] as string}
                            </motion.h1>
                        )}
                        {titleField.visible !== false && basic[titleField.key] && (
                            <motion.h2 
                                layout="position" 
                                className="whitespace-normal break-normal [overflow-wrap:normal] font-bold tracking-widest mt-2.5 text-slate-400 uppercase text-[12px]"
                            >
                                {basic[titleField.key] as string}
                            </motion.h2>
                        )}
                    </div>
                </div>

                {/* 第二排：自适应流式空气卡片群 (Fluid Flexible Capsule Cards) */}
                <motion.div 
                    layout="position" 
                    className={styles.cardWrapper}
                    style={{ fontSize: `${globalSettings?.baseFontSize || 13}px` }}
                >
                    {allFields.map((item) => {
                        const customFieldHref = item.custom && "href" in item && typeof item.href === "string" ? item.href : null;

                        return (
                            <motion.div 
                                key={item.key} 
                                layout="position"
                                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50/70 border border-slate-100 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all duration-300 min-w-0 max-w-full flex-initial"
                            >
                                {/* 图标 */}
                                <div className="shrink-0 group-hover:scale-110 transition-transform duration-300">
                                    {getIcon(item.icon)}
                                </div>

                                {/* 字段显示：非图标模式下带粗体前缀，长字符支持在小空间中完美安全折行，绝不重叠 */}
                                <div className="flex items-center gap-1.5 min-w-0 leading-tight">
                                    {!useIconMode && !item.custom && (
                                        <span className="shrink-0 font-extrabold text-[12px] text-slate-400 uppercase tracking-wider">
                                            {t(`basicPanel.basicFields.${item.key}`)}
                                        </span>
                                    )}
                                    {!useIconMode && item.custom && shouldShowCustomFieldLabelPrefix(item) && (
                                        <span className="shrink-0 font-extrabold text-[12px] text-slate-400 uppercase tracking-wider">
                                            {item.label}
                                        </span>
                                    )}
                                    
                                    {/* 实际内容值 */}
                                    {customFieldHref ? (
                                        <a 
                                            href={customFieldHref} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="font-medium text-slate-600 hover:text-slate-900 underline truncate break-all [overflow-wrap:anywhere]"
                                        >
                                            {item.value}
                                        </a>
                                    ) : item.key === "email" ? (
                                        <a 
                                            href={`mailto:${item.value}`} 
                                            className="font-medium text-slate-600 hover:text-slate-900 underline truncate break-all [overflow-wrap:anywhere]"
                                        >
                                            {item.value}
                                        </a>
                                    ) : (
                                        <span className="font-medium text-slate-600 break-all [overflow-wrap:anywhere]">
                                            {item.value}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
            {basic.githubContributionsVisible && (
                <GithubContribution className="mt-6 border border-slate-100 rounded-xl p-3 bg-slate-50/50" githubKey={basic.githubKey} username={basic.githubUseName} />
            )}
        </SectionWrapper>
    );
};

export default BaseInfo;
