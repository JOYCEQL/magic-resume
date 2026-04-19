import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DATE_RANGE_SEPARATOR = " - ";

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

export function formatDateString(dateStr: string | undefined, locale: string = "zh"): string {
  if (!dateStr) return "";

  if (dateStr.includes(DATE_RANGE_SEPARATOR)) {
    const [start, end] = dateStr.split(DATE_RANGE_SEPARATOR);
    return formatDateRange(start, end, locale);
  }

  const date = parseToDate(dateStr);
  if (!date) return dateStr;

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

export function formatDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
  locale: string = "zh"
): string {
  const start = formatDateString(startDate, locale).trim();
  const end = formatDateString(endDate, locale).trim();

  return [start, end].filter(Boolean).join(DATE_RANGE_SEPARATOR);
}
