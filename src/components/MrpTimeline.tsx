"use client";

import { useMemo, useState } from "react";
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
import { X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { runMrp } from "@/lib/mrp";
import { MrpRow } from "@/lib/types";
import { Button } from "@/components/ui/button";

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
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const data = useMemo<WeekPoint[]>(() => {
    const rows = runMrp(bom, demand, scenario);
    return aggregate(rows, bom);
  }, [bom, demand, scenario]);

  const weekTicks = useMemo(() => data.map((d) => d.week), [data]);
  const selected = useMemo(
    () => data.find((d) => d.week === selectedWeek) ?? null,
    [data, selectedWeek],
  );

  function handleChartClick(state: unknown) {
    const s = state as { activeLabel?: number | string } | null;
    if (!s || s.activeLabel == null) return;
    const wk = typeof s.activeLabel === "number" ? s.activeLabel : Number(s.activeLabel);
    if (Number.isFinite(wk)) {
      setSelectedWeek((prev) => (prev === wk ? null : wk));
    }
  }

  return (
    <div className="space-y-3">
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
            onClick={handleChartClick}
            style={{ cursor: "pointer" }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="week"
              type="number"
              domain={[weekTicks[0] ?? 1, weekTicks[weekTicks.length - 1] ?? 12]}
              ticks={weekTicks}
              allowDuplicatedCategory={false}
              stroke="var(--muted-foreground)"
              tick={{ fontSize: 12 }}
              tickFormatter={(w) => `W${w}`}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => formatShort(v)}
            />
            <Tooltip
              content={<MrpTooltip />}
              cursor={{
                stroke: "#ef4444",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
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
              dataKey="shortageTotal"
              name="Shortage"
              fill="#ef4444"
              shape={(props: unknown) =>
                renderShortageDot(props, data, selectedWeek)
              }
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {selected && <WeekDetail point={selected} onClose={() => setSelectedWeek(null)} />}
      {!selected && (
        <p className="text-[11px] text-muted-foreground">
          Tip: click any week to pin its component shortage breakdown.
        </p>
      )}
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

    shortageComponents.sort((a, b) => b.units - a.units);
    return { week, grossReq, onHand, shortageTotal, shortageComponents };
  });
}

function formatShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toString();
}

function renderShortageDot(
  props: unknown,
  data: WeekPoint[],
  selectedWeek: number | null,
) {
  const p = props as { cx?: number; cy?: number; payload?: WeekPoint };
  if (
    typeof p.cx !== "number" ||
    typeof p.cy !== "number" ||
    !p.payload ||
    p.payload.shortageTotal <= 0
  ) {
    return <g />;
  }
  const max = Math.max(...data.map((d) => d.shortageTotal), 1);
  const radius = 4 + (p.payload.shortageTotal / max) * 8;
  const isSelected = selectedWeek === p.payload.week;
  return (
    <g>
      {isSelected && (
        <circle
          cx={p.cx}
          cy={p.cy}
          r={radius + 6}
          fill="none"
          stroke="#ef4444"
          strokeWidth={1.5}
          strokeDasharray="3 2"
        />
      )}
      <circle
        cx={p.cx}
        cy={p.cy}
        r={radius}
        fill="#ef4444"
        fillOpacity={isSelected ? 1 : 0.85}
        stroke="#fca5a5"
        strokeWidth={1}
      />
    </g>
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
            {point.shortageComponents.slice(0, 4).map((c) => (
              <li key={c.name}>
                {c.name}: {c.units.toLocaleString()}
              </li>
            ))}
            {point.shortageComponents.length > 4 && (
              <li className="text-[10px] opacity-70">
                +{point.shortageComponents.length - 4} more
              </li>
            )}
          </ul>
        </div>
      )}
      <div className="mt-1 border-t pt-1 text-[10px] text-muted-foreground">
        Click to pin this week
      </div>
    </div>
  );
}

function WeekDetail({
  point,
  onClose,
}: {
  point: WeekPoint;
  onClose: () => void;
}) {
  return (
    <div className="rounded-md border bg-card/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">Week {point.week}</span>
          <span className="text-muted-foreground">
            gross req {point.grossReq.toLocaleString()} · on hand{" "}
            {point.onHand.toLocaleString()}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          title="Close week detail"
        >
          <X className="size-3" />
          Close
        </Button>
      </div>
      {point.shortageTotal > 0 ? (
        <div className="space-y-1">
          <div className="text-xs font-medium text-destructive">
            Shortage: {point.shortageTotal.toLocaleString()} units across{" "}
            {point.shortageComponents.length} component
            {point.shortageComponents.length === 1 ? "" : "s"}
          </div>
          <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
            {point.shortageComponents.map((c) => (
              <li
                key={c.name}
                className="flex items-center justify-between rounded border border-destructive/30 bg-destructive/5 px-2 py-1"
              >
                <span className="truncate pr-2">{c.name}</span>
                <span className="tabular-nums text-destructive">
                  {c.units.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No shortages this week. Demand is fully covered by on-hand and
          released orders.
        </p>
      )}
    </div>
  );
}
