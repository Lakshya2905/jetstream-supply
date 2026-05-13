"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "@/store/useStore";
import { runMrp } from "@/lib/mrp";
import { MrpRow } from "@/lib/types";

interface WeekPoint {
  week: number;
  grossReq: number;
  onHand: number;
  shortageTotal: number;
  shortageComponents: { name: string; units: number }[];
}

export function MrpTimeline() {
  const bom = useStore((s) => s.bom);
  const demand = useStore((s) => s.demand);
  const scenario = useStore((s) => s.scenario);

  const data = useMemo<WeekPoint[]>(() => {
    const rows = runMrp(bom, demand, scenario);
    return aggregate(rows, bom);
  }, [bom, demand, scenario]);

  const shortageScatter = useMemo(
    () =>
      data
        .filter((d) => d.shortageTotal > 0)
        .map((d) => ({ ...d, value: d.grossReq })),
    [data],
  );

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="week"
            stroke="var(--muted-foreground)"
            tick={{ fontSize: 12 }}
            tickFormatter={(w) => `W${w}`}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => formatShort(v)}
          />
          <Tooltip content={<MrpTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="onHand"
            name="On hand"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.18}
          />
          <Area
            type="monotone"
            dataKey="grossReq"
            name="Gross req"
            stroke="#60a5fa"
            fill="#60a5fa"
            fillOpacity={0.12}
          />
          <Scatter
            data={shortageScatter}
            dataKey="value"
            name="Shortage"
            fill="#ef4444"
            shape={(props: unknown) => renderShortageDot(props, data)}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function aggregate(
  rows: MrpRow[],
  bom: { id: string; name: string }[],
): WeekPoint[] {
  const nameById = new Map(bom.map((c) => [c.id, c.name]));
  const weeks = rows[0]?.weeks.map((w) => w.week) ?? [];

  return weeks.map((week) => {
    let grossReq = 0;
    let onHand = 0;
    let shortageTotal = 0;
    const shortageComponents: { name: string; units: number }[] = [];

    for (const row of rows) {
      const w = row.weeks.find((x) => x.week === week);
      if (!w) continue;
      grossReq += w.grossReq;
      onHand += w.onHand;
      if (w.shortage > 0) {
        shortageTotal += w.shortage;
        shortageComponents.push({
          name: nameById.get(row.componentId) ?? row.componentId,
          units: w.shortage,
        });
      }
    }

    return { week, grossReq, onHand, shortageTotal, shortageComponents };
  });
}

function formatShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toString();
}

function renderShortageDot(props: unknown, data: WeekPoint[]) {
  const p = props as { cx?: number; cy?: number; payload?: WeekPoint };
  if (typeof p.cx !== "number" || typeof p.cy !== "number" || !p.payload) {
    return <g />;
  }
  const max = Math.max(...data.map((d) => d.shortageTotal), 1);
  const radius = 4 + (p.payload.shortageTotal / max) * 8;
  return (
    <circle
      cx={p.cx}
      cy={p.cy}
      r={radius}
      fill="#ef4444"
      fillOpacity={0.85}
      stroke="#fca5a5"
      strokeWidth={1}
    />
  );
}

interface TooltipShape {
  active?: boolean;
  payload?: { payload: WeekPoint }[];
  label?: number;
}

function MrpTooltip(props: TooltipShape) {
  if (!props.active || !props.payload?.length) return null;
  const point = props.payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 font-medium">Week {point.week}</div>
      <div className="text-muted-foreground">
        Gross req: {point.grossReq.toLocaleString()}
      </div>
      <div className="text-muted-foreground">
        On hand: {point.onHand.toLocaleString()}
      </div>
      {point.shortageTotal > 0 && (
        <div className="mt-1 border-t pt-1 text-destructive">
          Shortage: {point.shortageTotal.toLocaleString()} units
          <ul className="mt-1 space-y-0.5">
            {point.shortageComponents.map((c) => (
              <li key={c.name}>
                {c.name}: {c.units.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
