import { CalendarDate } from "@internationalized/date";

function clearForm<T extends Record<string, any>>(formData: T): T {
  const cleared: any = {};
  for (const key in formData) {
    if (Array.isArray(formData[key])) {
      cleared[key] = [];
    } else if (typeof formData[key] === "object" && formData[key] !== null) {
      cleared[key] = clearForm(formData[key]); // recursive for nested objects
    } else {
      cleared[key] = ""; // default to empty string
    }
  }
  return cleared as T;
}

function toCalendarDate(str: string | null) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new CalendarDate(y, m, d);
}

// Convert CalendarDate → string "YYYY-MM-DD"
function fromCalendarDate(date: CalendarDate | null) {
  if (!date) return "";
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function formatToGeoCordinates(unformattedCordinates: string) {
  const [latitude, longitude] = unformattedCordinates.split(",");
  return {
    latitude,
    longitude,
  };
}

/**
 * Convert Date objects to MySQL-compatible date strings (YYYY-MM-DD)
 */
/**
 * Convert Date objects to MySQL-compatible date strings (YYYY-MM-DD)
 * Recursively processes objects and arrays to find all Date objects or ISO strings.
 */
function normalizeDates(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (data instanceof Date) {
    const year = data.getFullYear();
    const month = String(data.getMonth() + 1).padStart(2, "0");
    const day = String(data.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (typeof File !== "undefined" && data instanceof File) {
    return data;
  }

  if (typeof FileList !== "undefined" && data instanceof FileList) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => normalizeDates(item));
  }

  if (typeof data === "object") {
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (
        typeof value === "string" &&
        (value.includes("T") ||
          (/^\d{4}-\d{2}-\d{2}/.exec(value) && value.includes(" ")))
      ) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime()) && value.length >= 10) {
            // Convert to YYYY-MM-DD format for date inputs
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            normalized[key] = `${year}-${month}-${day}`;
          } else {
            normalized[key] = value;
          }
        } catch {
          normalized[key] = value;
        }
      } else {
        normalized[key] = normalizeDates(value);
      }
    }
    return normalized;
  }

  return data;
}

function normalizeDate(date: Date | null) {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculate the age of a child in years and months.
 *
 * Calculation logic:
 * 1. First calculate the total number of months between the two dates
 * 2. Years = total months divided by 12 (full years)
 * 3. Months = remainder after dividing by 12 (0-11, since 12 months = 1 year)
 *
 * Example:
 * - If child is 1 year and 3 months old:
 *   - Total months = 15
 *   - age_years = 15 / 12 = 1
 *   - age_month = 15 % 12 = 3
 *
 * @param baseDate - The reference date (e.g., investigation date)
 * @param childDob - The child's date of birth
 * @returns Object with age_years and age_month (0-11)
 */
function calculateAgeOfChild(
  baseDate: Date,
  childDob: Date,
): { age_years: number; age_month: number } {
  let totalMonths =
    (baseDate.getFullYear() - childDob.getFullYear()) * 12 +
    (baseDate.getMonth() - childDob.getMonth());

  if (baseDate.getDate() < childDob.getDate()) {
    totalMonths--;
  }

  totalMonths = Math.max(0, totalMonths);

  const ageYears = Math.floor(totalMonths / 12);

  const ageMonths = totalMonths % 12;

  return {
    age_years: ageYears,
    age_month: ageMonths,
  };
}

/**
 * Convert a string to a slug
 * @param str The string to convert
 * @returns The slug
 */
function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, "-");
}
/**
 * Format a date to a string
 * @param date The date to format
 * @returns The formatted date string in YYYY-MM-DD format
 */

function formatDate(date: Date | null) {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convert a Date or date-like string to a MySQL-compatible
 * DATETIME string "YYYY-MM-DD HH:MM:SS".
 */
function formatDateTimeToMySQL(
  value?: string | Date | null,
): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
/**
 * Creates a deep copy of an object or array.
 * Preserves File objects and Date objects.
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof File) {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as any;
  }

  const clonedObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone((obj as any)[key]);
    }
  }

  return clonedObj as T;
}

function isPlainObject(v: any): v is Record<string, any> {
  return Object.prototype.toString.call(v) === "[object Object]";
}

/**
 * Recursively walk an object/array and convert any property named "status"
 * that is truthy (non-zero, non-empty string, etc.) into the number 1,
 * and falsy values into 0.
 *
 * Preserves null/undefined and non-plain objects (File, Date, etc.).
 */
function normalizeStatuses<T>(value: T): T {
  // primitives
  if (value === null || typeof value !== "object") return value;

  // arrays -> normalize each element
  if (Array.isArray(value)) {
    return value.map((el) => normalizeStatuses(el)) as unknown as T;
  }

  // non-plain objects (File, Date, etc.) -> don't walk inside
  if (!isPlainObject(value)) {
    return value;
  }

  // plain object -> walk keys
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value as Record<string, any>)) {
    if (k === "status" || k === "show_on_homepage") {
      // preserve null/undefined; if number already keep it; otherwise coerce to 0/1
      if (v === null || v === undefined) out[k] = null;
      else if (typeof v === "number") out[k] = v;
      else out[k] = Number(!!v);
    } else {
      out[k] = normalizeStatuses(v);
    }
  }
  return out as T;
}

export {
  clearForm,
  toCalendarDate,
  fromCalendarDate,
  formatToGeoCordinates,
  normalizeDates,
  normalizeDate,
  calculateAgeOfChild,
  slugify,
  formatDate,
  formatDateTimeToMySQL,
  deepClone,
  normalizeStatuses,
};
