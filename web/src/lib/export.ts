import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { Student, Driver, Host } from "../api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function boolToYesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function writeWorkbook(wb: XLSX.WorkBook, filename: string): void {
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, filename);
}

// ---------------------------------------------------------------------------
// Generic Excel export
// ---------------------------------------------------------------------------

export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  writeWorkbook(wb, filename);
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export function exportStudentsToExcel(students: Student[]): void {
  const year = students.length > 0 ? students[0].year : new Date().getFullYear();

  const rows = students.map((s) => ({
    Name: s.fullname,
    Email: s.email,
    Phone: s.phone,
    University: s.university,
    Major: s.major,
    Country: s.country,
    "Family Size": s.familySize,
    "Car Seat Needed": boolToYesNo(s.needCarSeat),
    Kosher: boolToYesNo(s.kosherFood),
    Present: boolToYesNo(s.isPresent),
    "Registered On": formatDate(s.registeredOn),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  writeWorkbook(wb, `students-${year}.xlsx`);
}

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

export function exportDriversToExcel(drivers: Driver[]): void {
  const year = drivers.length > 0 ? drivers[0].year : new Date().getFullYear();

  const rows = drivers.map((d) => ({
    Name: d.fullname,
    Email: d.email,
    Phone: d.phone,
    Role: d.role,
    Capacity: d.capacity,
    Navigator: d.navigator,
    "Has Child Seat": boolToYesNo(d.haveChildSeat),
    Present: boolToYesNo(d.isPresent),
    "Registered On": formatDate(d.registeredOn),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Drivers");
  writeWorkbook(wb, `drivers-${year}.xlsx`);
}

// ---------------------------------------------------------------------------
// Hosts
// ---------------------------------------------------------------------------

export function exportHostsToExcel(hosts: Host[]): void {
  const year = hosts.length > 0 ? hosts[0].year : new Date().getFullYear();

  const rows = hosts.map((h) => ({
    Name: h.fullname,
    Email: h.email,
    Phone: h.phone,
    Address: h.address,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hosts");
  writeWorkbook(wb, `hosts-${year}.xlsx`);
}

// ---------------------------------------------------------------------------
// PDF / Print utilities
// ---------------------------------------------------------------------------

function openPrintWindow(html: string): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 20px; color: #000; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #999; padding: 6px 10px; text-align: left; font-size: 13px; }
    th { background-color: #f2f2f2; font-weight: 600; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

/**
 * Opens a new window containing only the inner HTML of the element with the
 * given id, then triggers the browser print dialog.
 */
export function printElement(elementId: string): void {
  const el = document.getElementById(elementId);
  if (!el) return;
  openPrintWindow(el.innerHTML);
}

/**
 * Builds an HTML table from the provided headers and rows, opens it in a new
 * window, and triggers the browser print dialog (save-as-PDF via the browser).
 */
export function exportTableToPdf(
  title: string,
  headers: string[],
  rows: string[][],
): void {
  const ths = headers.map((h) => `<th>${h}</th>`).join("");
  const trs = rows
    .map((row) => {
      const tds = row.map((cell) => `<td>${cell}</td>`).join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  const html = `
    <h1>${title}</h1>
    <table>
      <thead><tr>${ths}</tr></thead>
      <tbody>${trs}</tbody>
    </table>`;

  openPrintWindow(html);
}
