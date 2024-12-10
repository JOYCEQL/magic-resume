"use client";
import React, { useState } from "react";
import { PlusCircle, GripVertical, Trash2, Eye, EyeOff } from "lucide-react";
import { Reorder, AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import PhotoUpload from "@/components/shared/PhotoSelector";
import IconSelector from "../IconSelector";
import Field from "../Field";
import { cn } from "@/lib/utils";
import { DEFAULT_FIELD_ORDER } from "@/config";
import { useResumeStore } from "@/store/useResumeStore";
import { BasicFieldType, CustomFieldType } from "@/types/resume";
interface CustomFieldProps {
  field: CustomFieldType;
  onUpdate: (field: CustomFieldType) => void;
  onDelete: (id: string) => void;
}

const itemAnimations = {
  initial: { opacity: 0, y: 0 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 0 },
  transition: { type: "spring", stiffness: 500, damping: 50, mass: 1 },
};

const CustomField: React.FC<CustomFieldProps> = ({
  field,
  onUpdate,
  onDelete,
}) => {
  return (
    <Reorder.Item
      value={field}
      id={field.id}
      className="group touch-none list-none"
    >
      <motion.div
        {...itemAnimations}
        className={cn(
          "grid grid-cols-[auto_auto_1fr_1fr_auto_auto] gap-3 items-center p-3",
          "bg-white dark:bg-neutral-800 rounded-xl",
          "border border-neutral-100 dark:border-neutral-700",
          "transition-all duration-200",
          " hover:border-neutral-200 dark:hover:border-neutral-600",
          !field.visible && "!opacity-60"
        )}
      >
        <div className="flex items-center justify-center">
          <GripVertical
            className={cn(
              "w-4 h-4 cursor-grab active:cursor-grabbing",
              "text-neutral-300 dark:text-neutral-500",
              "transition-colors duration-200",
              "group-hover:text-neutral-400 dark:group-hover:text-neutral-400"
            )}
          />
        </div>
        <div className="flex items-center justify-center">
          <IconSelector
            value={field.icon}
            onChange={(value) => onUpdate({ ...field, icon: value })}
          />
        </div>
        <Field
          value={field.label ?? ""}
          onChange={(value) =>
            onUpdate({
              ...field,
              label: value,
            })
          }
          placeholder="标签"
          className={cn(
            "bg-neutral-50 dark:bg-neutral-900",
            "border-neutral-200 dark:border-neutral-700",
            "focus:border-blue-500 dark:focus:border-blue-400",
            "placeholder-neutral-400 dark:placeholder-neutral-500"
          )}
        />
        <Field
          value={field.value}
          onChange={(value) =>
            onUpdate({
              ...field,
              value: value,
            })
          }
          placeholder="值"
          className={cn(
            "bg-neutral-50 dark:bg-neutral-900",
            "border-neutral-200 dark:border-neutral-700",
            "focus:border-blue-500 dark:focus:border-blue-400",
            "placeholder-neutral-400 dark:placeholder-neutral-500"
          )}
        />

        {field.visible ? (
          <Eye
            className="w-4 h-4 cursor-pointer text-primary"
            onClick={() => onUpdate({ ...field, visible: !field.visible })}
          />
        ) : (
          <EyeOff
            className="w-4 h-4 cursor-pointer"
            onClick={() => onUpdate({ ...field, visible: !field.visible })}
          />
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(field.id)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            "hover:bg-red-100 dark:hover:bg-red-900/40",
            "text-red-500 bg-red-50 dark:bg-red-900/20"
          )}
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </Reorder.Item>
  );
};

const BasicPanel: React.FC = () => {
  const { activeResume, updateBasicInfo } = useResumeStore();
  const { basic } = activeResume || {};
  const [customFields, setCustomFields] = useState<CustomFieldType[]>(
    basic?.customFields?.map((field) => ({
      ...field,
      visible: field.visible ?? true,
    })) || []
  );
  const [basicFields, setBasicFields] = useState<BasicFieldType[]>(() => {
    if (!basic?.fieldOrder) {
      return DEFAULT_FIELD_ORDER;
    }
    return basic.fieldOrder.map((field) => ({
      ...field,
      visible: field.visible ?? true,
    }));
  });

  const handleBasicReorder = (newOrder: BasicFieldType[]) => {
    setBasicFields(newOrder);
    updateBasicInfo({
      ...basic,
      fieldOrder: newOrder,
    });
  };

  const toggleFieldVisibility = (fieldId: string, isVisible: boolean) => {
    const newFields = basicFields.map((field) =>
      field.id === fieldId ? { ...field, visible: isVisible } : field
    );
    setBasicFields(newFields);
    updateBasicInfo({
      ...basic,
      fieldOrder: newFields,
    });
  };

  const addCustomField = () => {
    const fieldToAdd: CustomFieldType = {
      id: crypto.randomUUID(),
      label: "",
      value: "",
      icon: "User",
      visible: true,
    };
    const updatedFields = [...customFields, fieldToAdd];
    setCustomFields(updatedFields);
    updateBasicInfo({
      ...basic,
      customFields: updatedFields,
    });
  };

  const updateCustomField = (updatedField: CustomFieldType) => {
    const updatedFields = customFields.map((field) =>
      field.id === updatedField.id ? updatedField : field
    );
    setCustomFields(updatedFields);
    updateBasicInfo({
      ...basic,
      customFields: updatedFields,
    });
  };

  const deleteCustomField = (id: string) => {
    const updatedFields = customFields.filter((field) => field.id !== id);
    setCustomFields(updatedFields);
    updateBasicInfo({
      ...basic,
      customFields: updatedFields,
    });
  };

  const handleCustomFieldsReorder = (newOrder: CustomFieldType[]) => {
    setCustomFields(newOrder);
    updateBasicInfo({
      ...basic,
      customFields: newOrder,
    });
  };
  const renderBasicField = (field: BasicFieldType) => {
    const selectedIcon = basic?.icons?.[field.key] || "User";

    return (
      <Reorder.Item
        value={field}
        id={field.id}
        key={field.id}
        className="group touch-none list-none"
        dragListener={
          // 姓名和职位禁用拖拽
          field.key !== "name" && field.key !== "title"
        }
      >
        <motion.div
          {...itemAnimations}
          className={cn(
            "flex items-center gap-4 p-4 pr-3",
            "bg-white dark:bg-neutral-900",
            "rounded-lg ",
            "transition-all duration-200",
            !field.visible && "opacity-75"
          )}
        >
          {field.key !== "name" && field.key !== "title" && (
            <div className="shrink-0">
              <GripVertical
                className={cn(
                  "w-5 h-5 cursor-grab active:cursor-grabbing",
                  "text-neutral-400 dark:text-neutral-600",
                  "hover:text-neutral-600 dark:hover:text-neutral-400",
                  "transition-colors duration-200"
                )}
              />
            </div>
          )}

          <div className="flex flex-1 min-w-0 items-center">
            {field.key !== "name" && field.key !== "title" && (
              <IconSelector
                value={selectedIcon}
                onChange={(value) => {
                  updateBasicInfo({
                    ...basic,
                    icons: {
                      ...(basic?.icons || {}),
                      [field.key]: value,
                    },
                  });
                }}
              />
            )}
            <div className=" w-[80px] ml-[4px] text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {field.label}
            </div>
            <div className="flex-1">
              <Field
                label=""
                value={(basic?.[field.key] as string) ?? ""}
                onChange={(value) =>
                  updateBasicInfo({
                    ...basic,
                    [field.key]: value,
                  })
                }
                placeholder={`请输入${field.label}`}
                type={field.type}
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "shrink-0 h-8 px-2",
              "text-neutral-500 dark:text-neutral-400",
              "hover:text-neutral-700 dark:hover:text-neutral-200"
            )}
            onClick={() => toggleFieldVisibility(field.id, !field.visible)}
          >
            {field.visible ? (
              <Eye className="w-4 h-4 text-primary" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
        </motion.div>
      </Reorder.Item>
    );
  };

  return (
    <motion.div className="space-y-6 p-6" {...itemAnimations}>
      <motion.div
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-xl p-3 border border-neutral-100 dark:border-neutral-700"
      >
        <PhotoUpload />
      </motion.div>

      <motion.div className="space-y-6">
        <motion.div className="space-y-3">
          <motion.h3 className="font-medium text-neutral-900 dark:text-neutral-200 px-1">
            基本字段
          </motion.h3>
          <AnimatePresence mode="popLayout">
            <Reorder.Group
              axis="y"
              as="div"
              values={basicFields}
              onReorder={handleBasicReorder}
              className="space-y-3"
            >
              {basicFields.map((field) => renderBasicField(field))}
            </Reorder.Group>
          </AnimatePresence>
        </motion.div>

        <motion.div className="space-y-3">
          <motion.h3 className="font-medium text-neutral-900 dark:text-neutral-200 px-1">
            自定义字段
          </motion.h3>
          <AnimatePresence mode="popLayout">
            <Reorder.Group
              axis="y"
              as="div"
              values={customFields}
              onReorder={handleCustomFieldsReorder}
              className="space-y-3"
            >
              {Array.isArray(customFields) &&
                customFields.map((field) => (
                  <CustomField
                    key={field.id}
                    field={field}
                    onUpdate={updateCustomField}
                    onDelete={deleteCustomField}
                  />
                ))}
            </Reorder.Group>
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button onClick={addCustomField} className="w-full mt-4">
              <PlusCircle className="w-4 h-4 mr-2" />
              添加自定义字段
            </Button>
          </motion.div>
        </motion.div>
        <motion.div className="space-y-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <motion.h3 className="font-medium text-neutral-900 dark:text-neutral-200 px-1">
                Github 贡献图
              </motion.h3>

              <Switch
                checked={basic?.githubContributionsVisible}
                onCheckedChange={(checked) =>
                  updateBasicInfo({
                    ...basic,
                    githubContributionsVisible: checked,
                  })
                }
              />
            </div>

            <div className="mt-4">
              <div className="flex items-center ml-3 space-x-2">
                <div className=" w-[110px]">Access Token</div>
                <Input
                  placeholder="请输入github access token"
                  className="flex-1"
                  value={basic?.githubKey}
                  onChange={(e) =>
                    updateBasicInfo({
                      ...basic,
                      githubKey: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center ml-3 mt-4 space-x-2">
                <div className="w-[110px]">UseName</div>
                <Input
                  className="flex-1"
                  placeholder="请输入github username"
                  value={basic?.githubUseName}
                  onChange={(e) =>
                    updateBasicInfo({
                      ...basic,
                      githubUseName: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default BasicPanel;
