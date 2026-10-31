import React, { useCallback, useEffect, useRef, useState } from "react";
import { PlusCircle, GripVertical, Trash2, Eye, EyeOff, Underline } from "lucide-react";
import { Reorder, AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "@/i18n/compat/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PhotoUpload from "@/components/shared/PhotoSelector";
import IconSelector from "../IconSelector";
import AlignSelector from "./AlignSelector";
import Field from "../Field";
import { cn } from "@/lib/utils";
import { DEFAULT_FIELD_ORDER } from "@/config";
import { useResumeStore } from "@/store/useResumeStore";
import { BasicFieldType, CustomFieldType } from "@/types/resume";
import { generateUUID } from "@/utils/uuid";
interface CustomFieldProps {
  field: CustomFieldType;
  onUpdate: (field: CustomFieldType) => void;
  onDelete: (id: string) => void;
  onReorderEnd: () => void;
}

const itemAnimations = {
  initial: { opacity: 0, y: 0 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 0 },
  transition: { type: "spring", stiffness: 500, damping: 50, mass: 1 },
};

const CustomField: React.FC<CustomFieldProps> = React.memo(({
  field,
  onUpdate,
  onDelete,
  onReorderEnd,
}) => {
  const t = useTranslations("workbench.basicPanel");

  return (
    <Reorder.Item
      value={field}
      id={field.id}
      className="group touch-none list-none"
      onDragEnd={onReorderEnd}
    >
      <motion.div
        {...itemAnimations}
        className={cn(
          "grid grid-cols-[auto,auto,1fr,1fr,auto,auto] gap-3 items-center p-3",
          "bg-card rounded-xl",
          "border border-border",
          "transition-all duration-200",
          "hover:border-primary/20",
          !field.visible && "!opacity-60"
        )}
      >
        <div className="flex items-center justify-center">
          <GripVertical
            className={cn(
              "w-4 h-4 cursor-grab active:cursor-grabbing",
              "text-muted-foreground",
              "transition-colors duration-200",
              "group-hover:text-foreground"
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
          placeholder={t("customFields.placeholders.label")}
          className={cn(
            "bg-background/50",
            "border-border",
            "focus:border-primary",
            "placeholder-muted-foreground"
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
          placeholder={t("customFields.placeholders.value")}
          className={cn(
            "bg-background/50",
            "border-border",
            "focus:border-primary",
            "placeholder-muted-foreground"
          )}
        />

        <div className="flex items-center gap-2 whitespace-nowrap">
          <Switch
            checked={field.displayLabel ?? false}
            onCheckedChange={(checked) =>
              onUpdate({
                ...field,
                displayLabel: checked,
              })
            }
          />
          <span className="text-xs text-muted-foreground">
            {t("customFields.displayLabel")}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "shrink-0 h-8 px-2",
              "text-muted-foreground",
              "hover:text-foreground"
            )}
            onClick={() => onUpdate({ ...field, visible: !field.visible })}
          >
            {field.visible ? (
              <Eye className="w-4 h-4 text-primary" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(field.id)}
            className={cn(
              "shrink-0 h-8 px-2",
              "text-neutral-500 dark:text-muted-foreground",
              "hover:text-red-600 dark:hover:text-red-400"
            )}
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </Button>
        </div>
      </motion.div>
    </Reorder.Item>
  );
});

interface BasicFieldRowProps {
  field: BasicFieldType;
  value: string;
  selectedIcon: string;
  labelText: string;
  emailUnderline?: boolean;
  emailUnderlineLabel?: string;
  onValueChange: (key: BasicFieldType["key"], value: string) => void;
  onIconChange: (key: BasicFieldType["key"], icon: string) => void;
  onToggleEmailUnderline?: () => void;
  onToggleVisibility: (fieldId: string, isVisible: boolean) => void;
  onDelete: (fieldId: string) => void;
  onReorderEnd: () => void;
}

const BasicFieldRow: React.FC<BasicFieldRowProps> = React.memo(
  ({
    field,
    value,
    selectedIcon,
    labelText,
    emailUnderline,
    emailUnderlineLabel,
    onValueChange,
    onIconChange,
    onToggleEmailUnderline,
    onToggleVisibility,
    onDelete,
    onReorderEnd,
  }) => {
    return (
      <Reorder.Item
        value={field}
        id={field.id}
        className="group touch-none list-none"
        dragListener={field.key !== "name" && field.key !== "title"}
        onDragEnd={onReorderEnd}
      >
        <motion.div
          {...itemAnimations}
          className={cn(
            "flex items-center gap-2 px-3 py-4",
            "bg-card",
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
                  "text-muted-foreground",
                  "hover:text-foreground",
                  "transition-colors duration-200"
                )}
              />
            </div>
          )}

          <div className="flex flex-1 min-w-0 items-center">
            {field.key !== "name" && field.key !== "title" && (
              <IconSelector
                value={selectedIcon}
                onChange={(icon) => onIconChange(field.key, icon)}
              />
            )}
            <div className="w-14 shrink-0 ml-1 text-sm font-medium text-foreground">
              {labelText}
            </div>
            <div className="relative flex-1 min-w-0">
              <Field
                label=""
                value={value}
                onChange={(nextValue) => onValueChange(field.key, nextValue)}
                placeholder={`请输入${field.label}`}
                type={field.type}
                className={field.key === "email" ? "pr-12" : undefined}
              />
              {field.key === "email" && (
                <div
                  className="absolute right-1 top-1/2 flex h-5 -translate-y-1/2 items-center border-l border-border pl-1"
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={emailUnderlineLabel}
                          aria-pressed={emailUnderline ?? false}
                          className="h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90"
                          onClick={onToggleEmailUnderline}
                        >
                          <Underline className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="border-0 bg-foreground px-2 py-1 text-xs text-background"
                      >
                        {emailUnderlineLabel}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "shrink-0 h-8 px-2",
                "text-neutral-500 dark:text-muted-foreground",
                "hover:text-neutral-700 dark:hover:text-foreground"
              )}
              onClick={() => onToggleVisibility(field.id, !field.visible)}
            >
              {field.visible ? (
                <Eye className="w-4 h-4 text-primary" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>

            {field.key !== "name" && field.key !== "title" && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "shrink-0 h-8 px-2",
                  "text-neutral-500 dark:text-muted-foreground",
                  "hover:text-red-600 dark:hover:text-red-400"
                )}
                onClick={() => onDelete(field.id)}
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </Button>
            )}
          </div>
        </motion.div>
      </Reorder.Item>
    );
  }
);

const BasicPanel: React.FC = () => {
  const basic = useResumeStore((state) => state.activeResume?.basic);
  const updateBasicInfo = useResumeStore((state) => state.updateBasicInfo);
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
  const basicFieldsRef = useRef(basicFields);
  const customFieldsRef = useRef(customFields);
  const t = useTranslations("workbench.basicPanel");

  useEffect(() => {
    basicFieldsRef.current = basicFields;
  }, [basicFields]);

  useEffect(() => {
    customFieldsRef.current = customFields;
  }, [customFields]);

  const handleBasicReorder = useCallback((newOrder: BasicFieldType[]) => {
    basicFieldsRef.current = newOrder;
    setBasicFields(newOrder);
  }, []);

  const commitBasicReorder = useCallback(() => {
    updateBasicInfo({
      fieldOrder: basicFieldsRef.current,
    });
  }, [updateBasicInfo]);

  const handleFieldValueChange = useCallback(
    (key: BasicFieldType["key"], value: string) => {
      updateBasicInfo({
        [key]: value,
      });
    },
    [updateBasicInfo]
  );

  const handleFieldIconChange = useCallback(
    (key: BasicFieldType["key"], icon: string) => {
      const currentIcons =
        useResumeStore.getState().activeResume?.basic?.icons || {};
      updateBasicInfo({
        icons: {
          ...currentIcons,
          [key]: icon,
        },
      });
    },
    [updateBasicInfo]
  );

  const handleToggleEmailUnderline = useCallback(() => {
    const currentUnderline =
      useResumeStore.getState().activeResume?.basic?.emailUnderline ?? false;
    updateBasicInfo({ emailUnderline: !currentUnderline });
  }, [updateBasicInfo]);

  const toggleFieldVisibility = useCallback(
    (fieldId: string, isVisible: boolean) => {
      const newFields = basicFieldsRef.current.map((field) =>
        field.id === fieldId ? { ...field, visible: isVisible } : field
      );
      basicFieldsRef.current = newFields;
      setBasicFields(newFields);
      updateBasicInfo({
        fieldOrder: newFields,
      });
    },
    [updateBasicInfo]
  );

  const deleteBasicField = useCallback(
    (fieldId: string) => {
      const fieldToDelete = basicFieldsRef.current.find(
        (field) => field.id === fieldId
      );
      if (
        fieldToDelete &&
        (fieldToDelete.key === "name" || fieldToDelete.key === "title")
      ) {
        return;
      }

      const updatedFields = basicFieldsRef.current.filter(
        (field) => field.id !== fieldId
      );
      basicFieldsRef.current = updatedFields;
      setBasicFields(updatedFields);
      updateBasicInfo({
        fieldOrder: updatedFields,
      });
    },
    [updateBasicInfo]
  );

  const addCustomField = useCallback(() => {
    const fieldToAdd: CustomFieldType = {
      id: generateUUID(),
      label: "",
      value: "",
      icon: "User",
      visible: true,
      displayLabel: false,
    };
    const updatedFields = [...customFieldsRef.current, fieldToAdd];
    customFieldsRef.current = updatedFields;
    setCustomFields(updatedFields);
    updateBasicInfo({
      customFields: updatedFields,
    });
  }, [updateBasicInfo]);

  const updateCustomField = useCallback(
    (updatedField: CustomFieldType) => {
      const updatedFields = customFieldsRef.current.map((field) =>
        field.id === updatedField.id ? updatedField : field
      );
      customFieldsRef.current = updatedFields;
      setCustomFields(updatedFields);
      updateBasicInfo({
        customFields: updatedFields,
      });
    },
    [updateBasicInfo]
  );

  const deleteCustomField = useCallback(
    (id: string) => {
      const updatedFields = customFieldsRef.current.filter(
        (field) => field.id !== id
      );
      customFieldsRef.current = updatedFields;
      setCustomFields(updatedFields);
      updateBasicInfo({
        customFields: updatedFields,
      });
    },
    [updateBasicInfo]
  );

  const handleCustomFieldsReorder = useCallback(
    (newOrder: CustomFieldType[]) => {
      customFieldsRef.current = newOrder;
      setCustomFields(newOrder);
    },
    []
  );

  const commitCustomFieldsReorder = useCallback(() => {
    updateBasicInfo({
      customFields: customFieldsRef.current,
    });
  }, [updateBasicInfo]);

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-medium">{t("layout")}</h2>
          <div className=" bg-card rounded-lg">
            <AlignSelector
              value={basic?.layout || "left"}
              onChange={(value) =>
                updateBasicInfo({
                  ...basic,
                  layout: value,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">{t("title")}</h2>
          </div>

          <div className="space-y-4">
            <motion.div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-3 border border-border"
              >
                <PhotoUpload />
              </motion.div>

              <motion.div className="space-y-6">
                <motion.div className="space-y-3">
                  <motion.h3 className="font-medium text-neutral-900 dark:text-foreground px-1">
                    {t("basicField")}
                  </motion.h3>
                  <AnimatePresence mode="popLayout">
                    <Reorder.Group
                      axis="y"
                      as="div"
                      values={basicFields}
                      onReorder={handleBasicReorder}
                      className="space-y-3"
                    >
                      {basicFields.map((field) => (
                        <BasicFieldRow
                          key={field.id}
                          field={field}
                          value={(basic?.[field.key] as string) ?? ""}
                          selectedIcon={basic?.icons?.[field.key] || "User"}
                          labelText={t(`basicFields.${field.key}`)}
                          emailUnderline={
                            field.key === "email"
                              ? (basic?.emailUnderline ?? false)
                              : undefined
                          }
                          emailUnderlineLabel={
                            field.key === "email"
                              ? t("emailUnderline")
                              : undefined
                          }
                          onValueChange={handleFieldValueChange}
                          onIconChange={handleFieldIconChange}
                          onToggleEmailUnderline={
                            field.key === "email"
                              ? handleToggleEmailUnderline
                              : undefined
                          }
                          onToggleVisibility={toggleFieldVisibility}
                          onDelete={deleteBasicField}
                          onReorderEnd={commitBasicReorder}
                        />
                      ))}
                    </Reorder.Group>
                  </AnimatePresence>
                </motion.div>

                <motion.div className="space-y-3">
                  <motion.h3 className="font-medium text-neutral-900 dark:text-foreground px-1">
                    {t("customField")}
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
                            onReorderEnd={commitCustomFieldsReorder}
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
                      {t("customFields.addButton")}
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
                      <motion.h3 className="font-medium text-neutral-900 dark:text-foreground px-1">
                        {t("githubContributions")}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicPanel;
