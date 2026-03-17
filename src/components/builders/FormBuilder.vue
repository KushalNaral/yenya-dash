<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import type { PropType } from "vue";
import { format } from "date-fns";
import { toCalendarDate, fromCalendarDate, cn } from "@/lib/utils";
import { CalendarDate } from "@internationalized/date";
import type { HTMLAttributes } from "vue";
import type { FormConfig, FormField, ShowIfCondition } from "@/types/form";
import { deepClone } from "@/helpers/essentials";
import { CalendarDateTime } from "@internationalized/date";
import Editor from "@/components/custom/Editor.vue";

const props = defineProps({
  config: {
    type: Object as PropType<FormConfig>,
    required: true,
  },
  mode: {
    type: String as PropType<"edit" | "view">,
    default: "edit",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  formId: {
    type: String,
    default: "dynamic-form",
  },
  class: {
    type: String,
    default: "",
  },
  externalErrors: {
    type: Object as PropType<Record<string, string[]>>,
    default: () => ({}),
  },
});

const emit = defineEmits(["form-submit", "update", "reset"]);

// Initialize formData from initialValues, but preserve it across config changes
// Initialize formData from initialValues using deepClone
const formData = ref<Record<string, any>>(
  deepClone(props.config.initialValues ?? {}),
);
const errors = ref<Record<string, string[]>>({});
const touched = ref<Record<string, boolean>>({});

const allErrors = computed(() => {
  return { ...errors.value, ...props.externalErrors };
});

const getCalendarDateValue = (fieldName: string) => {
  const value = formData.value[fieldName];
  return toCalendarDate(value);
};

const setDateFromCalendar = (
  fieldName: string,
  calendarDate: any | null | undefined,
) => {
  if (!calendarDate) {
    formData.value[fieldName] = null;
    return;
  }
  formData.value[fieldName] = fromCalendarDate(calendarDate);
};

const getMinDate = (field: FormField) => {
  if (field.disableNavigation && formData.value[field.name]) {
    const date = new Date(formData.value[field.name]);
    if (!isNaN(date.getTime())) {
      return new CalendarDate(date.getFullYear(), 1, 1);
    }
  }
  return undefined;
};

const getMaxDate = (field: FormField) => {
  if (field.disableNavigation && formData.value[field.name]) {
    const date = new Date(formData.value[field.name]);
    if (!isNaN(date.getTime())) {
      return new CalendarDate(date.getFullYear(), 12, 31);
    }
  }
  return undefined;
};

const toCalendarDateTime = (date: Date) => {
  return new CalendarDateTime(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
};

const getTimeFromDate = (name: string) => {
  const date = formData.value[name];
  if (!(date instanceof Date)) return "00:00:00";

  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");

  return `${h}:${m}:${s}`;
};
const setTimeForField = (name: string, time: string) => {
  const date = formData.value[name];

  if (!(date instanceof Date)) return;

  const [hours, minutes, seconds] = time.split(":").map(Number);

  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(seconds ?? 0);
  // Important: trigger reactivity
  formData.value[name] = fromCalendarDate(toCalendarDateTime(date));
  console.log(formData.value[name]);
};

const filePreviews = ref<
  Record<
    string,
    Array<{ url: string; name: string; size: number; type: string }>
  >
>({});
const isSubmitting = ref(false);
const isDirty = ref(false);
const hasUserData = ref(false); // Track if user has entered any data
const popoverOpen = ref<Record<string, boolean>>({}); // Track popover open state for date fields

/**
 * Watches for changes to config.initialValues and intelligently updates formData.
 *
 * This watcher preserves user-entered data when initialValues change (e.g., when
 * field options load asynchronously and config is recreated with incomplete initialValues).
 *
 * Behavior:
 * - If formData has more data than new initialValues, or user has entered data,
 *   it preserves existing formData and only adds new keys from initialValues
 * - If form is completely clean and new initialValues has data, it safely updates formData
 * - If both are empty or equal, it preserves the current state
 *
 * @param {Record<string, any>} newVal - The new initialValues from config
 */
watch(
  () => props.config.initialValues,
  (newVal) => {
    if (!newVal) return;

    const currentNonEmptyCount = Object.keys(formData.value).filter((key) => {
      const val = formData.value[key];
      return val !== undefined && val !== null && val !== "";
    }).length;

    const newNonEmptyCount = Object.keys(newVal).filter((key) => {
      const val = newVal[key];
      return val !== undefined && val !== null && val !== "";
    }).length;

    if (
      currentNonEmptyCount > newNonEmptyCount ||
      hasUserData.value ||
      isDirty.value
    ) {
      Object.keys(newVal).forEach((key) => {
        if (
          !(key in formData.value) ||
          formData.value[key] === undefined ||
          formData.value[key] === null ||
          formData.value[key] === ""
        ) {
          formData.value[key] = deepClone(newVal[key]);
        }
      });
    } else if (currentNonEmptyCount === 0 && newNonEmptyCount > 0) {
      formData.value = deepClone(newVal);
    }
  },
  { deep: true, immediate: false },
);

/**
 * Watches for changes to config.fields and preserves formData when field options are updated.
 *
 * This watcher ensures formData is preserved when field options are loaded asynchronously.
 * It prevents formData from being reset when field configurations change (e.g., when
 * select options are loaded from an API).
 *
 * Behavior:
 * - Preserves all existing formData values when fields change
 * - Only merges in new initial values for fields that don't exist in formData yet
 *
 * @param {FormField[]} newFields - The new fields array from config
 * @param {FormField[]} oldFields - The previous fields array from config
 */
watch(
  () => props.config.fields,
  (newFields, oldFields) => {
    if (oldFields && newFields) {
      const newInitialValues = props.config.initialValues || {};
      Object.keys(newInitialValues).forEach((key) => {
        if (!(key in formData.value)) {
          formData.value[key] = newInitialValues[key];
        }
      });
    }
  },
  { deep: false },
);

watch(
  () => formData.value,
  (newValue) => {
    isDirty.value = true;
    emit("update", newValue);
  },
  { deep: true },
);

const isEditMode = computed(() => props.mode === "edit");

const validateField = (field: FormField, value: any): string => {
  if (
    field.required &&
    (value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && !value.length))
  ) {
    return `${field.label} is required`;
  }
  if (
    ["text", "email", "password", "textarea", "editor"].includes(field.type) &&
    value
  ) {
    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Invalid email format";
    }
    if (
      field.maxLength &&
      typeof value === "string" &&
      value.length > field.maxLength
    ) {
      return `Must not exceed ${field.maxLength} characters`;
    }
  }
  if (
    field.type === "number" &&
    value !== undefined &&
    value !== null &&
    value !== ""
  ) {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return `${field.label} must be a valid number`;
    }
    if (field.min !== undefined && numValue < field.min) {
      return `Value must be at least ${field.min}`;
    }
    if (field.max !== undefined && numValue > field.max) {
      return `Value must not exceed ${field.max}`;
    }
  }
  if (field.type === "select" && value && field.options) {
    const validOptions = field.options.map((opt) => opt.value);
    // When options have not been loaded yet, skip validity check to avoid false errors
    if (validOptions.length && !validOptions.includes(value)) {
      return `Invalid selection for ${field.label}`;
    }
  }
  if (
    ["multi-select", "tree-select"].includes(field.type) &&
    value &&
    field.options
  ) {
    const validOptions = flattenOptions(field.options).map((opt) => opt.value);
    const values = Array.isArray(value) ? value : [value];
    if (values.some((val) => val && !validOptions.includes(val))) {
      return `Invalid selection for ${field.label}`;
    }
  }
  if (field.type === "date" && value) {
    let dateValue: Date | null = null;

    if (value instanceof Date) {
      dateValue = value;
    } else if (typeof value === "string") {
      dateValue = new Date(value);
    } else if (typeof value === "number") {
      dateValue = new Date(value);
    }

    if (dateValue && (isNaN(dateValue.getTime()) || !dateValue.getTime())) {
      return `${field.label} must be a valid date`;
    }
  }

  if (field.validator) {
    const customValidation = field.validator(value);
    if (customValidation !== true) {
      return typeof customValidation === "string"
        ? customValidation
        : "Invalid value";
    }
  }

  return "";
};

