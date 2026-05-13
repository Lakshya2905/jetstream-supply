export type Source = "sole" | "dual" | "multi";

export type Region =
  | "Taiwan"
  | "South Korea"
  | "USA"
  | "China"
  | "Japan"
  | "Malaysia"
  | "Vietnam";

export interface Component {
  id: string;
  name: string;
  category:
    | "Silicon"
    | "Memory"
    | "Power"
    | "Optics"
    | "Passives"
    | "PCB"
    | "Mechanical"
    | "Connector";
  supplier: string;
  region: Region;
  source: Source;
  leadTimeWeeks: number;
  unitCost: number;
  moq: number;
  qtyPerNic: number;
  onHand: number;
}

export interface DemandWeek {
  week: number;
  jetstreamUnits: number;
}

export interface Scenario {
  leadTimeSlipWeeks: number;
  leadTimeSlipComponentId: string | null;
  demandSpikePct: number;
  supplierCapCutPct: number;
  supplierCapCutSupplier: string | null;
}

export interface MrpRow {
  componentId: string;
  weeks: {
    week: number;
    grossReq: number;
    onHand: number;
    netReq: number;
    plannedRelease: number;
    shortage: number;
  }[];
}

export interface RiskScore {
  componentId: string;
  leadTimeScore: number;
  sourceScore: number;
  geoScore: number;
  composite: number;
  rank: number;
}
