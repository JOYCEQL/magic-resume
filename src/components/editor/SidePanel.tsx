import { useMemo } from "react";
import { motion } from "framer-motion";
import { Layout, Type, SpaceIcon, Palette, Zap } from "lucide-react";
import debounce from "lodash/debounce";
import { useTranslations } from "@/i18n/compat/client";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LayoutSetting from "./layout/LayoutSetting";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import { THEME_COLORS, MenuSection } from "@/types/resume";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus } from "lucide-react";
import { STANDARD_MODULES } from "@/config/modules";
import { DEFAULT_TEMPLATES } from "@/config";
import { getFontOptions, normalizeFontFamily } from "@/utils/fonts";

const lineHeightOptions = [
  { value: "normal", label: "默认" },
  { value: "relaxed", label: "适中" },
  { value: "loose", label: "宽松" },
];

function SettingCard({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: any;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "border shadow-sm",
        "bg-card border-border shadow-sm"
      )}
    >
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Icon
            className={cn("w-4 h-4 text-muted-foreground")}
          />
          <span className={cn("text-foreground")}>
            {title}
          </span>
        </CardTitle>
        {action && <div className="ml-auto">{action}</div>}
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

  const { themeColor = THEME_COLORS[0] } = globalSettings;
  const t = useTranslations("workbench.sidePanel");

  const currentTemplate = DEFAULT_TEMPLATES.find(
    (t) => t.id === activeResume?.templateId
  );

  const availableModules = useMemo(() => {
    return (
      currentTemplate?.availableSections
        ?.map((id) => STANDARD_MODULES[id])
        .filter(Boolean) || []
    );
  }, [currentTemplate]);

  // 过滤掉 menuSections 中已存在的模块，避免重复添加和 key 冲突
  const filteredModules = useMemo(() => {
    const existingIds = new Set(menuSections.map((s: MenuSection) => s.id));
    return availableModules.filter((m) => !existingIds.has(m.id));
  }, [availableModules, menuSections]);

  const fontOptions = getFontOptions((key) => t(`typography.font.${key}`));
  const selectedFontFamily = normalizeFontFamily(globalSettings?.fontFamily);

  const lineHeightOptions = [
    { value: "normal", label: t("typography.lineHeight.normal") },
    { value: "relaxed", label: t("typography.lineHeight.relaxed") },
    { value: "loose", label: t("typography.lineHeight.loose") },
  ];

  const debouncedSetColor = useMemo(
    () =>
      debounce((value: string) => {
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
        "bg-background border-border"
      )}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      <div className="p-4 space-y-4">
        <SettingCard icon={Layout} title={t("layout.title")}>
          <LayoutSetting
            menuSections={menuSections}
            activeSection={activeSection || ""}
            setActiveSection={setActiveSection}
            toggleSectionVisibility={toggleSectionVisibility}
            updateMenuSections={updateMenuSections}
            reorderSections={reorderSections}
          />

          <div className="space-y-2 py-4">
            <Popover>
              <PopoverTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex justify-center w-full rounded-lg items-center gap-2 py-2 px-3 text-sm font-medium text-primary bg-primary/5 border border-dashed border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t("layout.addCustomSection")}
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="center">
                <div className="flex flex-col gap-1">
                  {/* Standard Sections Library */}
                  {filteredModules.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        const newSection = {
                          id: section.id,
                          title: t(`layout.standardSections.${section.titleKey}`),
                          icon: section.icon,
                          enabled: true,
                          order: menuSections.length,
                        };
                        updateMenuSections([...menuSections, newSection]);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
                    >
                      <span className="text-lg">{section.icon}</span>
                      <span>{t(`layout.standardSections.${section.titleKey}`)}</span>
                    </button>
                  ))}

                  {/* Divider for Custom Section */}
                  {filteredModules.length > 0 && (
                    <div className="h-px bg-border my-1" />
                  )}

                  {/* Add Custom Section */}
                  <button
                    onClick={handleCreateSection}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left text-muted-foreground italic"
                  >
                    <Plus className="w-4 h-4" />
                    {t("layout.addCustomSectionOption")}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </SettingCard>

        {/* 主题色设置  */}
        <SettingCard 
          icon={Palette} 
          title={t("theme.title")}
          action={
            <ColorPicker
              value={themeColor}
              onChange={(value) => debouncedSetColor(value)}
              className={cn(
                "h-7 w-auto px-3 py-0 rounded-full border shadow-none transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
                !THEME_COLORS.includes(themeColor)
                  ? "border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/60"
                  : "border-border text-muted-foreground bg-transparent hover:bg-accent/50 hover:text-foreground"
              )}
              style={{ backgroundColor: "transparent" }}
              title={t("theme.custom")}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{t("theme.custom")}</span>
              
              {!THEME_COLORS.includes(themeColor) && (
                <div 
                  className="w-2.5 h-2.5 rounded-full ml-0.5 border border-primary/20 shadow-sm"
                  style={{ backgroundColor: themeColor }}
                />
              )}
            </ColorPicker>
          }
        >
          <div className="flex flex-wrap gap-2.5 pt-1">
            {THEME_COLORS.map((presetTheme) => (
              <button
                key={presetTheme}
                className={cn(
                  "relative group w-6 h-6 rounded-full overflow-hidden transition-all duration-200 focus:outline-none",
                  themeColor === presetTheme
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "ring-1 ring-border hover:ring-primary/50 hover:scale-110"
                )}
                onClick={() => setThemeColor(presetTheme)}
                title={presetTheme}
              >
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: presetTheme }}
                />
              </button>
            ))}
          </div>
        </SettingCard>

        {/* 排版设置 */}
        <SettingCard icon={Type} title={t("typography.title")}>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t('typography.font.title')}
              </Label>
              <Select
                value={selectedFontFamily}
                onValueChange={(value) =>
                  updateGlobalSettings?.({ fontFamily: value })
                }
              >
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <SelectTrigger className="border border-input bg-background transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                </motion.div>
                <SelectContent
                  className={cn(
                    "bg-popover border-border"
                  )}
                >
                  {fontOptions.map((font) => (
                    <SelectItem
                      key={font.value}
                      value={font.value}
                      className="cursor-pointer transition-colors hover:bg-accent focus:bg-accent"
                    >
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-muted-foreground">
                {t("typography.font.note")}
              </p>
            </div>

            {/* 行高选择 */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t("typography.lineHeight.title")}
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
                <span className="min-w-[3ch] text-sm text-muted-foreground">
                  {globalSettings?.lineHeight}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t("typography.baseFontSize.title")}
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
                  <SelectTrigger className="border border-input bg-background transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                </motion.div>
                <SelectContent
                  className={cn(
                    "bg-popover border-border"
                  )}
                >
                  {[12, 13, 14, 15, 16, 18, 20, 24].map((size) => (
                    <SelectItem
                      key={size}
                      value={size.toString()}
                      className="cursor-pointer transition-colors hover:bg-accent focus:bg-accent"
                    >
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t("typography.headerSize.title")}
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
                  <SelectTrigger className="border border-input bg-background transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                </motion.div>
                <SelectContent
                  className={cn(
                    "bg-popover border-border"
                  )}
                >
                  {[12, 13, 14, 15, 16, 18, 20, 24].map((size) => (
                    <SelectItem
                      key={size}
                      value={size.toString()}
                      className="cursor-pointer transition-colors hover:bg-accent focus:bg-accent"
                    >
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t("typography.subheaderSize.title")}
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
                  <SelectTrigger className="border border-input bg-background transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                </motion.div>
                <SelectContent
                  className={cn(
                    "bg-popover border-border"
                  )}
                >
                  {[12, 13, 14, 15, 16, 18, 20, 24].map((size) => (
                    <SelectItem
                      key={size}
                      value={size.toString()}
                      className="cursor-pointer transition-colors hover:bg-accent focus:bg-accent"
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
        <SettingCard icon={SpaceIcon} title={t("spacing.title")}>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t("spacing.pagePadding.title")}
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
                  className="flex-1"
                />
                <div className="flex items-center">
                  <div className="flex h-8 w-20 overflow-hidden rounded-md border border-input">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={globalSettings?.pagePadding || 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = Number(e.target.value);
                        if (!isNaN(value) && value >= 0 && value <= 100) {
                          updateGlobalSettings?.({ pagePadding: value });
                        }
                      }}
                      className="h-full w-12 border-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0 no-spinner"
                    />
                    <div className="flex flex-col border-l border-input">
                      <button
                        type="button"
                        className="flex h-4 w-8 items-center justify-center border-b border-input bg-transparent text-muted-foreground hover:bg-accent"
                        onClick={() => {
                          const currentValue = globalSettings?.pagePadding || 0;
                          if (currentValue < 100) {
                            updateGlobalSettings?.({
                              pagePadding: currentValue + 1,
                            });
                          }
                        }}
                      >
                        <span className="sr-only">增加</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="flex h-4 w-8 items-center justify-center bg-transparent text-muted-foreground hover:bg-accent"
                        onClick={() => {
                          const currentValue = globalSettings?.pagePadding || 0;
                          if (currentValue > 0) {
                            updateGlobalSettings?.({
                              pagePadding: currentValue - 1,
                            });
                          }
                        }}
                      >
                        <span className="sr-only">减少</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <span className="ml-1 text-sm text-muted-foreground">
                    px
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t("spacing.sectionSpacing.title")}
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
                  className="flex-1"
                />
                <div className="flex items-center">
                  <div className="flex h-8 w-20 overflow-hidden rounded-md border border-input">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={globalSettings?.sectionSpacing || 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = Number(e.target.value);
                        if (!isNaN(value) && value >= 1 && value <= 100) {
                          updateGlobalSettings?.({ sectionSpacing: value });
                        }
                      }}
                      className="h-full w-12 border-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0 no-spinner"
                    />
                    <div className="flex flex-col border-l border-input">
                      <button
                        type="button"
                        className="flex h-4 w-8 items-center justify-center border-b border-input bg-transparent text-muted-foreground hover:bg-accent"
                        onClick={() => {
                          const currentValue =
                            globalSettings?.sectionSpacing || 0;
                          if (currentValue < 100) {
                            updateGlobalSettings?.({
                              sectionSpacing: currentValue + 1,
                            });
                          }
                        }}
                      >
                        <span className="sr-only">增加</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="flex h-4 w-8 items-center justify-center bg-transparent text-muted-foreground hover:bg-accent"
                        onClick={() => {
                          const currentValue =
                            globalSettings?.sectionSpacing || 0;
                          if (currentValue > 1) {
                            updateGlobalSettings?.({
                              sectionSpacing: currentValue - 1,
                            });
                          }
                        }}
                      >
                        <span className="sr-only">减少</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <span className="ml-1 text-sm text-muted-foreground">
                    px
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t("spacing.paragraphSpacing.title")}
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[globalSettings?.paragraphSpacing || 0]}
                  min={1}
                  max={50}
                  step={1}
                  onValueChange={([value]) =>
                    updateGlobalSettings?.({ paragraphSpacing: value })
                  }
                  className="flex-1"
                />
                <div className="flex items-center">
                  <div className="flex h-8 w-20 overflow-hidden rounded-md border border-input">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={globalSettings?.paragraphSpacing || 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = Number(e.target.value);
                        if (!isNaN(value) && value >= 1) {
                          updateGlobalSettings?.({ paragraphSpacing: value });
                        }
                      }}
                      className="h-full w-12 border-0 text-center focus-visible:ring-0 focus-visible:ring-offset-0 no-spinner"
                    />
                    <div className="flex flex-col border-l border-input">
                      <button
                        type="button"
                        className="flex h-4 w-8 items-center justify-center border-b border-input bg-transparent text-muted-foreground hover:bg-accent"
                        onClick={() => {
                          const currentValue =
                            globalSettings?.paragraphSpacing || 0;
                          if (currentValue < 100) {
                            updateGlobalSettings?.({
                              paragraphSpacing: currentValue + 1,
                            });
                          }
                        }}
                      >
                        <span className="sr-only">增加</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="flex h-4 w-8 items-center justify-center bg-transparent text-muted-foreground hover:bg-accent"
                        onClick={() => {
                          const currentValue =
                            globalSettings?.paragraphSpacing || 0;
                          if (currentValue > 1) {
                            updateGlobalSettings?.({
                              paragraphSpacing: currentValue - 1,
                            });
                          }
                        }}
                      >
                        <span className="sr-only">减少</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <span className="ml-1 text-sm text-muted-foreground">
                    px
                  </span>
                </div>
              </div>
            </div>
          </div>
        </SettingCard>

        {/* 模式设置 */}
        <SettingCard icon={Zap} title={t("mode.title")}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t("mode.useIconMode.title")}
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

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t("mode.centerSubtitle.title")}
              </Label>
              <div className="flex items-center gap-4">
                <Switch
                  checked={globalSettings.centerSubtitle}
                  onCheckedChange={(checked) =>
                    updateGlobalSettings({
                      centerSubtitle: checked,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {t("mode.flexibleHeaderLayout.title")}
              </Label>
              <div className="flex items-center gap-4">
                <Switch
                  checked={globalSettings.flexibleHeaderLayout}
                  onCheckedChange={(checked) =>
                    updateGlobalSettings({
                      flexibleHeaderLayout: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </SettingCard>
      </div>
    </motion.div>
  );
}
