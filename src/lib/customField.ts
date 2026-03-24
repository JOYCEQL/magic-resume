import { CustomFieldType } from "@/types/resume";

const trim = (value?: string) => value?.trim() || "";

export const getCustomFieldDisplayText = (
  field: Pick<CustomFieldType, "label" | "value" | "displayLabel">
) => {
  const label = trim(field.label);
  const value = trim(field.value);

  if (field.displayLabel) {
    return label || value;
  }

  return value;
};

export const shouldShowCustomFieldLabelPrefix = (
  field: Pick<CustomFieldType, "label" | "displayLabel">
) => {
  return !field.displayLabel && Boolean(trim(field.label));
};
