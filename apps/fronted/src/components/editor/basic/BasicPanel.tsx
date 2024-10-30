import React, { useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Field from "../Field";
import { useResumeStore } from "@/store/useResumeStore";
import { Input } from "@/components/ui/input";
import { platform } from "os";
import { cn } from "@/lib/utils";

const BasicPanel = () => {
  const { basic, updateBasicInfo, theme } = useResumeStore();
  const [fields, setFields] = useState(basic.customFields);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  const addCustomField = () => {
    const newField = {
      id: crypto.randomUUID(),
      label: newLabel,
      value: newValue,
      required: false,
      placeholder: ""
    };
    setFields([...fields, newField]);
    updateBasicInfo({
      ...basic,
      customFields: [...fields, newField]
    });
  };

  const updateField = (id: string, updates: { value: string }) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
    updateBasicInfo({ customFields: fields });
  };

  const deleteField = (id) => {
    setFields(fields.filter((field) => field.id !== id));
    updateBasicInfo({
      customFields: fields.filter((field) => field.id !== id)
    });
  };

  return (
    <div className="space-y-5 p-4">
      <Field
        label="姓名"
        value={basic.name}
        onChange={(value) => updateBasicInfo({ name: value })}
        placeholder="请输入你的姓名"
        required
      />
      <Field
        label="职位"
        value={basic.title}
        onChange={(value) => updateBasicInfo({ title: value })}
        placeholder="期望职位"
        required
      />
      <Field
        label="出生日期"
        value={basic.birthDate}
        onChange={(value) => updateBasicInfo({ birthDate: value })}
        type="date"
      />
      <div className="grid grid-cols-2 gap-5">
        <Field
          label="电子邮箱"
          value={basic.email}
          onChange={(value) => updateBasicInfo({ email: value })}
          placeholder="your@email.com"
          required
        />
        <Field
          label="电话"
          value={basic.phone}
          onChange={(value) => updateBasicInfo({ phone: value })}
          placeholder="手机号码"
          required
        />
      </div>
      <Field
        label="所在地"
        value={basic.location}
        onChange={(value) => updateBasicInfo({ location: value })}
        placeholder="城市"
        required
      />
      <Field
        label="个人简介"
        value={basic.summary}
        onChange={(value) => updateBasicInfo({ summary: value })}
        type="textarea"
        placeholder="简单介绍一下自己..."
      />

      {/* 自定义字段 */}
      {fields.map((field) => (
        <div key={field.id} className="relative group">
          <Field
            label={field.label}
            value={field.value}
            onChange={(value) => updateField(field.id, { value })}
            placeholder={field.placeholder}
          />
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
              ? "bg-indigo-600 hover:bg-indigo-700 text-white "
              : "bg-black hover:bg-neutral-800 text-white "
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
