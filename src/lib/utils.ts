import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateString(dateStr: string | undefined): string {
  if (!dateStr) return "";
  // Check if it matches YYYY-MM
  // If so, replace - with .
  
  if (dateStr.match(/^\d{4}-\d{2}$/)) {
      return dateStr.replace("-", ".");
  }
  
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
       // Cut off day if present? User wants "month" precision.
       return dateStr.substring(0, 7).replace("-", ".");
  }
  
  return dateStr;
}
