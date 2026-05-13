import { Component, Region, RiskScore, Source } from "./types";

const SOURCE_SCORES: Record<Source, number> = {
  sole: 1.0,
  dual: 0.4,
  multi: 0.1,
};

const GEO_SCORES: Record<Region, number> = {
  Taiwan: 0.8,
  China: 0.7,
  "South Korea": 0.6,
  USA: 0.3,
  Japan: 0.4,
  Malaysia: 0.5,
  Vietnam: 0.5,
};

const LEAD_TIME_DENOMINATOR = 22;

export function computeRiskScores(bom: Component[]): RiskScore[] {
  const scored = bom.map<RiskScore>((comp) => {
    const leadTimeScore = Math.min(1, comp.leadTimeWeeks / LEAD_TIME_DENOMINATOR);
    const sourceScore = SOURCE_SCORES[comp.source];
    const geoScore = GEO_SCORES[comp.region];
    const composite =
      0.4 * leadTimeScore + 0.4 * sourceScore + 0.2 * geoScore;
    return {
      componentId: comp.id,
      leadTimeScore,
      sourceScore,
      geoScore,
      composite,
      rank: 0,
    };
  });

  scored.sort((a, b) => b.composite - a.composite);
  scored.forEach((s, i) => {
    s.rank = i + 1;
  });
  return scored;
}
