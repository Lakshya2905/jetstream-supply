"use client";

import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStore } from "@/store/useStore";
import { computeRiskScores } from "@/lib/risk";
import { Component, RiskScore } from "@/lib/types";

interface RankedRow {
  score: RiskScore;
  component: Component;
}

export function RiskHeatmap() {
  const bom = useStore((s) => s.bom);
  const rows = useMemo<RankedRow[]>(() => {
    const scores = computeRiskScores(bom);
    const byId = new Map(bom.map((c) => [c.id, c]));
    return scores
      .slice(0, 5)
      .map((score) => ({ score, component: byId.get(score.componentId)! }))
      .filter((r) => r.component);
  }, [bom]);

  return (
    <TooltipProvider>
      <ol className="space-y-2">
        {rows.map(({ score, component }) => (
          <li key={component.id}>
            <Tooltip>
              <TooltipTrigger className="block w-full text-left">
                <RiskRow score={score} component={component} />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-sm">
                <RiskBreakdown score={score} component={component} />
              </TooltipContent>
            </Tooltip>
          </li>
        ))}
      </ol>
    </TooltipProvider>
  );
}

function RiskRow({ score, component }: RankedRow) {
  const pct = Math.round(score.composite * 100);
  return (
    <div className="rounded-md border p-2 transition-colors hover:bg-muted/40">
      <div className="mb-1 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold tabular-nums">
            {score.rank}
          </span>
          <span className="font-medium">{component.name}</span>
        </div>
        <span className="tabular-nums text-muted-foreground">
          {score.composite.toFixed(2)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: heatColor(score.composite) }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <ScoreChip label="LT" value={score.leadTimeScore} />
        <ScoreChip label="Src" value={score.sourceScore} />
        <ScoreChip label="Geo" value={score.geoScore} />
      </div>
    </div>
  );
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] tabular-nums"
      style={{ borderColor: heatColor(value), color: heatColor(value) }}
    >
      <span className="text-muted-foreground">{label}</span>
      {value.toFixed(2)}
    </span>
  );
}

function RiskBreakdown({ score, component }: RankedRow) {
  return (
    <div className="space-y-1">
      <div className="font-medium">{component.name}</div>
      <div className="text-muted-foreground">
        {component.supplier} · {component.region} · {component.source}-source
      </div>
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 tabular-nums">
        <span>Lead time</span>
        <span className="text-right">
          {component.leadTimeWeeks}w · {score.leadTimeScore.toFixed(2)}
        </span>
        <span>Source</span>
        <span className="text-right">{score.sourceScore.toFixed(2)}</span>
        <span>Geography</span>
        <span className="text-right">{score.geoScore.toFixed(2)}</span>
        <span className="font-medium">Composite</span>
        <span className="text-right font-medium">
          {score.composite.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function heatColor(value: number): string {
  // Interpolate from green (0) through amber (0.5) to red (1.0).
  const clamped = Math.max(0, Math.min(1, value));
  if (clamped < 0.5) {
    return lerpColor("#22c55e", "#f59e0b", clamped / 0.5);
  }
  return lerpColor("#f59e0b", "#ef4444", (clamped - 0.5) / 0.5);
}

function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${[r, g, bl].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}
