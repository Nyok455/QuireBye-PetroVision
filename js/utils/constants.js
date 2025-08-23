export const CONSTANTS = {
  STATUSES: ["Producing", "Shut-in", "Abandoned", "Drilling"],
  STATUS_DISTRIBUTION: [0.7, 0.18, 0.07, 0.05],
  // South Sudan production is predominantly oil with small gas/NGL associated
  PRODUCTION_TYPE_SHARE: { oil: 0.9, gas: 0.08, ngl: 0.02 },
  // Default fields used when generating mock data (if CSV isn't available)
  FIELDS: [
    { name: "Paloch", productionFactor: 1.5, wellCount: 24 },
    { name: "Adar Yale", productionFactor: 1.2, wellCount: 16 },
    { name: "Melut Basin", productionFactor: 1.3, wellCount: 18 },
    { name: "Muglad Basin", productionFactor: 1.1, wellCount: 14 },
    { name: "Heglig", productionFactor: 1.0, wellCount: 12 },
    { name: "Unity", productionFactor: 0.95, wellCount: 10 },
    { name: "Thar Jath", productionFactor: 1.0, wellCount: 8 },
    { name: "Bentiu", productionFactor: 0.9, wellCount: 6 },
    { name: "Rubkona", productionFactor: 0.9, wellCount: 6 },
    { name: "Toma South", productionFactor: 1.1, wellCount: 8 },
  ],
  ANALYTICS: {
    anomalyChangePct: 15, // % change threshold to flag anomalies
    highWaterCutPct: 50, // % water cut to flag high water cut
    forecastMonths: 12, // default forecast horizon
  },
};
