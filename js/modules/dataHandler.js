import { HELPERS } from "../utils/helpers.js";
import { CONSTANTS } from "../utils/constants.js";

export class DataHandler {
  constructor() {
    this.wellData = [];
  }

  generateSampleData() {
    const fields = CONSTANTS.FIELDS;

    this.wellData = [];
    let id = 1;

    fields.forEach((field) => {
      for (let i = 0; i < field.wellCount; i++) {
        const statusIndex = HELPERS.getWeightedRandomIndex(
          CONSTANTS.STATUS_DISTRIBUTION
        );
        const status = CONSTANTS.STATUSES[statusIndex];

        let production = 0;
        let change = 0;
        let waterCut = 0;

        if (status === "Producing") {
          production = Math.round(
            (500 + Math.random() * 1000) * field.productionFactor
          );
          change = parseFloat((-5 + Math.random() * 10).toFixed(1));
          waterCut = parseFloat((10 + Math.random() * 25).toFixed(1));
        } else if (status === "Drilling") {
          production = Math.round(Math.random() * 200 * field.productionFactor);
          waterCut = parseFloat((5 + Math.random() * 15).toFixed(1));
        }

        this.wellData.push({
          id: id++,
          name: `${field.name.split(" ")[0]} #${HELPERS.getRandomInt(
            100,
            999
          )}-${HELPERS.getRandomInt(100, 999)}`,
          field: field.name,
          status,
          production,
          change,
          waterCut,
        });
      }
    });

    return this.wellData;
  }

  processCSVData(csvData) {
    const parsedData = HELPERS.parseCSV(csvData);
    this.wellData = parsedData.map((row, index) => ({
      id: index + 1,
      name: row["Well Name"] || `Well #${index + 1}`,
      field: row["Field"] || "Unknown",
      status: row["Status"] || "Unknown",
      production: parseInt(row["Production (BOE/d)"]) || 0,
      change: parseFloat(row["% Change"]) || 0,
      waterCut: parseFloat(row["Water Cut (%)"]) || 0,
    }));

    return this.wellData;
  }

  getWellData() {
    return this.wellData;
  }

  // Analyst-focused helpers
  calcKPIs() {
    const totalWells = this.wellData.length;
    const producing = this.wellData.filter((w) => w.status === "Producing");
    const totalProduction = producing.reduce((s, w) => s + w.production, 0);
    const avgProduction = producing.length
      ? totalProduction / producing.length
      : 0;
    const avgWaterCut = producing.length
      ? producing.reduce((s, w) => s + parseFloat(w.waterCut || 0), 0) /
        producing.length
      : 0;
    return { totalWells, totalProduction, avgProduction, avgWaterCut };
  }

  detectAnomalies({
    changeThreshold = CONSTANTS.ANALYTICS.anomalyChangePct,
    highWaterCut = CONSTANTS.ANALYTICS.highWaterCutPct,
  } = {}) {
    const anomalies = [];
    for (const w of this.wellData) {
      const flags = [];
      if (
        typeof w.change === "number" &&
        Math.abs(w.change) >= changeThreshold
      ) {
        flags.push(`Large change: ${w.change}%`);
      }
      if (typeof w.waterCut === "number" && w.waterCut >= highWaterCut) {
        flags.push(`High water cut: ${w.waterCut}%`);
      }
      if (w.production === 0 && w.status === "Producing") {
        flags.push("Zero production while Producing");
      }
      if (flags.length) anomalies.push({ ...w, flags });
    }
    return anomalies;
  }

  // Simple exponential decline forecast (Arps exponential approximation)
  forecastDecline({
    monthlyDecline = 0.07,
    months = CONSTANTS.ANALYTICS.forecastMonths,
  } = {}) {
    // Aggregate field-level current production and forecast forward
    const fieldMap = new Map();
    for (const w of this.wellData.filter((x) => x.status === "Producing")) {
      fieldMap.set(w.field, (fieldMap.get(w.field) || 0) + w.production);
    }
    const forecasts = {};
    for (const [field, base] of fieldMap.entries()) {
      const series = [];
      let q = base;
      for (let m = 1; m <= months; m++) {
        q = q * (1 - monthlyDecline); // exponential decline
        series.push(Math.max(0, Math.round(q)));
      }
      forecasts[field] = { current: base, series };
    }
    return forecasts;
  }
}
