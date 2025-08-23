export class FileProcessor {
  constructor() {}

  exportCSV(wells) {
    const headers = [
      "Well Name",
      "Field",
      "Status",
      "Production (BOE/d)",
      "% Change",
      "Water Cut (%)",
    ];
    const rows = wells.map((w) => [
      w.name,
      w.field,
      w.status,
      w.production,
      w.change,
      w.waterCut,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "well_data_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  makeTemplateCSV() {
    const headers = [
      "Well Name",
      "Field",
      "Status",
      "Production (BOE/d)",
      "% Change",
      "Water Cut (%)",
    ];
    const sample = [
      "EF #101-205",
      "Eagle Ford",
      "Producing",
      "1250",
      "1.5",
      "22.1",
    ];
    const csv = [headers.join(","), sample.join(",")].join("\n");
    return csv;
  }
}
