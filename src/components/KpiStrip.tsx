"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { runMrp } from "@/lib/mrp";
import { Component, MrpRow } from "@/lib/types";

interface KpiValues {
  dollarExposure: number;
  weeksWithShortage: number;
  componentsAtRisk: number;
}

const ACCENT = "#ef4444";

export function KpiStrip() {
  const bom = useStore((s) => s.bom);
  const demand = useStore((s) => s.demand);
  const scenario = useStore((s) => s.scenario);

  const kpis = useMemo<KpiValues>(() => {
    const rows = runMrp(bom, demand, scenario);
    return computeKpis(rows, bom);
  }, [bom, demand, scenario]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <KpiCard
        label="Dollar exposure"
        value={formatDollarsCompact(kpis.dollarExposure)}
        hot={kpis.dollarExposure > 0}
        helper="Shortage units × unit cost"
      />
      <KpiCard
        label="Weeks with shortage"
        value={kpis.weeksWithShortage.toString()}
        hot={kpis.weeksWithShortage > 0}
        helper="Distinct weeks where any component is short"
      />
      <KpiCard
        label="Components at risk"
        value={kpis.componentsAtRisk.toString()}
        hot={kpis.componentsAtRisk > 0}
        helper="Distinct components in shortage"
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  hot,
  helper,
}: {
  label: string;
  value: string;
  hot: boolean;
  helper: string;
}) {
  const accentStyle = hot
    ? { color: ACCENT, borderColor: `${ACCENT}55` }
    : undefined;
  return (
    <div
      className="rounded-lg border p-4 transition-colors"
      style={hot ? { borderColor: `${ACCENT}55` } : undefined}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className="mt-1 text-3xl font-semibold tabular-nums"
        style={accentStyle}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{helper}</div>
    </div>
  );
}

function computeKpis(rows: MrpRow[], bom: Component[]): KpiValues {
  const byId = new Map(bom.map((c) => [c.id, c]));
  const shortageWeeks = new Set<number>();
  const shortageComponents = new Set<string>();
  let dollarExposure = 0;

  for (const row of rows) {
    const comp = byId.get(row.componentId);
    if (!comp) continue;
    let hadShortage = false;
    for (const w of row.weeks) {
      if (w.shortage > 0) {
        shortageWeeks.add(w.week);
        hadShortage = true;
        dollarExposure += w.shortage * comp.unitCost;
      }
    }
    if (hadShortage) shortageComponents.add(comp.id);
  }

  return {
    dollarExposure: Math.round(dollarExposure),
    weeksWithShortage: shortageWeeks.size,
    componentsAtRisk: shortageComponents.size,
  };
}

function formatDollarsCompact(value: number): string {
  if (value <= 0) return "$0";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toLocaleString()}`;
}
