import React from 'react';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import Button from '../ui/Button';

export default function ExportButtons({ filename = 'results', rows }) {
  const exportCSV = () => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Election Results', 14, 18);
    let y = 30;
    rows.forEach((r) => {
      doc.text(`${r.name} (${r.party}) - ${r.votes} votes`, 14, y);
      y += 10;
    });
    doc.save(`${filename}.pdf`);
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
      <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
    </div>
  );
}