const validateForm = (): boolean => {
  let isValid = true;
  errors.value = {};
  props.config.fields.forEach((field) => {
    const error = validateField(field, formData.value[field.name]);
    if (error) {
      errors.value[field.name] = Array.isArray(error) ? error : [error];
      isValid = false;
    }
  });
  return isValid;
};

const isFieldVisible = (field: FormField) => {
  if (!field.showIf) return true;

  const conditions = Array.isArray(field.showIf)
    ? field.showIf
    : [field.showIf];
  return conditions.every((cond: ShowIfCondition) => {
    const value = formData.value[cond.field];
    const target = cond.value ?? cond.values;

    switch (cond.operator) {
      case "equals":
        return value === target;
      case "notEquals":
        return value !== target;
      case "in":
        // If value is an array, check if it includes any value from target
        if (Array.isArray(value) && Array.isArray(target)) {
          return target.some((t) => value.includes(t));
        }
        // If target is an array, check if it includes the value
        if (Array.isArray(target)) {
          return target.includes(value);
        }
        // If value is an array, check if it includes the target
        if (Array.isArray(value)) {
          return value.includes(target);
        }
        return target.includes(value);
      case "notIn":
        // If value is an array, check if it doesn't include any value from target
        if (Array.isArray(value) && Array.isArray(target)) {
          return !target.some((t) => value.includes(t));
        }
        // If target is an array, check if it doesn't include the value
        if (Array.isArray(target)) {
          return !target.includes(value);
        }
        // If value is an array, check if it doesn't include the target
        if (Array.isArray(value)) {
          return !value.includes(target);
        }
        return !target.includes(value);
      case "true":
        return !!value;
      case "false":
        return !value;
      default:
        return true;
    }
  });
};

const visibleFields = computed(() => {
  return props.config.fields.filter((field: FormField) =>
    isFieldVisible(field),
  );
});

/**
 * Group visible fields by their group property while preserving original order
 * Returns an array of groups, each containing group name and fields
 * Fields appear in the same order as defined in the form configuration
 * Consecutive fields with the same group are grouped together
 */
const groupedFields = computed(() => {
  const result: Array<{ groupName: string | null; fields: FormField[] }> = [];
  let currentGroup: { groupName: string | null; fields: FormField[] } | null =
    null;

  visibleFields.value.forEach((field) => {
    const fieldGroup = field.group || null;

    if (fieldGroup) {
      if (currentGroup && currentGroup.groupName === fieldGroup) {
        currentGroup.fields.push(field);
      } else {
        if (currentGroup) {
          result.push(currentGroup);
        }
        currentGroup = { groupName: fieldGroup, fields: [field] };
      }
    } else {
      if (currentGroup) {
        result.push(currentGroup);
        currentGroup = null;
      }
      const lastItem = result[result.length - 1];
      if (lastItem && lastItem.groupName === null) {
        lastItem.fields.push(field);
      } else {
        result.push({ groupName: null, fields: [field] });
      }
    }
  });

  if (currentGroup) {
    result.push(currentGroup);
  }

  return result;
});

