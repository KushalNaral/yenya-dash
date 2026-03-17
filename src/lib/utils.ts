import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CalendarDate, getLocalTimeZone, parseDate, type DateValue } from "@internationalized/date";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toISODateString(value: Date | string | null): string | null {
  if (!value) return null;

  if (typeof value === "string") return value;

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  try {
    const date = new Date(value as Date | string | number);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.error("Error converting date to ISO string", error);
  }

  return null;
}

/**
 * Convert Date or string to CalendarDate for Calendar component (reka-ui)
 * Uses timezone-aware conversion to prevent date shifting issues
 * @param value - Date object, ISO string (YYYY-MM-DD), or null/undefined
 * @returns CalendarDate object or undefined
 */
export function toCalendarDate(value: Date | string | null | undefined): CalendarDate | undefined {
  if (!value) return undefined;

  try {
    if (value instanceof Date) {
      return new CalendarDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
    } else if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return parseDate(value);
      }
      const date = new Date(value);
      if (isNaN(date.getTime())) return undefined;
      return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
    }
  } catch (error) {
    console.error("Error converting to CalendarDate:", error);
    return undefined;
  }

  return undefined;
}

/**
 * Convert CalendarDate or CalendarDateTime to JavaScript Date
 * Uses timezone-aware conversion to prevent date shifting issues
 * @param value - CalendarDate, CalendarDateTime, or null/undefined
 * @returns JavaScript Date object or null
 */
export function fromCalendarDate(value: DateValue | any | null | undefined): Date | null {
  if (!value) return null;

  try {
    if (
      value &&
      typeof value === "object" &&
      "year" in value &&
      "month" in value &&
      "day" in value
    ) {
      const dateValue = value as DateValue;
      return dateValue.toDate(getLocalTimeZone());
    }
  } catch (error) {
    console.error("Error converting from CalendarDate:", error);
    return null;
  }

  return null;
}
