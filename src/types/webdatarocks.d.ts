// WebDataRocks type declarations
declare module "@webdatarocks/webdatarocks" {
  export interface Slice {
    rows?: Array<{ uniqueName: string; caption?: string }>;
    columns?: Array<{ uniqueName: string; caption?: string }>;
    measures?: Array<{ uniqueName: string; aggregation?: string; caption?: string }>;
    reportFilters?: Array<{ uniqueName: string }>;
  }

  export interface Format {
    name: string;
    thousandsSeparator?: string;
    decimalSeparator?: string;
    decimalPlaces?: number;
    currencySymbol?: string;
    currencySymbolAlign?: "left" | "right";
    nullValue?: string;
    textAlign?: "left" | "center" | "right";
    isPercent?: boolean;
  }

  export interface Options {
    grid?: {
      type?: "compact" | "classic" | "flat";
      showTotals?: boolean | "on" | "off" | "rows" | "columns";
      showGrandTotals?: boolean | "on" | "off" | "rows" | "columns";
    };
    configuratorActive?: boolean;
    configuratorButton?: boolean;
    showAggregationLabels?: boolean;
  }

  export interface Report {
    dataSource?: {
      data?: any[];
      dataSourceType?: string;
      filename?: string;
    };
    slice?: Slice;
    formats?: Format[];
    options?: Options;
  }

  export interface CellData {
    columnIndex?: number;
    rowIndex?: number;
    value?: any;
    label?: string;
    type?: string;
  }

  export interface WebDataRocksInstance {
    setReport: (report: Report) => void;
    getReport: () => Report;
    updateData: (
      data: { data?: any[]; dataSourceType?: string; filename?: string },
      options?: any,
    ) => void;
    expandAllData: () => void;
    collapseAllData: () => void;
    refresh: () => void;
    exportTo: (type: "pdf" | "excel" | "html", options?: any) => void;
    on: (event: string, handler: (data: any) => void) => void;
    off: (event: string, handler?: (data: any) => void) => void;
    dispose: () => void;
  }

  export interface WebDataRocksConstructorParams {
    container: string | HTMLElement;
    toolbar?: boolean;
    width?: string | number;
    height?: string | number;
    report?: Report;
    global?: any;
    reportcomplete?: () => void;
    cellclick?: (cell: CellData) => void;
    customizeCell?: (cell: any, data: any) => void;
  }

  class WebDataRocks {
    constructor(params: WebDataRocksConstructorParams);
    setReport: (report: Report) => void;
    getReport: () => Report;
    updateData: (
      data: { data?: any[]; dataSourceType?: string; filename?: string },
      options?: any,
    ) => void;
    expandAllData: () => void;
    collapseAllData: () => void;
    refresh: () => void;
    exportTo: (type: "pdf" | "excel" | "html", options?: any) => void;
    on: (event: string, handler: (data: any) => void) => void;
    off: (event: string, handler?: (data: any) => void) => void;
    dispose: () => void;
  }

  export default WebDataRocks;
}