/**
 * Watches for changes to visibleFields and cleans up formData for truly hidden fields.
 *
 * This watcher only deletes formData for fields that are completely removed from the
 * config, not for fields that are temporarily hidden due to conditional visibility
 * or because options are still loading.
 *
 * Behavior:
 * - Identifies fields that were visible but are now hidden
 * - Only deletes formData if the field is completely removed from config.fields
 * - Preserves formData for fields that are temporarily hidden (e.g., by showIf conditions)
 *
 * @param {FormField[]} newFields - The new visible fields array
 * @param {FormField[]} oldFields - The previous visible fields array
 */
// Function to clear a field's data
const clearFieldData = (fieldName: string, fieldConfig?: FormField) => {
  let resetTo: any = null;

  // Determine the appropriate reset value based on field type
  if (fieldConfig) {
    if (fieldConfig.type === "multiple-file") {
      resetTo = [];
    } else if (fieldConfig.type === "tree-select") {
      resetTo = null;
    } else if (
      fieldConfig.type === "checkbox" ||
      fieldConfig.type === "switch"
    ) {
      resetTo = false;
    } else if (fieldConfig.type === "radio") {
      resetTo = null;
    } else {
      resetTo = null;
    }
  } else {
    resetTo = null;
  }

  formData.value[fieldName] = resetTo;
  delete errors.value[fieldName];
  touched.value[fieldName] = false;
  revokeFilePreviews(fieldName);
};

// Watch visibleFields to clear fields when they become hidden
watch(visibleFields, (newFields, oldFields) => {
  if (oldFields && newFields) {
    const oldFieldNames = oldFields.map((f) => f.name);
    const newFieldNames = newFields.map((f) => f.name);
    const nowHidden = oldFieldNames.filter(
      (name) => !newFieldNames.includes(name),
    );

    const allFieldNames = props.config.fields.map((f) => f.name);
    nowHidden.forEach((fieldName) => {
      const fieldConfig = props.config.fields.find((f) => f.name === fieldName);
      const isRemoved = !allFieldNames.includes(fieldName);

      if (isRemoved) {
        delete formData.value[fieldName];
        delete errors.value[fieldName];
        delete touched.value[fieldName];
        revokeFilePreviews(fieldName);
        return;
      }

      // Field is still in config but hidden by showIf — clear its data
      clearFieldData(fieldName, fieldConfig);
    });
  }
});

/**
 * Proactively clears formData for fields whose showIf conditions are no longer met.
 *
 * - Tracks fields in `clearingFields` to prevent infinite loops when clearing/resetting.
 * - Watches only those form fields that are referenced in any field's showIf condition
 *   (the "dependent fields") to improve performance.
 * - On dependent field change, checks all fields with showIf: if they are hidden but have data,
 *   their data is reset using clearFieldData.
 * - Ensures only fields whose values differ from the default reset value are cleared,
 *   and prevents accidental double-clearing with a microtask to remove from clearingFields set.
 *
 * This mechanism ensures that hidden fields do not retain stale data, but also avoids
 * triggering unnecessary reactivity or infinite loops.
 */
const clearingFields = new Set<string>();

const getDependentFields = (): Set<string> => {
  const dependentFields = new Set<string>();
  props.config.fields.forEach((field) => {
    if (field.showIf) {
      const conditions = Array.isArray(field.showIf)
        ? field.showIf
        : [field.showIf];
      conditions.forEach((cond: ShowIfCondition) => {
        if (cond.field) {
          dependentFields.add(cond.field);
        }
      });
    }
  });
  return dependentFields;
};

watch(
  () => {
    // Track only fields referenced in showIf in a reactive way
    const dependentFields = getDependentFields();
    const watchedData: Record<string, any> = {};
    dependentFields.forEach((fieldName) => {
      watchedData[fieldName] = formData.value[fieldName];
    });
    return watchedData;
  },
  () => {
    props.config.fields.forEach((field) => {
      if (field.showIf && !isFieldVisible(field)) {
        // Prevent double clearing
        if (clearingFields.has(field.name)) {
          return;
        }

        const currentValue = formData.value[field.name];

        // Determine reset value by field type
        let resetTo: any = null;
        if (field.type === "multiple-file") {
          resetTo = [];
        } else if (field.type === "tree-select") {
          resetTo = null;
        } else if (field.type === "checkbox" || field.type === "switch") {
          resetTo = false;
        } else {
          resetTo = null;
        }

        // Only clear if there is something to clear
        const needsClearing =
          currentValue !== null &&
          currentValue !== undefined &&
          currentValue !== "" &&
          currentValue !== resetTo &&
          !(
            Array.isArray(currentValue) &&
            currentValue.length === 0 &&
            Array.isArray(resetTo) &&
            resetTo.length === 0
          ) &&
          !(
            Array.isArray(currentValue) &&
            currentValue.length === 0 &&
            resetTo === null
          );

        if (needsClearing) {
          clearingFields.add(field.name);
          clearFieldData(field.name, field);
          Promise.resolve().then(() => {
            clearingFields.delete(field.name);
          });
        }
      }
    });
  },
  { deep: true, immediate: false },
);

/**
 * Watches for changes to formData and updates fields with computedValue.
 */
