// Lightweight external data integrations with safe fallbacks
// Note: Live oil price APIs often require keys. We support optional EIA key via CONFIG.

import { CONFIG } from "../utils/config.js";

export class ExternalData {
  constructor() {}

  // Try to fetch Brent/WTI/Dubai benchmarks. If EIA key present, use it; otherwise fallback.
  async getBenchmarks() {
    const hasKey = Boolean(CONFIG?.EIA_API_KEY);
    if (!hasKey) {
      // plausible fallbacks; updated at runtime if user provides API key
      return {
        brent: { price: 86.2, unit: "USD/bbl", source: "fallback" },
        wti: { price: 82.7, unit: "USD/bbl", source: "fallback" },
        dubai: { price: 83.9, unit: "USD/bbl", source: "fallback" },
      };
    }

    try {
      const brentSeries = CONFIG?.SOURCES?.EIA?.BRENT || "PET.RBRTE.D"; // Europe Brent Spot Price FOB (Dollars per Barrel)
      const wtiSeries = CONFIG?.SOURCES?.EIA?.WTI || "PET.RWTC.D"; // Cushing, OK WTI Spot Price FOB (Dollars per Barrel)
      // No direct Dubai EIA series without key mapping; approximate with Brent - 2 as placeholder

      const base = `https://api.eia.gov/series/?api_key=${CONFIG.EIA_API_KEY}&series_id=`;
      const [brentRes, wtiRes] = await Promise.all([
        fetch(base + brentSeries, { cache: "no-store" }),
        fetch(base + wtiSeries, { cache: "no-store" }),
      ]);
      const [brentJson, wtiJson] = await Promise.all([
        brentRes.json(),
        wtiRes.json(),
      ]);
      const brent = parseFloat(brentJson?.series?.[0]?.data?.[0]?.[1] ?? 0);
      const wti = parseFloat(wtiJson?.series?.[0]?.data?.[0]?.[1] ?? 0);
      const dubai = Math.max(0, Math.round((brent - 2) * 10) / 10);
      return {
        brent: { price: brent, unit: "USD/bbl", source: "EIA" },
        wti: { price: wti, unit: "USD/bbl", source: "EIA" },
        dubai: { price: dubai, unit: "USD/bbl", source: "approx" },
      };
    } catch (e) {
      return {
        brent: { price: 86.2, unit: "USD/bbl", source: "fallback" },
        wti: { price: 82.7, unit: "USD/bbl", source: "fallback" },
        dubai: { price: 83.9, unit: "USD/bbl", source: "fallback" },
      };
    }
  }

  async getCountryFacts() {
    try {
      const res = await fetch(
        "https://restcountries.com/v3.1/name/south%20sudan?fullText=true",
        { cache: "no-store" }
      );
      const data = await res.json();
      const item = Array.isArray(data) ? data[0] : null;
      if (!item) throw new Error("No data");
      return {
        capital: item.capital?.[0] || "Juba",
        population: item.population || 11000000,
        region: item.region || "Africa",
        subregion: item.subregion || "Eastern Africa",
        languages: item.languages
          ? Object.values(item.languages).join(", ")
          : "—",
        flag: item.flags?.svg || item.flags?.png || "",
      };
    } catch (e) {
      return {
        capital: "Juba",
        population: 11000000,
        region: "Africa",
        subregion: "Eastern Africa",
        languages: "English, Arabic, indigenous languages",
        flag: "",
      };
    }
  }
}
