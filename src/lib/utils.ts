import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { RESUME_DATE_FORMATS, type ResumeDateFormat } from "@/types/resume"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DATE_RANGE_SEPARATOR = " - ";
// "YYYY-MM" 自带短横线，区间改用 en dash，避免出现 "2024-06 - 2025-08" 这种难以分辨的写法
const DASH_FORMAT_RANGE_SEPARATOR = " – ";

/**
 * 校验 dateFormat 是否为受支持的预设值。
 * 简历数据存储在本地（也可能来自导入的 JSON），非法值一律视为未设置，回退到历史默认行为。
 */
export function normalizeDateFormat(value: unknown): ResumeDateFormat | undefined {
  return typeof value === "string" &&
    (RESUME_DATE_FORMATS as readonly string[]).includes(value)
    ? (value as ResumeDateFormat)
    : undefined;
}

function getRangeSeparator(dateFormat?: ResumeDateFormat): string {
  return dateFormat === "YYYY-MM" ? DASH_FORMAT_RANGE_SEPARATOR : DATE_RANGE_SEPARATOR;
}

function parseToDate(dateStr: string): Date | null {
  let year: number | null = null;
  let month: number | null = null;

  if (dateStr.match(/^\d{4}-\d{2}$/)) {
    const parts = dateStr.split("-");
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = dateStr.split("-");
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  } else if (dateStr.match(/^\d{4}\.\d{2}$/)) {
    const parts = dateStr.split(".");
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  } else if (dateStr.match(/^\d{4}\/\d{2}$/)) {
    const parts = dateStr.split("/");
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
  }

  if (year !== null && month !== null) {
      return new Date(Date.UTC(year, month - 1, 1));
  }
  return null;
}

/** 未设置 dateFormat 时的历史默认格式化逻辑，保持与改动前完全一致 */
function formatWithLegacyDefault(date: Date, dateStr: string, locale: string): string {
  try {
      if (locale === "zh" || locale === "zh-CN") {
          return `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      }
      const formatter = new Intl.DateTimeFormat(locale, { 
          year: 'numeric', 
          month: '2-digit',
          timeZone: 'UTC' 
      });
      return formatter.format(date);
  } catch (e) {
      return dateStr;
  }
}

function formatWithPreset(
  date: Date,
  dateStr: string,
  locale: string,
  dateFormat: ResumeDateFormat
): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  try {
    switch (dateFormat) {
      case "YYYY/MM":
        return `${year}/${month}`;
      case "YYYY.MM":
        return `${year}.${month}`;
      case "YYYY-MM":
        return `${year}-${month}`;
      case "MM/YYYY":
        return `${month}/${year}`;
      case "short-month":
        if (locale === "zh" || locale === "zh-CN") {
          return `${year}年${month}月`;
        }
        return new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(date);
      default:
        return dateStr;
    }
  } catch (e) {
    return dateStr;
  }
}

export function formatDateString(
  dateStr: string | undefined,
  locale: string = "zh",
  dateFormat?: ResumeDateFormat
): string {
  if (!dateStr) return "";

  if (dateStr.includes(DATE_RANGE_SEPARATOR)) {
    const [start, end] = dateStr.split(DATE_RANGE_SEPARATOR);
    return formatDateRange(start, end, locale, dateFormat);
  }

  const date = parseToDate(dateStr);
  if (!date) return dateStr;

  const preset = normalizeDateFormat(dateFormat);
  return preset
    ? formatWithPreset(date, dateStr, locale, preset)
    : formatWithLegacyDefault(date, dateStr, locale);
}

export function formatDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
  locale: string = "zh",
  dateFormat?: ResumeDateFormat
): string {
  const start = formatDateString(startDate, locale, dateFormat).trim();
  const end = formatDateString(endDate, locale, dateFormat).trim();

  return [start, end]
    .filter(Boolean)
    .join(getRangeSeparator(normalizeDateFormat(dateFormat)));
}
