import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToExcel(data: any[], filename: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF(title: string, headers: string[], data: any[][], filename: string) {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(title, 14, 15);

    autoTable(doc, {
        head: [headers],
        body: data,
        startY: 25,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
    });

    doc.save(`${filename}.pdf`);
}

export function getScoreColor(score: number, kkm?: number): string {
    if (!kkm) return 'inherit';

    if (score >= kkm) return '#22c55e'; // Green
    if (score >= kkm - 5) return '#eab308'; // Yellow
    return '#ef4444'; // Red
}

export function getScoreStatus(score: number, kkm?: number): 'above' | 'near' | 'below' | 'none' {
    if (!kkm) return 'none';

    if (score >= kkm) return 'above';
    if (score >= kkm - 5) return 'near';
    return 'below';
}
