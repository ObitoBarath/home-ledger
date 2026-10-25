import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function buildXlsx(rows) {
  const ws = XLSX.utils.json_to_sheet(rows.map(e => ({ Date: e.date, Category: e.category, Worker: e.worker || "", Task: e.task || "", Note: e.note || "", Amount: e.amount })));
  ws["!cols"] = [{ wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 28 }, { wch: 28 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
}

export function buildPdf(rows, total, label) {
  const d = new jsPDF();
  d.setFontSize(16); d.text("House construction expenses", 14, 16);
  d.setFontSize(10); d.text(label + "  |  Total Rs. " + Math.round(total).toLocaleString("en-IN"), 14, 23);
  autoTable(d, {
    startY: 28,
    head: [["Date", "Category", "Details", "Amount (Rs.)"]],
    body: rows.map(e => [e.date, e.category, [e.worker, e.task, e.note].filter(Boolean).join(" - "), Math.round(e.amount).toLocaleString("en-IN")]),
    headStyles: { fillColor: [79, 117, 100] },
    columnStyles: { 3: { halign: "right" } },
  });
  return d.output("arraybuffer");
}
