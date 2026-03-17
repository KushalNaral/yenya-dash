import type { Component, VNode } from "vue";
import type { LucideIcon } from "lucide-vue-next";
import type { PaginatedResponse } from "@/types/pagination/pagination";

export type { PaginationMeta } from "@/types/pagination/pagination";
export type { PaginatedResponse };

/**
 * Badge variants for styling
 */
export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

/**
 * Button variants for actions
 */
export type ButtonVariant = "default" | "destructive" | "secondary" | "ghost" | "outline";

/**
 * Action display modes
 */
export type ActionDisplayMode = "dropdown" | "horizontal" | "dialog";

/**
 * Column configuration interface with enhanced typing
 */
export interface StatusSwitchConfig {
  /**
   * Function to call when status changes
   */
  onChangeStatus: (id: number | string, status: any) => Promise<void>;
  /**
   * Event key to emit after successful status change for table refresh
   */
  refreshKey?: string;
  /**
   * Field name for the status property (default: "status")
   */
  statusField?: string;
  /**
   * Field name for the ID property (default: "id")
   */
  idField?: string;
  /**
   * Value that represents active/checked state (default: "active" or 1)
   */
  activeValue?: any;
  /**
   * Value that represents inactive/unchecked state (default: "inactive" or 0)
   */
  inactiveValue?: any;
  /**
   * Success message to show (default: "Status updated successfully")
   */
  successMessage?: string;
  /**
   * Error message prefix (default: "Failed to update status")
   */
  errorMessage?: string;
}

export interface DataTableColumn<T = any> {
  accessorKey: string;
  header: string;
  sortable?: boolean;
  cell?: Component | ((props: CellComponentProps<T>) => VNode);
  cellClassName?: string;
  className?: string;
  badge?: boolean;
  badgeVariant?: (row: T) => BadgeVariant;
  formatter?: (value: any, row: T) => string;
  icon?: LucideIcon;
  onIconClick?: (row?: T) => void;
  minWidth?: string;
  maxWidth?: string;
  resizable?: boolean;
  statusMap?: Record<string, { label: string; variant: BadgeVariant }>;
  /**
   * Configuration for StatusSwitch component when used as cell
   */
  statusSwitchConfig?: StatusSwitchConfig;
}

/**
 * Action configuration interface
 */
export interface DataTableAction<T = any> {
  label: string;
  handler: (row: T) => void | Promise<void>;
  icon?: string;
  variant?: ButtonVariant;
  partition?: number;
  disabled?: (row: T) => boolean;
  tooltip?: string;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  permission?: string;
}

/**
 * Filter configuration interface
 */
export interface DataTableFilterConfig {
  key: string;
  label: string;
  options?: Array<{
    value: any;
    label: string;
    disabled?: boolean;
  }>;
  type?: "select" | "multiselect" | "date-range" | "date" | "number-range" | "custom";
  multiple?: boolean;
  placeholder?: string;
  component?: Component;
  className?: string;
  tooltip?: string;
  min?: number;
  max?: number;
}

/**
 * Help section interface
 */
export interface DataTableHelpSection {
  title: string;
  description: string;
  steps?: string[];
  icon?: LucideIcon;
}

/**
 * Fetch parameters interface
 */
export interface DataTableFetchParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  [key: string]: any;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  key: string;
  order: "asc" | "desc";
}

/**
 * Column visibility state
 */
export type ColumnVisibility = Record<string, boolean>;

/**
 * Filter state
 */
export type FilterState = Record<string, any>;

/**
 * Enhanced DataTable props interface
 */