watch(
  () => formData.value,
  (newVal) => {
    props.config.fields.forEach((field) => {
      if (field.computedValue) {
        const computedVal = field.computedValue(newVal);
        if (formData.value[field.name] !== computedVal) {
          formData.value[field.name] = computedVal;
        }
      }
    });
  },
  { deep: true },
);
const updateFilePreviews = (
  field: FormField,
  files: File | File[] | string | any | null,
) => {
  // Only revoke if the existing previews are Blob URLs (created by URL.createObjectURL)
  if (filePreviews.value[field.name]) {
    filePreviews.value[field.name].forEach((preview) => {
      if (preview.url && preview.url.startsWith("blob:")) {
        URL.revokeObjectURL(preview.url);
      }
    });
  }

  filePreviews.value[field.name] = [];
  if (!files) return;

  const fileList = Array.isArray(files) ? files : [files];
  fileList.forEach((file) => {
    if (file && file instanceof File) {
      const preview = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      };
      filePreviews.value[field.name].push(preview);
    } else if (
      typeof file === "string" &&
      (file.startsWith("http") || file.startsWith("/"))
    ) {
      // It's an existing URL
      filePreviews.value[field.name].push({
        name: file.split("/").pop() || "Existing File",
        size: 0,
        type: file.match(/\.(jpg|jpeg|png|gif|webp)$/i)
          ? "image/jpeg"
          : "application/octet-stream",
        url: file,
      });
    } else if (file && typeof file === "object" && file.url) {
      // It's an asset object
      filePreviews.value[field.name].push({
        name: file.name || file.url.split("/").pop() || "Existing File",
        size: file.size || 0,
        type:
          file.type ||
          (file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            ? "image/jpeg"
            : "application/octet-stream"),
        url: file.url,
      });
    }
  });
};

// Initialize file previews from initial formData
watch(
  () => formData.value,
  (newVal) => {
    props.config.fields.forEach((field) => {
      if (["file", "multiple-file"].includes(field.type)) {
        const value = newVal[field.name];
        // Only update if we have a value and no previews yet, or if the value is a string/object (existing)
        // and we don't want to overwrite new file selections
        if (
          value &&
          (!filePreviews.value[field.name] ||
            filePreviews.value[field.name].length === 0)
        ) {
          if (
            typeof value === "string" ||
            (typeof value === "object" && !(value instanceof File))
          ) {
            updateFilePreviews(field, value);
          }
        }
      }
    });
  },
  { immediate: true, deep: true },
);

const handleSubmit = () => {
  props.config.fields.forEach((field) => {
    touched.value[field.name] = true;
  });
  if (validateForm()) {
    isSubmitting.value = true;
    emit("form-submit", formData.value);
    isDirty.value = false;
    isSubmitting.value = false;
  }
};

const handleInput = (field: FormField, value: any) => {
  formData.value[field.name] = value;
  touched.value[field.name] = true;
  hasUserData.value = true;
  const err = validateField(field, value);
  errors.value[field.name] = err ? (Array.isArray(err) ? err : [err]) : [];
  if (["file", "multiple-file"].includes(field.type)) {
    // If it's a new file upload, it will be handled by updateFilePreviews which is called from @change
    // handleInput is called with the value, so we can check if it's already a File or just a URL
    if (!(value instanceof File) && !Array.isArray(value)) {
      updateFilePreviews(field, value);
    }
  }
};

const handleBlur = (field: FormField) => {
  touched.value[field.name] = true;
  const err = validateField(field, formData.value[field.name]);
  errors.value[field.name] = err ? (Array.isArray(err) ? err : [err]) : [];
};

// const handleReset = () => {
//   formData.value = { ...props.config.initialValues };
//   errors.value = {};
//   touched.value = {};
//   isDirty.value = false;
//   Object.keys(filePreviews.value).forEach(revokeFilePreviews);
//   filePreviews.value = {};
//   emit("reset");
// };

const formatDate = (value: unknown) => {
  if (!value) return "";
  // Accept Date, string (ISO or yyyy-mm-dd), or number
  let d: Date;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "string" || typeof value === "number") {
    d = new Date(value);
  } else {
    return "";
  }
  if (isNaN(d.getTime())) return "";
  // Display dates as yyyy-MM-dd
  return format(d, "yyyy-MM-dd");
};

const getOptionLabel = (field: FormField, value: any): string => {
  if (!field.options) return value?.toString() || "";
  const flatOptions = flattenOptions(field.options);
  const option = flatOptions.find((opt) => opt.value === value);
  return option ? option.label : value?.toString() || "";
};

const flattenOptions = (options: any[]): any[] => {
  return options.reduce((acc: any[], opt: any) => {
    acc.push(opt);
    if (opt.children) {
      acc.push(...flattenOptions(opt.children));
    }
    return acc;
  }, []);
};

const revokeFilePreviews = (name: string) => {
  if (filePreviews.value[name]) {
    filePreviews.value[name].forEach((preview) => {
      if (preview.url) URL.revokeObjectURL(preview.url);
    });
    filePreviews.value[name] = [];
  }
};

