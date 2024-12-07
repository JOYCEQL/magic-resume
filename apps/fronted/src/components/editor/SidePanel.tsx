"use client";

import { motion, Reorder } from "framer-motion";
import {
  GripVertical,
  Eye,
  EyeOff,
  Layout,
  Type,
  SpaceIcon,
  Palette,
  Plus,
  Trash2,
} from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { THEME_COLORS } from "@/types/resume";
import debounce from "lodash/debounce";
import { useMemo } from "react";
import { Switch } from "../ui/switch";

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
    setColorTheme,
    reorderSections,
    addCustomData,
  } = useResumeStore();
  const {
    menuSections = [],
    globalSettings = {},
    colorTheme,
    activeSection,
  } = activeResume || {};

  const debouncedSetColor = useMemo(
    () =>
      debounce((value) => {
        setColorTheme(value);
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
        {/* 布局部分 */}
        <SettingCard icon={Layout} title="布局">
          {menuSections
            .filter((item) => item.id === "basic")
            .map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-lg group border mb-2  hover:border-primary",
                  "dark:hover:bg-neutral-800 dark:bg-neutral-900/50 dark:border-neutral-800",
                  "hover:bg-gray-50 bg-white border-gray-100",
                  activeSection === item.id &&
                    "border-primary dark:border-primary text-primary"
                )}
              >
                <div className="flex items-center p-3 pl-[32px] space-x-3 ">
                  <span
                    className={cn(
                      "text-lg  ml-[12px]",
                      "dark:text-neutral-300",
                      "text-gray-600"
                    )}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={cn("text-sm flex-1 cursor-pointer")}
                    onClick={() => setActiveSection(item.id)}
                  >
                    {item.title}
                  </span>
                </div>
              </div>
            ))}

          <Reorder.Group
            axis="y"
            values={menuSections}
            onReorder={reorderSections}
            className="space-y-2 list-none"
          >
            {menuSections
              .filter((item) => item.id !== "basic")
              .map((item) => (
                <Reorder.Item
                  key={item.id}
                  value={item}
                  className={cn(
                    "rounded-lg cursor-move group border  hover:border-primary",
                    "dark:hover:bg-neutral-800  dark:bg-neutral-900/50 dark:border-neutral-800 dark:hover:border-primary",
                    "hover:bg-gray-50 bg-white border-gray-100",
                    activeSection === item.id &&
                      "border-primary dark:border-primary text-primary"
                  )}
                  whileHover={{ scale: 1.01 }}
                  whileDrag={{ scale: 1.02 }}
                >
                  <div className="flex items-center p-3 space-x-3">
                    <GripVertical
                      className={cn(
                        "w-5 h-5  transition-opacity",
                        "dark:text-neutral-400",
                        "text-gray-400"
                      )}
                    />
                    <span
                      className={cn(
                        "text-lg mr-2",
                        "dark:text-neutral-300",
                        "text-gray-600"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={cn("text-sm flex-1 cursor-pointer")}
                      onClick={() => setActiveSection(item.id)}
                    >
                      {item.title}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleSectionVisibility(item.id)}
                      className={cn(
                        "p-1.5 rounded-md",
                        "dark:hover:bg-neutral-700 dark:text-neutral-300",
                        "hover:bg-gray-100 text-gray-600"
                      )}
                    >
                      {item.enabled ? (
                        <Eye className="w-4 h-4 text-primary" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        updateMenuSections(
                          menuSections.filter(
                            (section) => section.id !== item.id
                          )
                        );
                        setActiveSection(
                          menuSections[
                            menuSections.findIndex((s) => s.id === item.id) - 1
                          ].id
                        );
                      }}
                      className={cn(
                        "p-1.5 rounded-md text-primary",
                        "dark:hover:bg-neutral-700 dark:text-neutral-300",
                        "hover:bg-gray-100 text-gray-600"
                      )}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </motion.button>
                  </div>
                </Reorder.Item>
              ))}
          </Reorder.Group>
          <div className="space-y-2  py-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCreateSection}
              className="flex justify-center w-full rounded-lg items-center gap-2 py-2 px-3  text-sm font-medium text-primary bg-indigo-50"
            >
              添加自定义模块
            </motion.button>
          </div>
        </SettingCard>

        {/* 主题色设置  */}
        <SettingCard icon={Palette} title="主题色">
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2">
              {THEME_COLORS.map((presetTheme) => (
                <button
                  key={presetTheme}
                  className={cn(
                    "relative group aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200",
                    colorTheme === presetTheme
                      ? "border-black dark:border-white"
                      : "dark:border-neutral-800 dark:hover:border-neutral-700 border-gray-100 hover:border-gray-200"
                  )}
                  onClick={() => setColorTheme(presetTheme)}
                >
                  {/* 颜色展示 */}
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: presetTheme }}
                  />

                  {/* 选中指示器 */}
                  {colorTheme === presetTheme && (
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
                自定义
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
        <SettingCard icon={Type} title="排版">
          <div className="space-y-6">
            {/* <div className="space-y-2">
              <Label className="text-gray-600 dark:text-neutral-300">
                字体
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
                    theme === "dark"
                      ? "bg-neutral-900 border-neutral-800 text-white"
                      : "bg-white border-gray-200"
                  )}
                >
                  {fontOptions.map((font) => (
                    <SelectItem
                      key={font.value}
                      value={font.value}
                      className="cursor-pointer transition-colors focus:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
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
                行高
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
                基础字号
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
                    "dark:bg-neutral-900 dark:border-neutral-800 text-white",
                    "bg-white text-gray-700 border-gray-200"
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
                模块标题字号
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
                模块二级标题字号
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
        <SettingCard icon={SpaceIcon} title="间距">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-600 dark:text-neutral-300">
                页边距
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[globalSettings?.pagePadding || 0]}
                  min={20}
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
                模块间距
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
                段落间距
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
        <SettingCard icon={SpaceIcon} title="模式">
          <div className="space-y-2">
            <Label className="text-gray-600 dark:text-neutral-300">
              简洁模式
            </Label>
            <div className="flex items-center gap-4">
              <Switch
                checked={globalSettings.useIconMode}
                onCheckedChange={(checked) =>
                  updateGlobalSettings({
                    ...globalSettings,
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
