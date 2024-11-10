import React, { useState } from "react";
import {
  PlusCircle,
  X,
  User,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  MapPin,
  FileText,
  Smartphone,
  Globe,
  Github
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Field from "../Field";
import { useResumeStore } from "@/store/useResumeStore";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";

// 预定义图标选项
const iconOptions = [
  { label: "用户", value: "User", icon: User },
  { label: "工作", value: "Briefcase", icon: Briefcase },
  { label: "日期", value: "Calendar", icon: Calendar },
  { label: "邮箱", value: "Mail", icon: Mail },
  { label: "电话", value: "Phone", icon: Phone },
  { label: "地址", value: "MapPin", icon: MapPin },
  { label: "简介", value: "FileText", icon: FileText },
  { label: "手机", value: "Smartphone", icon: Smartphone },
  { label: "网站", value: "Globe", icon: Globe },
  { label: "Github", value: "Github", icon: Github }
];

const IconSelector = ({ value, onChange, theme }) => {
  const [open, setOpen] = React.useState(false);
  const selectedIcon =
    iconOptions.find((i) => i.value === value) || iconOptions[0];

  const handleSelect = (iconValue) => {
    onChange(iconValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors",
            theme === "dark" ? "text-neutral-200" : "text-neutral-700"
          )}
        >
          <selectedIcon.icon className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[200px] p-2 grid grid-cols-5 gap-1",
          theme === "dark" ? "bg-neutral-900 border-neutral-700" : "bg-white"
        )}
      >
        {iconOptions.map(({ value: iconValue, icon: Icon, label }) => (
          <button
            key={iconValue}
            onClick={() => handleSelect(iconValue)}
            className={cn(
              "p-2 rounded flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 group relative",
              theme === "dark" ? "text-neutral-200" : "text-neutral-700",
              value === iconValue &&
                (theme === "dark" ? "bg-neutral-800" : "bg-neutral-100")
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {label}
            </span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

const BasicPanel = () => {
  const { basic, updateBasicInfo, theme } = useResumeStore();
  const [fields, setFields] = useState(basic?.customFields || []);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  const addCustomField = () => {
    const newField = {
      id: crypto.randomUUID(),
      label: newLabel,
      value: newValue,
      icon: "User",
      required: false,
      placeholder: ""
    };
    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    updateBasicInfo({
      ...basic,
      customFields: updatedFields
    });
    setNewLabel("");
    setNewValue("");
  };

  const updateField = (id: string, updates: any) => {
    const updatedFields = fields.map((field) =>
      field.id === id ? { ...field, ...updates } : field
    );
    setFields(updatedFields);
    updateBasicInfo({
      ...basic,
      customFields: updatedFields
    });
  };

  const updateIcon = (key: string, iconName: string) => {
    updateBasicInfo({
      ...basic,
      icons: {
        ...(basic?.icons || {}),
        [key]: iconName
      }
    });
  };

  const deleteField = (id: string) => {
    const updatedFields = fields.filter((field) => field.id !== id);
    setFields(updatedFields);
    updateBasicInfo({
      ...basic,
      customFields: updatedFields
    });
  };

  const renderField = (key: string, label: string, options = {}) => {
    const {
      required = false,
      type = "text",
      isCustom = false,
      field = null
    } = options;

    const selectedIcon = basic?.icons?.[key] || "User";

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <IconSelector
            value={selectedIcon}
            onChange={(value) => updateIcon(key, value)}
            theme={theme}
          />
          <span className="text-sm font-medium">{label}</span>
        </div>

        <Field
          label={""}
          value={isCustom ? field.value : basic?.[key] || ""}
          onChange={(value) =>
            isCustom
              ? updateField(field.id, { value })
              : updateBasicInfo({ [key]: value })
          }
          placeholder={`请输入${label}`}
          type={type}
        />
      </div>
    );
  };

  return (
    <div className="space-y-5 p-4">
      {renderField("name", "姓名", { required: true })}
      {renderField("title", "职位", { required: true })}
      {renderField("birthDate", "出生日期", { type: "date" })}
      <div className="grid grid-cols-2 gap-5">
        {renderField("email", "电子邮箱", { required: true })}
        {renderField("phone", "电话", { required: true })}
      </div>
      {renderField("location", "所在地", { required: true })}
      {renderField("summary", "个人简介", { type: "textarea" })}

      {/* 自定义字段 */}
      {Array.isArray(fields) &&
        fields.map((field) => (
          <div key={field.id} className="relative group">
            {renderField(field.id, field.label, { isCustom: true, field })}
            <button
              onClick={() => deleteField(field.id)}
              className="absolute -right-2 -top-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

      {/* 新字段输入区 */}
      <div className="flex gap-3">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="字段名称"
          className={cn(
            "w-1/3",
            theme === "dark"
              ? "bg-neutral-900 border-neutral-700 text-neutral-200 placeholder:text-neutral-500"
              : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-500"
          )}
        />
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="字段值"
          className={cn(
            "w-1/3",
            theme === "dark"
              ? "bg-neutral-900 border-neutral-700 text-neutral-200 placeholder:text-neutral-500"
              : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-500"
          )}
        />
        <Button
          onClick={addCustomField}
          disabled={!newLabel}
          className={cn(
            theme === "dark"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-black hover:bg-neutral-800 text-white"
          )}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          添加
        </Button>
      </div>
    </div>
  );
};

export default BasicPanel;
