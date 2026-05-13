import { Component, DemandWeek, MrpRow, Scenario } from "./types";

/**
 * Lot-for-lot, single-level, weekly-bucket MRP with lead-time offset and MOQ
 * rounding. Applies the active scenario (demand spike, lead time slip, supplier
 * capacity cut) before running the schedule.
 */
export function runMrp(
  bom: Component[],
  demand: DemandWeek[],
  scenario: Scenario,
): MrpRow[] {
  const effectiveDemand = applyDemandSpike(demand, scenario.demandSpikePct);
  return bom.map((comp) => buildRow(comp, effectiveDemand, scenario));
}

function applyDemandSpike(
  demand: DemandWeek[],
  spikePct: number,
): DemandWeek[] {
  const factor = 1 + spikePct / 100;
  return demand.map((d) => ({
    week: d.week,
    jetstreamUnits: Math.max(0, Math.round(d.jetstreamUnits * factor)),
  }));
}

function buildRow(
  comp: Component,
  demand: DemandWeek[],
  scenario: Scenario,
): MrpRow {
  const effectiveLT = effectiveLeadTime(comp, scenario);
  const capFactor = supplierCapFactor(comp, scenario);

  const weeks = demand.map((d) => ({
    week: d.week,
    grossReq: d.jetstreamUnits * comp.qtyPerNic,
    onHand: 0,
    netReq: 0,
    plannedRelease: 0,
    shortage: 0,
  }));

  let onHand = comp.onHand;
  for (let i = 0; i < weeks.length; i++) {
    const w = weeks[i];
    w.onHand = onHand;

    const net = Math.max(0, w.grossReq - onHand);
    w.netReq = net;

    if (net === 0) {
      onHand = Math.max(0, onHand - w.grossReq);
      continue;
    }

    const plannedQty = Math.ceil(net / comp.moq) * comp.moq;
    const receivedQty = Math.floor(plannedQty * capFactor);
    const releaseWeek = w.week - effectiveLT;

    if (releaseWeek < 1) {
      w.shortage = net;
      onHand = Math.max(0, onHand - w.grossReq);
      continue;
    }

    const releaseIdx = releaseWeek - 1;
    if (releaseIdx >= 0 && releaseIdx < weeks.length) {
      weeks[releaseIdx].plannedRelease += receivedQty;
    }

    w.shortage = Math.max(0, net - receivedQty);
    onHand = Math.max(0, onHand + receivedQty - w.grossReq);
  }

  return { componentId: comp.id, weeks };
}

function effectiveLeadTime(comp: Component, scenario: Scenario): number {
  if (scenario.leadTimeSlipComponentId !== comp.id) return comp.leadTimeWeeks;
  return comp.leadTimeWeeks + scenario.leadTimeSlipWeeks;
}

function supplierCapFactor(comp: Component, scenario: Scenario): number {
  if (scenario.supplierCapCutSupplier !== comp.supplier) return 1;
  return Math.max(0, 1 - scenario.supplierCapCutPct / 100);
}