const removeFile = (field: FormField, index: number) => {
  const currentFiles = formData.value[field.name];
  if (Array.isArray(currentFiles)) {
    const newFiles = currentFiles.filter((_, i) => i !== index);
    handleInput(field, newFiles.length > 0 ? newFiles : []);
  } else {
    handleInput(field, null);
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getFileIcon = (file: { type: string }) => {
  return file.type.startsWith("image/") ? "mdi-image" : "mdi-file";
};

const formatErrorMessage = (error: string | string[] | undefined): string => {
  if (!error) return "";
  if (Array.isArray(error)) {
    return error.join(", ");
  }
  return error;
};

const getFieldClasses = computed(() => {
  const layout = props.config.layout || "vertical";

  if (layout === "vertical") {
    return "flex flex-col gap-6 p-1";
  }

  // Grid layout
  const columns =
    props.config.columns || (props.config.fields.length > 1 ? 2 : 1);
  return `grid grid-cols-1 md:grid-cols-${Math.min(columns, 12)} gap-6 p-1 items-start w-full`;
});

const getDisabledState = (field: FormField | undefined) =>
  computed(() => {
    if (!field) return false;

    if (
      field.attributes &&
      "readonly" in field.attributes &&
      field.attributes.readonly
    ) {
      return true;
    }

    if (!field.disabled) return false;

    if (typeof field.disabled === "function") {
      return field.disabled(formData.value);
    }

    return !!field.disabled;
  });

const getFilteredAttributes = (
  attributes?: HTMLAttributes & Record<string, any>,
): Record<string, any> => {
  if (!attributes) return {};

  const conflictingProps = [
    "dir",
    "open",
    "defaultOpen",
    "defaultValue",
    "modelValue",
    "value",
    "checked",
    "selected",
  ];

  const filtered: Record<string, any> = {};
  Object.keys(attributes).forEach((key) => {
    if (!conflictingProps.includes(key)) {
      filtered[key] = attributes[key];
    }
  });

  return filtered;
};

onUnmounted(() => {
  Object.keys(filePreviews.value).forEach(revokeFilePreviews);
});
</script>

<template>
  <div :class="cn('w-full p-2', props.class)">
    <template v-if="props.loading">
      <div class="flex items-center justify-center py-12">
        <div
          class="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"
        />
        <span class="ml-3 text-muted-foreground text-lg">Loading...</span>
      </div>
    </template>

    <template v-else-if="isEditMode">
      <form
        :id="props.formId"
        @submit.prevent="handleSubmit"
        :class="getFieldClasses"
        :aria-label="props.config.title || 'Dynamic Form'"
        novalidate
      >
        <template
          v-for="(group, groupIndex) in groupedFields"
          :key="group.groupName || 'ungrouped'"
        >
          <div
            v-if="group.groupName"
            class="col-span-full border-b-2 border-primary/30"
          >
            <h3 class="text-lg font-semibold text-foreground capitalize">
              {{ group.groupName.replace(/_/g, " ") }}
            </h3>
          </div>

          <template v-for="field in group.fields" :key="field.name">
            <div
              class="space-y-2 animate-slide-in"
              :class="[field.colSpan ? `col-span-${field.colSpan}` : '']"
            >
              <div
                v-if="field.type !== 'component' && field.label"
                class="flex items-center gap-3"
              >
                <Label
                  :for="field.type === 'date' ? '' : field.name"
                  :name="field.name"
                  class="font-semibold text-foreground/80"
                  :class="{
                    'text-destructive':
                      (touched[field.name] ||
                        (props.externalErrors &&
                          props.externalErrors[field.name])) &&
                      allErrors[field.name],
                  }"
                >
                  {{ field.label }}
                  <span
                    v-if="field.required"
                    class="text-destructive text-sm ml-1"
                    :aria-hidden="true"
                    >*</span
                  >
                </Label>
                <Tooltip v-if="field.helpText">
                  <TooltipTrigger>
                    <Iconify
                      icon="mdi-help-circle"
                      class="size-4 text-muted-foreground hover:text-primary transition-colors"
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    class="max-w-xs bg-background border shadow-sm p-2 rounded-md"
                  >
                    <p class="text-sm text-muted-foreground">
                      {{ field.helpText }}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <template
                v-if="
                  ['text', 'number', 'email', 'password'].includes(field.type)
                "
              >
                <div class="relative">
                  <Iconify
                    v-if="field.icon"
                    :icon="field.icon"
                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  />
                  <Input
                    :type="field.type"
                    :id="field.name"
                    :name="field.name"
                    :placeholder="field.placeholder"
                    :required="field.required"
                    :disabled="field.disabled"
                    :min="field.min"
                    :max="field.max"
                    :maxlength="field.maxLength"
                    v-model="formData[field.name]"
                    v-bind="field.attributes"
                    @input="handleInput(field, $event.target.value)"
                    @blur="handleBlur(field)"
                    class="form-field w-full px-4 py-2.5 rounded-lg"
                    :class="{
                      'pl-10': field.icon,
                      'border-destructive/40 hover:border-destructive/50 focus:ring-destructive/20 focus:border-destructive':
                        (touched[field.name] ||
                          (props.externalErrors &&
                            props.externalErrors[field.name])) &&
                        allErrors[field.name],
                    }"
                    :aria-invalid="
                      (touched[field.name] ||
                        (props.externalErrors &&
                          props.externalErrors[field.name])) &&
                      allErrors[field.name]
                        ? 'true'
                        : 'false'
                    "
                    :data-error="
                      (touched[field.name] ||
                        (props.externalErrors &&
                          props.externalErrors[field.name])) &&
                      allErrors[field.name]
                    "
                    :aria-describedby="`${field.name}-error`"
                  />
                </div>
              </template>

              <template v-else-if="field.type === 'select'">
                <Select
                  v-model="formData[field.name]"
                  @update:modelValue="handleInput(field, $event)"
                  @blur="handleBlur(field)"
                  :disabled="getDisabledState(field)?.value"
                  :required="field.required"
                  class="rounded-md w-full"
                  :name="field.name"
                  v-bind="getFilteredAttributes(field.attributes)"
                >
                  <SelectTrigger
                    :id="field.name"
                    :aria-label="field.label"
                    class="form-field h-[46px] w-full rounded-lg px-3 text-sm"
                    :class="{
                      'border-destructive ring-destructive/20':
                        (touched[field.name] ||
                          (props.externalErrors &&
                            props.externalErrors[field.name])) &&
                        allErrors[field.name],
                    }"
                  >
                    <SelectValue
                      :placeholder="field.placeholder || 'Select an option'"
                    />
                  </SelectTrigger>
                  <SelectContent
                    class="bg-background border border-input shadow-sm rounded-md w-full"
                  >
                    <SelectItem
                      v-for="option in field.options"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </template>

              <template
                v-else-if="['multi-select', 'tree-select'].includes(field.type)"
              >
                <MultiSelect
                  v-model="formData[field.name]"
                  :options="field.options || []"
                  :multiple="field.type === 'multi-select'"
                  :searchable="true"
                  :placeholder="field.placeholder || 'Select options...'"
                  :disabled="field.disabled"
                  :clearable="!field.required"
                  :disable-branch-nodes="field.disableBranchNodes ?? false"
                  @update:modelValue="handleInput(field, $event)"
                  @blur="handleBlur(field)"
                  class="w-full px-4 py-2.5 rounded-lg border text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 ease-out hover:border-form-field-hover focus:outline-none focus:ring-2 focus:ring-form-field-focus/20 focus:border-form-field-focus min-h-[46px]"
                  :class="{
                    'border-destructive/40 hover:border-destructive/50 focus:ring-destructive/20 focus:border-destructive':
                      (touched[field.name] ||
                        (props.externalErrors &&
                          props.externalErrors[field.name])) &&
                      allErrors[field.name],
                  }"
                  :aria-label="field.label"
                  :aria-describedby="`${field.name}-error`"
                  v-bind="field.attributes"
                />
              </template>

              <template v-else-if="['searchable-select'].includes(field.type)">
                <SearchableSelect
                  v-model="formData[field.name]"
                  :options="field.options || []"
                  :placeholder="field.placeholder || 'Select an option'"
                  @update:modelValue="handleInput(field, $event)"
                  @blur="handleBlur(field)"
                  class="w-full px-4 py-2.5 rounded-lg border text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 ease-out hover:border-form-field-hover focus:outline-none focus:ring-2 focus:ring-form-field-focus/20 focus:border-form-field-focus min-h-[46px]"
                  :class="{
                    'border-destructive/40 hover:border-destructive/50 focus:ring-destructive/20 focus:border-destructive':
                      (touched[field.name] ||
                        (props.externalErrors &&
                          props.externalErrors[field.name])) &&
                      allErrors[field.name],
                  }"
                  :aria-label="field.label"
                  :aria-describedby="`${field.name}-error`"
                  v-bind="field.attributes"
                />
              </template>

              <template
                v-else-if="['file', 'multiple-file'].includes(field.type)"
              >
                <div class="space-y-2">
                  <Label
                    :for="field.name"
                    class="flex items-center gap-4 p-4 rounded-lg border border-dashed /50 hover:bg-form-field-hover/20 hover:border-form-field-focus/50 transition-all cursor-pointer h-auto min-h-[56px] text-sm group"
                    :class="{
                      'border-destructive/40 bg-destructive/5 hover:border-destructive/50':
                        (touched[field.name] ||
                          (props.externalErrors &&
                            props.externalErrors[field.name])) &&
                        allErrors[field.name],
                      'opacity-50 cursor-not-allowed': field.disabled,
                    }"
                  >
                    <div
                      class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
                    >
                      <Iconify icon="mdi-upload" class="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span class="text-sm font-medium text-foreground">
                        {{
                          field.placeholder ||
                          (field.type === "multiple-file"
                            ? "Choose files"
                            : "Choose file")
                        }}
                      </span>
                      <p
                        v-if="field.accept"
                        class="text-xs text-muted-foreground mt-1"
                      >
                        Accepted: {{ field.accept }}
                      </p>
                    </div>
                  </Label>
                  <input
                    type="file"
                    :id="field.name"
                    :name="field.name"
                    :accept="field.accept"
                    :multiple="field.type === 'multiple-file'"
                    :required="field.required"
                    :disabled="!!field.disabled"
                    v-bind="field.attributes"
                    @change="
                      handleInput(
                        field,
                        field.type === 'multiple-file'
                          ? Array.from(
                              ($event.target as HTMLInputElement)?.files || [],
                            )
                          : ($event.target as HTMLInputElement)?.files?.[0],
                      )
                    "
                    @blur="handleBlur(field)"
                    class="hidden"
                  />
                  <div
                    v-if="filePreviews[field.name]?.length"
                    class="grid grid-cols-2 gap-3 mt-3"
                  >
                    <div
                      v-for="(preview, index) in filePreviews[field.name]"
                      :key="index"
                      class="relative group rounded-md border border-input bg-background shadow-sm hover:shadow-md transition-all"
                    >
                      <img
                        v-if="preview.url"
                        :src="preview.url"
                        :alt="preview.name"
                        class="w-full h-20 object-cover rounded-md"
                      />
                      <div
                        v-else
                        class="h-20 flex flex-col items-center justify-center bg-muted"
                      >
                        <component
                          :is="getFileIcon(preview)"
                          class="h-6 w-6 text-muted-foreground"
                        />
                        <span
                          class="text-xs text-center truncate w-full px-2"
                          >{{ preview.name }}</span
                        >
                        <span class="text-xs text-muted-foreground">{{
                          formatFileSize(preview.size)
                        }}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        class="absolute top-1 right-1 bg-background/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        @click="removeFile(field, index)"
                      >
                        <Iconify
                          icon="mdi-close"
                          class="h-4 w-4 text-destructive"
                        />
                      </Button>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else-if="field.type === 'date'">
                <div class="flex gap-4 overflow-hidden">
                  <Popover
                    :name="field.name"
                    v-model:open="popoverOpen[field.name]"
                  >
                    <PopoverTrigger as-child>
                      <Button
                        variant="outline"
                        :name="field.name"
                        :class="
                          cn(
                            'form-field w-full px-4 py-2.5 rounded-lg text-left flex items-center min-h-[46px]',
                            field.includeTime && 'w-75',
                            !formData[field.name] && 'text-muted-foreground',
                            (touched[field.name] ||
                              (props.externalErrors &&
                                props.externalErrors[field.name])) &&
                              allErrors[field.name] &&
                              'border-destructive/40 hover:border-destructive/50 focus:ring-destructive/20 focus:border-destructive',
                            field.disabled && 'opacity-50 cursor-not-allowed',
                          )
                        "
                        :disabled="!!field.disabled"
                        :aria-label="field.label"
                        v-bind="field.attributes"
                      >
                        <span class="text-left flex-1">{{
                          formData[field.name]
                            ? formatDate(formData[field.name])
                            : "Pick a date"
                        }}</span>
                        <Iconify
                          icon="mdi-calendar"
                          class="size-4 text-muted-foreground"
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      :name="field.name"
                      class="w-auto p-0 bg-background border border-input shadow-sm rounded-md"
                    >
                      <Calendar
                        :key="field.dateLayout"
                        :model-value="getCalendarDateValue(field.name)"
                        :default-placeholder="
                          toCalendarDate(field?.placeholder || 'Pick a date')
                        "
                        @update:modelValue="
                          (value) => {
                            setDateFromCalendar(field.name, value);
                            handleInput(field, formData[field.name]);
                            popoverOpen[field.name] = false;
                          }
                        "
                        :layout="field.dateLayout || 'month-and-year'"
                        initial-focus
                        :disabled="!!field.disabled"
                        :min-value="getMinDate(field)"
                        :max-value="getMaxDate(field)"
                      />
                    </PopoverContent>
                  </Popover>

                  <template v-if="field.type === 'date' && field.includeTime">
                    <div class="flex flex-col gap-3">
                      <!-- :value="formData[field.name]"
                      @update:modelValue="handleInput(field, $event)" -->
                      <Input
                        id="time-picker"
                        type="time"
                        step="1"
                        class="form-field w-full px-4 py-2.5 rounded-lg [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                        :model-value="getTimeFromDate(field.name)"
                        @update:model-value="
                          (time) => {
                            setTimeForField(field.name, time as string);
                            handleInput(field, formData[field.name]);
                          }
                        "
                      />
                    </div>
                  </template>
                </div>
              </template>

              <template v-else-if="field.type === 'checkbox'">
                <div class="flex items-center gap-3"></div>
                <Checkbox
                  :id="field.name"
                  v-model="formData[field.name]"
                  @update:modelValue="handleInput(field, $event)"
                  @blur="handleBlur(field)"
                  :disabled="!!field.disabled"
                  :aria-label="field.label"
                  :aria-describedby="`${field.name}-error`"
                  class="h-4 w-4 border-input"
                  v-bind="field.attributes"
                />
                <Label
                  :for="field.name"
                  class="text-sm font-medium text-foreground"
                  >{{ field.label }}</Label
                >
              </template>

              <template v-else-if="field.type === 'radio'">
                <RadioGroup
                  v-model="formData[field.name]"
                  @update:modelValue="handleInput(field, $event)"
                  @blur="handleBlur(field)"
                  :disabled="!!field.disabled"
                  class="space-y-2"
                  :aria-label="field.label"
                  v-bind="getFilteredAttributes(field.attributes)"
                >
                  <div
                    v-for="option in field.options"
                    :key="option.value"
                    class="flex items-center gap-3"
                  >
                    <RadioGroupItem
                      :value="option.value"
                      :id="`${field.name}-${option.value}`"
                      class="border-input"
                    />
                    <Label
                      :for="`${field.name}-${option.value}`"
                      class="text-sm font-medium text-foreground"
                      >{{ option.label }}</Label
                    >
                  </div>
                </RadioGroup>
              </template>

              <template v-else-if="field.type === 'textarea'">
                <Textarea
                  :id="field.name"
                  :name="field.name"
                  :placeholder="field.placeholder"
                  :required="field.required"
                  :disabled="field.disabled"
                  :maxlength="field.maxLength"
                  v-model="formData[field.name]"
                  v-bind="field.attributes"
                  @input="handleInput(field, $event.target.value)"
                  @blur="handleBlur(field)"
                  class="form-field w-full px-4 py-2.5 rounded-lg resize-vertical min-h-24"
                  :class="{
                    'border-destructive/40 hover:border-destructive/50 focus:ring-destructive/20 focus:border-destructive':
                      touched[field.name] && allErrors[field.name],
                  }"
                  :aria-invalid="
                    touched[field.name] && allErrors[field.name]
                      ? 'true'
                      : 'false'
                  "
                  :aria-describedby="`${field.name}-error`"
                />
              </template>

              <template v-else-if="field.type === 'editor'">
                <Editor
                  :model-value="formData[field.name]"
                  :placeholder="field.placeholder"
                  :disabled="!!field.disabled"
                  :max-length="field.maxLength"
                  @update:modelValue="
                    (val: any) => {
                      formData[field.name] = val;
                      handleInput(field, val);
                    }
                  "
                  @blur="handleBlur(field)"
                />
              </template>

              <template v-else-if="field.type === 'switch'">
                <div class="flex items-center gap-3">
                  <Switch
                    :id="field.name"
                    v-model="formData[field.name]"
                    @update:modelValue="handleInput(field, $event)"
                    @blur="handleBlur(field)"
                    :disabled="!!field.disabled"
                    :aria-label="field.label"
                    class="data-[state=checked]:bg-primary"
                    v-bind="field.attributes"
                  />
                  <Label
                    :for="field.name"
                    class="text-sm font-medium text-foreground"
                    >{{ field.label }}</Label
                  >
                </div>
              </template>

              <template
                v-else-if="field.type === 'component' && field.component"
              >
                <component
                  :is="field.component"
                  :model-value="formData"
                  v-bind="
                    typeof field.componentProps === 'function'
                      ? field.componentProps()
                      : field.componentProps || {}
                  "
                  @update:modelValue="
                    (data: Record<string, any>) => {
                      Object.assign(formData, data);
                      emit('update', { ...formData });
                    }
                  "
                />
              </template>

              <template
                v-if="
                  field.type !== 'component' &&
                  (touched[field.name] ||
                    (props.externalErrors &&
                      props.externalErrors[field.name])) &&
                  allErrors[field.name]
                "
              >
                <p
                  class="text-xs text-destructive font-medium mt-1 animate-slide-in"
                  :id="`${field.name}-error`"
                >
                  {{ formatErrorMessage(allErrors[field.name]) }}
                </p>
              </template>
            </div>
          </template>

          <!-- Separator after group (except for last group) -->
          <div
            v-if="groupIndex < groupedFields.length - 1"
            class="col-span-full border-t border-border"
          />
        </template>

        <div
          v-if="
            isEditMode && (props.config.showSubmit || props.config.showReset)
          "
          class="flex justify-end gap-3 mt-6"
        >
          <Button
            v-if="props.config.showSubmit"
            type="submit"
            :disabled="isSubmitting"
            class="py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {{ props.config.submitLabel || "Submit" }}
          </Button>
        </div>
      </form>
    </template>

    <template v-else>
      <div>
        <!-- Render grouped fields in view mode -->
        <template
          v-for="(group, groupIndex) in groupedFields"
          :key="group.groupName || 'ungrouped'"
        >
          <!-- Group Header -->
          <div
            v-if="group.groupName"
            class="mt-6 mb-4 pb-2 border-b border-border"
          >
            <h3 class="text-lg font-semibold text-foreground capitalize">
              {{ group.groupName.replace(/_/g, " ") }}
            </h3>
          </div>

          <!-- Group Fields -->
          <template v-for="field in group.fields" :key="field.name">
            <div class="space-y-3 animate-slide-in">
              <div class="flex items-center gap-3">
                <Label class="font-medium text-foreground">{{
                  field.label
                }}</Label>
                <Tooltip v-if="field.helpText">
                  <TooltipTrigger>
                    <Iconify
                      icon="mdi-help-circle"
                      class="h-4 w-4 text-muted-foreground hover:text-primary transition-colors"
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    class="max-w-xs bg-background border shadow-sm p-2 rounded-md"
                  >
                    <p class="text-sm text-muted-foreground">
                      {{ field.helpText }}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div class="p-3 rounded-md border border-input bg-background">
                <p
                  v-if="
                    [
                      'text',
                      'number',
                      'email',
                      'password',
                      'textarea',
                      'editor',
                    ].includes(field.type)
                  "
                  class="text-sm text-foreground"
                >
                  {{ formData[field.name] || "Not provided" }}
                </p>
                <p
                  v-else-if="field.type === 'select'"
                  class="text-sm text-foreground"
                >
                  {{
                    getOptionLabel(field, formData[field.name]) ||
                    "Not selected"
                  }}
                </p>
                <div
                  v-else-if="
                    ['multi-select', 'tree-select'].includes(field.type)
                  "
                  class="flex flex-wrap gap-2"
                >
                  <Badge
                    v-for="value in Array.isArray(formData[field.name])
                      ? formData[field.name]
                      : [formData[field.name]]"
                    :key="value"
                    variant="secondary"
                    class="text-xs bg-primary/10 text-primary border-primary/20"
                  >
                    {{ getOptionLabel(field, value) }}
                  </Badge>
                  <p
                    v-if="!formData[field.name]?.length"
                    class="text-sm text-muted-foreground"
                  >
                    None selected
                  </p>
                </div>
                <div
                  v-else-if="['file', 'multiple-file'].includes(field.type)"
                  class="grid grid-cols-2 gap-3"
                >
                  <div
                    v-for="(preview, index) in filePreviews[field.name] || []"
                    :key="index"
                    class="relative group rounded-md border border-input bg-background shadow-sm"
                  >
                    <img
                      v-if="preview.url"
                      :src="preview.url"
                      :alt="preview.name"
                      class="w-full h-20 object-cover rounded-md"
                    />
                    <div
                      v-else
                      class="h-20 flex flex-col items-center justify-center bg-muted"
                    >
                      <component
                        :is="getFileIcon(preview)"
                        class="h-6 w-6 text-muted-foreground"
                      />
                      <span class="text-xs text-center truncate w-full px-2">{{
                        preview.name
                      }}</span>
                      <span class="text-xs text-muted-foreground">{{
                        formatFileSize(preview.size)
                      }}</span>
                    </div>
                  </div>
                  <p
                    v-if="!filePreviews[field.name]?.length"
                    class="text-sm text-muted-foreground"
                  >
                    No files uploaded
                  </p>
                </div>
                <p
                  v-else-if="field.type === 'date'"
                  class="text-sm text-foreground"
                >
                  {{
                    formData[field.name]
                      ? formatDate(formData[field.name])
                      : "Not selected"
                  }}
                </p>
                <Badge
                  v-else-if="['checkbox', 'switch'].includes(field.type)"
                  :variant="formData[field.name] ? 'default' : 'secondary'"
                  class="text-xs"
                >
                  {{ formData[field.name] ? "Yes" : "No" }}
                </Badge>
                <p
                  v-else-if="field.type === 'radio'"
                  class="text-sm text-foreground"
                >
                  {{
                    getOptionLabel(field, formData[field.name]) ||
                    "Not selected"
                  }}
                </p>
              </div>
            </div>
          </template>

          <!-- Separator after group (except for last group) -->
          <div
            v-if="groupIndex < groupedFields.length - 1"
            class="my-6 border-t border-border"
          />
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}
</style>
