"use client";

export interface ExportColumn {
  header: string;
  key: string;
  isMoney?: boolean;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportToExcel(sheetName: string, columns: ExportColumn[], rows: Record<string, unknown>[], filename: string) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: 22 }));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    const formatted: Record<string, unknown> = {};
    for (const c of columns) {
      const value = row[c.key];
      formatted[c.key] = c.isMoney && typeof value === "number" ? value / 100 : value;
    }
    sheet.addRow(formatted);
  }
  for (const c of columns) {
    if (c.isMoney) sheet.getColumn(c.key).numFmt = "#,##0.00";
  }
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}

export async function exportToPdf(title: string, columns: ExportColumn[], rows: Record<string, unknown>[], filename: string) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) =>
      columns.map((c) => {
        const value = row[c.key];
        if (c.isMoney && typeof value === "number") return (value / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });
        return value == null ? "" : String(value);
      }),
    ),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [168, 70, 31] },
  });
  doc.save(filename);
}
