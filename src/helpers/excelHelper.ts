import * as XLSX from "xlsx";

/**
 * Download a sample Excel file
 * @param data Array of arrays (rows), first row should be headers
 * @param filename Name of the file to download
 */
export const downloadExcel = (data: any[][], filename = "sample.xlsx") => {
  if (!data || data.length === 0) {
    console.warn("No data provided for Excel download");
    return;
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Create workbook and append the worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  // Trigger download
  XLSX.writeFile(wb, filename);
};

export function exportExcel(data: any[][], filename: string, options: any = {}) {
  const ws = XLSX.utils.aoa_to_sheet(data);

  if (options.merges) {
    ws["!merges"] = options.merges;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename);
}
