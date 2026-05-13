import { create } from "zustand";
import { Component, DemandWeek, Scenario } from "@/lib/types";
import { seedBom, seedDemand } from "@/lib/seed-data";

interface StoreState {
  bom: Component[];
  demand: DemandWeek[];
  scenario: Scenario;
  setBom: (bom: Component[]) => void;
  setDemand: (demand: DemandWeek[]) => void;
  setScenario: (scenario: Scenario) => void;
}

const initialScenario: Scenario = {
  leadTimeSlipWeeks: 0,
  leadTimeSlipComponentId: null,
  demandSpikePct: 0,
  supplierCapCutPct: 0,
  supplierCapCutSupplier: null,
};

export const useStore = create<StoreState>((set) => ({
  bom: seedBom,
  demand: seedDemand,
  scenario: initialScenario,
  setBom: (bom) => set({ bom }),
  setDemand: (demand) => set({ demand }),
  setScenario: (scenario) => set({ scenario }),
}));
