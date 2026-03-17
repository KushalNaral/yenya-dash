import type { HTMLAttributes } from "vue";

export type ShowIfCondition = {
  field: string;
  value?: any;
  values?: any[];
  operator: "equals" | "notEquals" | "in" | "notIn" | "true" | "false";
};

export interface FormField<T = any> {
  type:
    | "text"
    | "number"
    | "email"
    | "password"
    | "select"
    | "multi-select"
    | "tree-select"
    | "file"
    | "multiple-file"
    | "date"
    | "checkbox"
    | "radio"
    | "textarea"
    | "switch"
    | "searchable-select"
    | "component";
  dateLayout?: "month-and-year" | "month-only" | "year-only";
  name: keyof T extends string ? keyof T : string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: any; label: string; children?: Array<{ value: any; label: string }> }>;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean | ((data?: T) => boolean);
  helpText?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  icon?: any;
  showIf?: ShowIfCondition | ShowIfCondition[];
  validator?: (value: any) => string | boolean;
  group?: string;
  colSpan?: number;
  attributes?: HTMLAttributes & Record<string, any>;
  computedValue?: (data: T) => any;
  disableNavigation?: boolean;
  component?: any;
  componentProps?: Record<string, any> | (() => Record<string, any>);
}

export interface FormConfig<T = any> {
  fields: FormField<T>[];
  initialValues?: Partial<T>;
  title?: string;
  submitLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
  showSubmit?: boolean;
  layout?: "vertical" | "grid";
  columns?: number;
}
