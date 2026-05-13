import { runMrp } from "./mrp";
import { Component, DemandWeek, Scenario } from "./types";

const baseScenario: Scenario = {
  leadTimeSlipWeeks: 0,
  leadTimeSlipComponentId: null,
  demandSpikePct: 0,
  supplierCapCutPct: 0,
  supplierCapCutSupplier: null,
};

const rampDemand: DemandWeek[] = Array.from({ length: 12 }, (_, i) => ({
  week: i + 1,
  jetstreamUnits: 80 + i * 40,
}));

function totalShortage(weeks: { shortage: number }[]): number {
  return weeks.reduce((sum, w) => sum + w.shortage, 0);
}

describe("runMrp", () => {
  it("forces shortage on a sole-source 22-week lead time part when demand spikes 50%", () => {
    const asic: Component = {
      id: "asic-js-main",
      name: "JetStream NIC ASIC",
      category: "Silicon",
      supplier: "TSMC",
      region: "Taiwan",
      source: "sole",
      leadTimeWeeks: 22,
      unitCost: 850,
      moq: 100,
      qtyPerNic: 1,
      onHand: 1200,
    };

    const spiked: Scenario = { ...baseScenario, demandSpikePct: 50 };
    const [row] = runMrp([asic], rampDemand, spiked);

    expect(totalShortage(row.weeks)).toBeGreaterThan(0);
    // Every demand week has release week <= 0 given 22-week lead time, so any
    // net requirement immediately surfaces as shortage in that week.
    const shortageWeeks = row.weeks.filter((w) => w.shortage > 0);
    expect(shortageWeeks.length).toBeGreaterThan(0);
  });

  it("does not shortage when on-hand fully covers demand at a reachable lead time", () => {
    const sturdy: Component = {
      id: "well-stocked",
      name: "Well Stocked Part",
      category: "Passives",
      supplier: "Generic",
      region: "USA",
      source: "multi",
      leadTimeWeeks: 2,
      unitCost: 1,
      moq: 1,
      qtyPerNic: 1,
      onHand: 100000,
    };

    const [row] = runMrp([sturdy], rampDemand, baseScenario);

    expect(totalShortage(row.weeks)).toBe(0);
  });

  it("rounds planned releases up to the next MOQ multiple", () => {
    const lumpy: Component = {
      id: "lumpy",
      name: "Lumpy MOQ Part",
      category: "Connector",
      supplier: "Generic",
      region: "USA",
      source: "dual",
      leadTimeWeeks: 1,
      unitCost: 1,
      moq: 500,
      qtyPerNic: 1,
      onHand: 0,
    };

    // Demand of 80 units in week 2 with MOQ 500 should plan a release of 500
    // in week 1.
    const demand: DemandWeek[] = [
      { week: 1, jetstreamUnits: 0 },
      { week: 2, jetstreamUnits: 80 },
    ];

    const [row] = runMrp([lumpy], demand, baseScenario);

    const release = row.weeks.find((w) => w.week === 1)?.plannedRelease;
    expect(release).toBe(500);
    expect(totalShortage(row.weeks)).toBe(0);
  });
});
