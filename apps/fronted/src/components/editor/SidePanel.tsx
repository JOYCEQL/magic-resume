"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Layout, Type, SpaceIcon, Palette } from "lucide-react";
import debounce from "lodash/debounce";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LayoutSetting from "./layout/LayoutSetting";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import { THEME_COLORS } from "@/types/resume";

const fontOptions = [
  { value: "sans", label: "无衬线体" },
  { value: "serif", label: "衬线体" },
  { value: "mono", label: "等宽体" },
];

const lineHeightOptions = [
  { value: "normal", label: "默认" },
  { value: "relaxed", label: "适中" },
  { value: "loose", label: "宽松" },
];

function SettingCard({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "border shadow-sm",
        "dark:bg-neutral-900 dark:border-neutral-800 dark:shadow-neutral-900/50",
        "bg-white border-gray-100 shadow-gray-100/50"
      )}
    >
      <CardHeader className="p-4 pb-0">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Icon
            className={cn("w-4 h-4 text-gray-600", "dark:text-neutral-300")}
          />
          <span className={cn("dark:text-neutral-200", "text-gray-700")}>
            {title}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

export function SidePanel() {
  const {
    activeResume,
    setActiveSection,
    toggleSectionVisibility,
    updateGlobalSettings,
    updateMenuSections,
    setThemeColor,
    reorderSections,
    addCustomData,
  } = useResumeStore();
  const {
    menuSections = [],
    globalSettings = {},
    activeSection,
  } = activeResume || {};

  const { themeColor } = globalSettings;
  const t = useTranslations('workbench.sidePanel');

  const fontOptions = [
    { value: "sans", label: t('typography.font.sans') },
    { value: "serif", label: t('typography.font.serif') },
    { value: "mono", label: t('typography.font.mono') },
  ];

  const lineHeightOptions = [
    { value: "normal", label: t('typography.lineHeight.normal') },
    { value: "relaxed", label: t('typography.lineHeight.relaxed') },
    { value: "loose", label: t('typography.lineHeight.loose') },
  ];

  const debouncedSetColor = useMemo(
    () =>
      debounce((value) => {
        setThemeColor(value);
      }, 100),
    []
  );

  const generateCustomSectionId = (menuSections: any[]) => {
    const customSections = menuSections.filter((s) =>
      s.id.startsWith("custom")
    );
    const nextNum = customSections.length + 1;
    return `custom-${nextNum}`;
  };

  const handleCreateSection = () => {
    const sectionId = generateCustomSectionId(menuSections);
    const newSection = {
      id: sectionId,
      title: sectionId,
      icon: "➕",
      enabled: true,
      order: menuSections.length,
    };

    updateMenuSections([...menuSections, newSection]);
    addCustomData(sectionId);
  };
  return (
    <motion.div
      className={cn(
        "w-[80] border-r overflow-y-auto",
        "dark:bg-neutral-950 dark:border-neutral-800",
        "bg-gray-50 border-gray-100"
      )}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      <div className="p-4 space-y-4">
        <SettingCard icon={Layout} title={t('layout.title')}>
          <LayoutSetting
            menuSections={menuSections}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            toggleSectionVisibility={toggleSectionVisibility}
            updateMenuSections={updateMenuSections}
            reorderSections={reorderSections}
          />

          <div className="space-y-2  py-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCreateSection}
              className="flex justify-center w-full rounded-lg items-center gap-2 py-2 px-3  text-sm font-medium text-primary bg-indigo-50"
            >
              {t('layout.addCustomSection')}
            </motion.button>
          </div>
        </SettingCard>

        {/* 主题色设置  */}
        <SettingCard icon={Palette} title={t('theme.title')}>
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2">
              {THEME_COLORS.map((presetTheme) => (
                <button
                  key={presetTheme}
                  className={cn(
                    "relative group aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200",
                    themeColor === presetTheme
                      ? "border-black dark:border-white"
                      : "dark:border-neutral-800 dark:hover:border-neutral-700 border-gray-100 hover:border-gray-200"
                  )}
                  onClick={() => setThemeColor(presetTheme)}
                >
                  {/* 颜色展示 */}
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: presetTheme }}
                  />

                  {/* 选中指示器 */}
                  {themeColor === presetTheme && (
                    <motion.div
                      layoutId="theme-selected"
                      className="absolute inset-0 flex items-center justify-center bg-black/20 dark:bg-white/20"
                      initial={false}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-white dark:bg-black" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('theme.custom')}
              </div>
              <motion.input
                type="color"
                onChange={(e) => debouncedSetColor(e.target.value)}
                className="w-[40px] h-[40px] rounded-lg cursor-pointer overflow-hidden hover:scale-105 transition-transform"
              />
            </div>
          </div>
        </SettingCard>

        {/* 排版设置 */}
        <SettingCard icon={Type} title={t('typography.title')}>
          <div className="space-y-6">
            {/* <div className="space-y-2">
              <Label className="text-gray-600 dark:text-neutral-300">
                {t('typography.font.title')}
              </Label>
              <Select
                value={globalSettings?.fontFamily}
                onValueChange={(value) =>
                  updateGlobalSettings?.({ fontFamily: value })
                }
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <SelectTrigger className="border border-gray-200 bg-white text-gray-700 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                </motion.div>
                <SelectContent
                  className={cn(
                    "dark:bg-neutral-900 dark:border-neutral-800 text-white",
                    "bg-white border-gray-200"
                  )}
                >
                  {fontOptions.map((font) => (
                    <SelectItem
                      key={font.value}
                      value={font.value}
                      className="cursor-pointer transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
                    >
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/* 行高选择 */}
            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-neutral-300">
                {t('typography.lineHeight.title')}
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[globalSettings?.lineHeight || 1.5]}
                  min={1}
                  max={2}
                  step={0.1}
                  onValueChange={([value]) =>
                    updateGlobalSettings?.({ lineHeight: value })
                  }
                />
                <span className="min-w-[3ch] text-sm text-gray-600 dark:text-neutral-300">
                  {globalSettings?.lineHeight}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-neutral-300">
                {t('typography.baseFontSize.title')}
              </Label>
              <Select
                value={globalSettings?.baseFontSize?.toString()}
                onValueChange={(value) =>
                  updateGlobalSettings?.({ baseFontSize: parseInt(value) })
                }
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <SelectTrigger className="border border-gray-200 bg-white text-gray-700 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                </motion.div>
                <SelectContent
                  className={cn(
                    "dark:bg-neutral-900 dark:border-neutral-800 dark:text-white",
                    "bg-white border-gray-200"
                  )}
                >
                  {[12, 13, 14, 15, 16, 18, 20, 24].map((size) => (
                    <SelectItem
                      key={size}
                      value={size.toString()}
                      className="cursor-pointer transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
                    >
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-neutral-300">
                {t('typography.headerSize.title')}
              </Label>
              <Select
                value={globalSettings?.headerSize?.toString()}
                onValueChange={(value) =>
                  updateGlobalSettings?.({ headerSize: parseInt(value) })
                }
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <SelectTrigger className="border border-gray-200 bg-white text-gray-700 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                </motion.div>
                <SelectContent
                  className={cn(
                    "dark:bg-neutral-900 dark:border-neutral-800 dark:text-white",
                    "bg-white border-gray-200"
                  )}
                >
                  {[12, 13, 14, 15, 16, 18, 20, 24].map((size) => (
                    <SelectItem
                      key={size}
                      value={size.toString()}
                      className="cursor-pointer transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
                    >
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-neutral-300">
                {t('typography.subheaderSize.title')}
              </Label>
              <Select
                value={globalSettings?.subheaderSize?.toString()}
                onValueChange={(value) =>
                  updateGlobalSettings?.({ subheaderSize: parseInt(value) })
                }
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <SelectTrigger className="border border-gray-200 bg-white text-gray-700 transition-colors dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                </motion.div>
                <SelectContent
                  className={cn(
                    "dark:bg-neutral-900 dark:border-neutral-800 dark:text-white",
                    "bg-white border-gray-200"
                  )}
                >
                  {[12, 13, 14, 15, 16, 18, 20, 24].map((size) => (
                    <SelectItem
                      key={size}
                      value={size.toString()}
                      className="cursor-pointer transition-colors hover:bg-gray-100 focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
                    >
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </SettingCard>

        {/* 间距设置 */}
        <SettingCard icon={SpaceIcon} title={t('spacing.title')}>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-neutral-300">
                {t('spacing.pagePadding.title')}
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[globalSettings?.pagePadding || 0]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([value]) =>
                    updateGlobalSettings?.({ pagePadding: value })
                  }
                />
                <span className="min-w-[3ch] text-sm text-gray-600 dark:text-neutral-300">
                  {globalSettings?.pagePadding}px
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-neutral-300">
                {t('spacing.sectionSpacing.title')}
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[globalSettings?.sectionSpacing || 0]}
                  min={1}
                  max={100}
                  step={1}
                  onValueChange={([value]) =>
                    updateGlobalSettings?.({ sectionSpacing: value })
                  }
                />
                <span className="min-w-[3ch] text-sm text-gray-600 dark:text-neutral-300">
                  {globalSettings?.sectionSpacing}px
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-neutral-300">
                {t('spacing.paragraphSpacing.title')}
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[globalSettings?.paragraphSpacing || 0]}
                  min={1}
                  step={0.1}
                  onValueChange={([value]) =>
                    updateGlobalSettings?.({ paragraphSpacing: value })
                  }
                />
                <span className="min-w-[3ch] text-sm text-gray-600 dark:text-neutral-300">
                  {globalSettings?.paragraphSpacing}px
                </span>
              </div>
            </div>
          </div>
        </SettingCard>

        {/* 模式设置 */}
        <SettingCard icon={SpaceIcon} title={t('mode.title')}>
          <div className="space-y-2">
            <Label className="text-gray-600 dark:text-neutral-300">
              {t('mode.useIconMode.title')}
            </Label>
            <div className="flex items-center gap-4">
              <Switch
                checked={globalSettings.useIconMode}
                onCheckedChange={(checked) =>
                  updateGlobalSettings({
                    useIconMode: checked,
                  })
                }
              />
            </div>
          </div>
        </SettingCard>
      </div>
    </motion.div>
  );
}
