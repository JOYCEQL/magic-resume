import React, { useState } from "react";
import { PlusCircle, GripVertical, Trash2, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Field from "../Field";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import { Reorder } from "framer-motion";
import IconSelector from "../IconSelector";
import PhotoUpload from "@/components/PhotoSelector";

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
  customFields?: CustomFieldType[];
  icons?: Record<string, string>;
  employementStatus?: string;
}

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

        <Trash2
          onClick={() => onDelete(field.id)}
          size={26}
          className={cn(
            "p-1.5 rounded-md  cursor-pointer",
            theme === "dark"
              ? "text-red-400 hover:text-red-300"
              : "text-red-500 hover:text-red-600"
          )}
        />
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
      <PhotoUpload theme={theme} />
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">{renderField("name", "姓名")}</div>

        <div>{renderField("employementStatus", "在职状态")}</div>
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

        <Button
          onClick={addCustomField}
          className={cn(
            "w-full",
            theme === "dark"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "bg-black hover:bg-neutral-800 text-white"
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
