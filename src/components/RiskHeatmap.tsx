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
              <TooltipContent side="left" className="max-w-sm whitespace-normal">
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
  const color = heatColor(score.composite);
  return (
    <div
      className="rounded-md border p-3 transition-colors hover:bg-muted/40"
      style={{ borderColor: `${color}55` }}
    >
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums"
            style={{ backgroundColor: `${color}33`, color }}
          >
            {score.rank}
          </span>
          <span className="font-medium">{component.name}</span>
        </div>
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color }}
        >
          {score.composite.toFixed(2)}
        </span>
      </div>
      <div
        className="h-4 w-full overflow-hidden rounded-md"
        style={{ backgroundColor: `${color}1a` }}
      >
        <div
          className="h-full rounded-md transition-all"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 12px ${color}66`,
          }}
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
  const color = heatColor(value);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] tabular-nums"
      style={{ borderColor: `${color}66`, color, backgroundColor: `${color}14` }}
    >
      <span className="text-muted-foreground">{label}</span>
      {value.toFixed(2)}
    </span>
  );
}

function RiskBreakdown({ score, component }: RankedRow) {
  const ltExplain = explainLeadTime(component.leadTimeWeeks);
  const srcExplain = explainSource(component.source);
  const geoExplain = explainGeo(component.region);

  return (
    <div className="space-y-2">
      <div>
        <div className="font-medium">{component.name}</div>
        <div className="text-[11px] text-muted-foreground">
          {component.supplier} · {component.region} · {component.source}-source
        </div>
      </div>
      <div className="space-y-2 text-[11px] leading-snug">
        <FactorBlock
          label="Lead time"
          value={score.leadTimeScore}
          detail={`${component.leadTimeWeeks}w (score ${score.leadTimeScore.toFixed(2)})`}
          explain={ltExplain}
        />
        <FactorBlock
          label="Source"
          value={score.sourceScore}
          detail={`${component.source}-source (score ${score.sourceScore.toFixed(2)})`}
          explain={srcExplain}
        />
        <FactorBlock
          label="Geography"
          value={score.geoScore}
          detail={`${component.region} (score ${score.geoScore.toFixed(2)})`}
          explain={geoExplain}
        />
        <div className="flex items-center justify-between border-t pt-1 font-medium">
          <span>Composite</span>
          <span className="tabular-nums">{score.composite.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function FactorBlock({
  label,
  value,
  detail,
  explain,
}: {
  label: string;
  value: number;
  detail: string;
  explain: string;
}) {
  const color = heatColor(value);
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums" style={{ color }}>
          {detail}
        </span>
      </div>
      <div className="text-muted-foreground">{explain}</div>
    </div>
  );
}

function explainLeadTime(weeks: number): string {
  if (weeks >= 18) {
    return `${weeks}-week lead time means any net requirement that surfaces now arrives long after the demand week, so any miss converts directly into shortage.`;
  }
  if (weeks >= 12) {
    return `${weeks}-week lead time leaves limited room to react. An order placed today would land outside the visible 12-week horizon.`;
  }
  if (weeks >= 8) {
    return `${weeks}-week lead time gives moderate flexibility but still requires several weeks of forward visibility on demand.`;
  }
  return `${weeks}-week lead time is short, so orders can be placed reactively without forcing shortage.`;
}

function explainSource(source: Component["source"]): string {
  if (source === "sole") {
    return "Sole-source means no qualified alternative exists. Any disruption at this supplier translates directly into a line stoppage.";
  }
  if (source === "dual") {
    return "Dual-source provides a fallback supplier, which softens but does not eliminate exposure.";
  }
  return "Multi-source coverage spreads risk across more than two suppliers, making disruptions far easier to absorb.";
}

function explainGeo(region: Component["region"]): string {
  switch (region) {
    case "Taiwan":
      return "Concentrated in Taiwan, which carries the highest geopolitical and earthquake exposure in advanced manufacturing.";
    case "China":
      return "Concentrated in China, where export controls and trade policy can disrupt flow on short notice.";
    case "South Korea":
      return "Concentrated in South Korea, lower than Taiwan or China but still a single-region exposure for memory.";
    case "Japan":
      return "Located in Japan, a comparatively stable manufacturing region with moderate single-country exposure.";
    case "Malaysia":
      return "Located in Malaysia, a mid-tier region for assembly and packaging risk.";
    case "Vietnam":
      return "Located in Vietnam, a growing but still developing manufacturing region with some logistics risk.";
    case "USA":
      return "Located in the USA, generally the lowest geographic risk on this BOM.";
  }
}

function heatColor(value: number): string {
  // Interpolate from green (0) through amber (0.5) to red (1.0).
  const clamped = Math.max(0, Math.min(1, value));
  if (clamped < 0.5) {
    return lerpColor("#22c55e", "#f59e0b", clamped / 0.5);
  }
  return lerpColor("#f59e0b", "#dc2626", (clamped - 0.5) / 0.5);
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
