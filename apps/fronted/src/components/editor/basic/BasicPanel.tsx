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
  Github,
  GripVertical,
  Trash2,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Field from "../Field";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { motion, Reorder } from "framer-motion";

type IconOption = {
  label: string;
  value: string;
  icon: LucideIcon;
};

type CustomFieldType = {
  id: string;
  label: string;
  value: string;
  icon: string;
};

type Theme = "dark" | "light";

interface IconSelectorProps {
  value: string;
  onChange: (value: string) => void;
  theme: Theme;
}

interface CustomFieldProps {
  field: CustomFieldType;
  onUpdate: (field: CustomFieldType) => void;
  onDelete: (id: string) => void;
  theme: Theme;
}

interface BasicInfo {
  name?: string;
  title?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  employed?: boolean;
  customFields?: CustomFieldType[];
  icons?: Record<string, string>;
}

const iconOptions: IconOption[] = [
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

const IconSelector: React.FC<IconSelectorProps> = ({
  value,
  onChange,
  theme
}) => {
  const [open, setOpen] = React.useState(false);
  const selectedIcon =
    iconOptions.find((i) => i.value === value) || iconOptions[0];
  const Icon = selectedIcon.icon;

  const handleSelect = (iconValue: string) => {
    onChange(iconValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Icon className="w-4 h-4" />
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[200px] p-2 grid grid-cols-5 gap-1",
          theme === "dark" ? "bg-neutral-900 border-neutral-700" : "bg-white"
        )}
      >
        {iconOptions.map(({ value: iconValue, icon: Icon, label }) => (
          <Button
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
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

const CustomField: React.FC<CustomFieldProps> = ({
  field,
  onUpdate,
  onDelete,
  theme
}) => {
  return (
    <Reorder.Item
      value={field}
      id={field.id}
      className="group touch-none list-none"
    >
      <div
        className={cn(
          "grid grid-cols-[auto_auto_1fr_1fr_auto] gap-2 items-center p-2 rounded-lg border border-transparent",
          theme === "dark"
            ? "hover:border-neutral-700"
            : "hover:border-neutral-200"
        )}
      >
        <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing text-neutral-400" />
        <IconSelector
          value={field.icon}
          onChange={(value) => onUpdate({ ...field, icon: value })}
          theme={theme}
        />
        <Field
          label=""
          value={field.label}
          onChange={(value) => onUpdate({ ...field, label: value })}
          placeholder="字段名称"
        />
        <Field
          label=""
          value={field.value}
          onChange={(value) => onUpdate({ ...field, value })}
          placeholder="字段内容"
        />
        <Button
          onClick={() => onDelete(field.id)}
          className={cn(
            "p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity",
            theme === "dark"
              ? "hover:bg-red-500/20 text-red-400 hover:text-red-300"
              : "hover:bg-red-500/10 text-red-500 hover:text-red-600"
          )}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Reorder.Item>
  );
};

const BasicPanel: React.FC = () => {
  const { basic, updateBasicInfo, theme } = useResumeStore();
  const [fields, setFields] = useState<CustomFieldType[]>(
    basic?.customFields || []
  );

  const addCustomField = () => {
    const fieldToAdd: CustomFieldType = {
      id: crypto.randomUUID(),
      label: "",
      value: "",
      icon: "User"
    };
    const updatedFields = [...fields, fieldToAdd];
    setFields(updatedFields);
    updateBasicInfo({
      ...basic,
      customFields: updatedFields
    });
  };

  const updateField = (updatedField: CustomFieldType) => {
    const updatedFields = fields.map((field) =>
      field.id === updatedField.id ? updatedField : field
    );
    setFields(updatedFields);
    updateBasicInfo({
      ...basic,
      customFields: updatedFields
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

  const handleReorder = (newOrder: CustomFieldType[]) => {
    setFields(newOrder);
    updateBasicInfo({
      ...basic,
      customFields: newOrder
    });
  };

  const renderField = (
    key: keyof BasicInfo,
    label: string,
    options: {
      type?: "date" | "textarea" | "text" | "editor" | undefined;
      isCustom?: boolean;
      field?: CustomFieldType | null;
    } = {}
  ) => {
    const { type = "text", isCustom = false, field = null } = options;

    const selectedIcon = basic?.icons?.[key] || "User";

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <IconSelector
            value={selectedIcon}
            onChange={(value) => {
              updateBasicInfo({
                ...basic,
                icons: {
                  ...(basic?.icons || {}),
                  [key]: value
                }
              });
            }}
            theme={theme}
          />
          <span className="text-sm font-medium">{label}</span>
        </div>

        <Field
          label=""
          value={isCustom ? field?.value || "" : (basic?.[key] as string) || ""}
          onChange={(value) =>
            isCustom && field
              ? updateField({ ...field, value })
              : updateBasicInfo({ ...basic, [key]: value })
          }
          placeholder={`请输入${label}`}
          type={type}
        />
      </div>
    );
  };

  return (
    <div className="space-y-5 p-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">{renderField("name", "姓名")}</div>
        <div className="flex items-center gap-2 pt-8">
          <Switch
            id="employed"
            checked={basic?.employed ?? true}
            onCheckedChange={(checked) =>
              updateBasicInfo({
                ...basic,
                employed: checked
              })
            }
            className={cn(
              theme === "dark" ? "bg-neutral-700" : "bg-neutral-200",
              "data-[state=checked]:bg-green-500"
            )}
          />
          <Label
            htmlFor="employed"
            className={cn(
              "text-sm cursor-pointer select-none",
              theme === "dark" ? "text-neutral-200" : "text-neutral-700"
            )}
          >
            {basic?.employed ?? true ? "在职" : "离职"}
          </Label>
        </div>
      </div>
      {renderField("title", "职位")}
      {renderField("birthDate", "出生日期", { type: "date" })}
      <div className="grid grid-cols-2 gap-5">
        {renderField("email", "电子邮箱")}
        {renderField("phone", "电话")}
      </div>
      {renderField("location", "所在地")}
      {renderField("summary", "个人简介", { type: "textarea" })}

      {/* 自定义字段 */}
      <div className="space-y-4">
        <Reorder.Group
          axis="y"
          values={fields}
          onReorder={handleReorder}
          className="space-y-2"
        >
          {Array.isArray(fields) &&
            fields.map((field) => (
              <CustomField
                key={field.id}
                field={field}
                onUpdate={updateField}
                onDelete={deleteField}
                theme={theme}
              />
            ))}
        </Reorder.Group>

        {/* 添加按钮 */}
        <Button
          onClick={addCustomField}
          variant={theme === "dark" ? "ghost" : "outline"}
          className={cn(
            "w-full border-dashed",
            theme === "dark"
              ? "hover:bg-neutral-800 border-neutral-700 text-neutral-200 hover:text-neutral-100"
              : "hover:bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-900"
          )}
        >
          <PlusCircle
            className={cn(
              "w-4 h-4 mr-2",
              theme === "dark" ? "text-neutral-400" : "text-neutral-500"
            )}
          />
          添加自定义字段
        </Button>
      </div>
    </div>
  );
};

export default BasicPanel;
