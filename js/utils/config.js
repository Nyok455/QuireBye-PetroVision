// Runtime configuration; provide optional API keys and source IDs here.
// This file is intentionally simple and safe to commit. Do not store secrets for production use.

export const CONFIG = {
  // Optional: EIA API key for oil prices. Obtain from https://www.eia.gov/opendata/ if desired.
  EIA_API_KEY: "", // set if available
  SOURCES: {
    EIA: {
      BRENT: "PET.RBRTE.D",
      WTI: "PET.RWTC.D",
    },
  },
};
