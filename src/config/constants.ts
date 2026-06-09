import { BasicFieldType } from "@/types/resume";
import type { Locale } from "@/i18n/config";

export const DEFAULT_FIELD_ORDER: BasicFieldType[] = [
  { id: "1", key: "name", label: "姓名", type: "text", visible: true },
  { id: "2", key: "title", label: "职位", type: "text", visible: true },
  {
    id: "3",
    key: "employementStatus",
    label: "状态",
    type: "text",
    visible: true,
  },
  { id: "4", key: "birthDate", label: "生日", type: "date", visible: true },
  { id: "5", key: "email", label: "邮箱", type: "text", visible: true },
  { id: "6", key: "phone", label: "电话", type: "text", visible: true },
  { id: "7", key: "location", label: "所在地", type: "text", visible: true },
];

export const DEFAULT_FIELD_ORDER_EN: BasicFieldType[] = [
  { id: "1", key: "name", label: "Name", type: "text", visible: true },
  { id: "2", key: "title", label: "Title", type: "text", visible: true },
  {
    id: "3",
    key: "employementStatus",
    label: "Status",
    type: "text",
    visible: true,
  },
  { id: "4", key: "birthDate", label: "Birth Date", type: "date", visible: true },
  { id: "5", key: "email", label: "Email", type: "text", visible: true },
  { id: "6", key: "phone", label: "Phone", type: "text", visible: true },
  { id: "7", key: "location", label: "Location", type: "text", visible: true },
];

export const DEFAULT_FIELD_ORDER_RU: BasicFieldType[] = [
  { id: "1", key: "name", label: "Имя", type: "text", visible: true },
  { id: "2", key: "title", label: "Должность", type: "text", visible: true },
  {
    id: "3",
    key: "employementStatus",
    label: "Статус",
    type: "text",
    visible: true,
  },
  { id: "4", key: "birthDate", label: "Дата рождения", type: "date", visible: true },
  { id: "5", key: "email", label: "Email", type: "text", visible: true },
  { id: "6", key: "phone", label: "Телефон", type: "text", visible: true },
  { id: "7", key: "location", label: "Местоположение", type: "text", visible: true },
];

const FIELD_ORDER_BY_LOCALE: Record<Locale, BasicFieldType[]> = {
  zh: DEFAULT_FIELD_ORDER,
  en: DEFAULT_FIELD_ORDER_EN,
  ru: DEFAULT_FIELD_ORDER_RU,
};

export function getDefaultFieldOrder(locale: Locale): BasicFieldType[] {
  return FIELD_ORDER_BY_LOCALE[locale] ?? DEFAULT_FIELD_ORDER;
}

export const GITHUB_REPO_URL = "https://github.com/JOYCEQL/magic-resume";

export const PDF_EXPORT_CONFIG = {
  SERVER_URL: "https://api.magicv.art/generate-pdf",
  TIMEOUT: 45000,
  MAX_RETRY: 2,
  MAX_CONTENT_SIZE: 5 * 1024 * 1024
} as const;