export interface DataTableProps<T = any> {
  dataType: string;
  columns: DataTableColumn<T>[];
  actions?: DataTableAction<T>[];
  updateData?: (id: string, key: string, value: any) => void;
  fetchData: (params: DataTableFetchParams) => Promise<PaginatedResponse<T> | T[]>;
  usePagination?: boolean;
  filtersConfig?: DataTableFilterConfig[];
  dataKey?: string;
  refreshKey: string;
  helpContent?: DataTableHelpSection[];
  defaultActionDisplay?: ActionDisplayMode;
  enableActionPartitioning?: boolean;
  showHeaderActions?: boolean;
  showSN?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  showRowHover?: boolean;
  alternatingRows?: boolean;
  draggable?: DraggableConfig;
  containerClassName?: string;
  tableContainerClassName?: string;
  tableClassName?: string;
  filterContainerClassName?: string;
  filterButtonClassName?: string;
  filterDropdownClassName?: string;
  columnsButtonClassName?: string;
  actionsButtonClassName?: string;
  searchInputClassName?: string;
  paginationClassName?: string;
  pageSizeSelectClassName?: string;
}

/**
 * DataTable emitted events interface
 */
export interface DataTableEmits<T = any> {
  "row-click": [row: T, index: number];
  "row-double-click": [row: T, index: number];
  "selection-change": [selectedRows: T[]];
  "sort-change": [sortConfig: SortConfig];
  "filter-change": [filters: FilterState];
  "page-change": [page: number];
  "page-size-change": [pageSize: number];
}

/**
 * Custom cell component props interface
 */
export interface CellComponentProps<T = any> {
  row: T;
  value: any;
  column: DataTableColumn<T>;
  rowIndex: number;
  updateData?: (id: string, key: string, value: any) => void;
}

/**
 * Action button component props
 */
export interface ActionButtonProps<T = any> {
  action: DataTableAction<T>;
  row: T;
  rowIndex: number;
  mode: "button" | "menu-item";
}

/**
 * Filter component props
 */
export interface FilterComponentProps {
  filter: DataTableFilterConfig;
  value: any;
  onValueChange: (value: any) => void;
}

/**
 * Utility types for better type inference
 */
export type ExtractRowType<T> = T extends DataTableProps<infer R> ? R : never;

/**
 * Extract column accessor keys
 */
export type ColumnAccessorKey<T> =
  T extends DataTableColumn<any>
    ? T["accessorKey"] extends string
      ? T["accessorKey"]
      : never
    : never;

/**
 * Type-safe column configuration helper
 */
export interface TypedDataTableColumn<T, K extends keyof T>
  extends Omit<DataTableColumn<T>, "accessorKey"> {
  accessorKey: K;
}

/**
 * Configuration for advanced features
 */
export interface AdvancedTableConfig {
  enableSelection?: boolean;
  selectionMode?: "single" | "multiple";
  enableReordering?: boolean;
  enableExport?: boolean;
  exportFormats?: Array<"csv" | "excel" | "json" | "pdf">;
  enableBulkActions?: boolean;
  bulkActions?: Array<{
    label: string;
    handler: (selectedRows: any[]) => void;
    icon?: LucideIcon;
    variant?: ButtonVariant;
  }>;
  enableGlobalSearch?: boolean;
  enableColumnFiltering?: boolean;
  enableVirtualScrolling?: boolean;
  rowHeight?: number;
}

/**
 * Default configurations
 */
export const DEFAULT_TABLE_CONFIG: Partial<DataTableProps> = {
  usePagination: true,
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
  defaultActionDisplay: "dropdown",
  enableActionPartitioning: false,
  showRowHover: true,
  alternatingRows: true,
};

export const DEFAULT_ADVANCED_CONFIG: AdvancedTableConfig = {
  enableSelection: false,
  selectionMode: "multiple",
  enableReordering: false,
  enableExport: false,
  exportFormats: ["csv", "excel"],
  enableBulkActions: false,
  enableGlobalSearch: true,
  enableColumnFiltering: false,
  enableVirtualScrolling: false,
  rowHeight: 48,
};

/**
 * Item for reordering operations
 */
export interface ReorderItem {
  id: number | string;
  order: number;
}

/**
 * Configuration for draggable row reordering
 */
export interface DraggableConfig {
  /**
   * Whether dragging is enabled (controlled by parent)
   */
  enabled: boolean;
  /**
   * Field name for order property (default: "order")
   */
  orderField?: string;
  /**
   * Field name for ID property (default: "id")
   */
  idField?: string;
  /**
   * Callback to update order via API after drag ends
   */
  onReorder: (items: ReorderItem[]) => Promise<void>;
}
