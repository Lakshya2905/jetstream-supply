"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import { Scenario } from "@/lib/types";

const NONE_VALUE = "__none__";

const INITIAL: Scenario = {
  leadTimeSlipWeeks: 0,
  leadTimeSlipComponentId: null,
  demandSpikePct: 0,
  supplierCapCutPct: 0,
  supplierCapCutSupplier: null,
};

const PRESETS: { label: string; description: string; scenario: Scenario }[] = [
  {
    label: "Apply HBM3E shortage",
    description: "+4w lead time slip on LPDDR5 buffer",
    scenario: {
      ...INITIAL,
      leadTimeSlipComponentId: "lpddr5-buffer",
      leadTimeSlipWeeks: 4,
    },
  },
  {
    label: "Apply Taiwan disruption",
    description: "30% supplier capacity cut on TSMC",
    scenario: {
      ...INITIAL,
      supplierCapCutSupplier: "TSMC",
      supplierCapCutPct: 30,
    },
  },
  {
    label: "Apply Q3 demand surge",
    description: "+35% demand across all weeks",
    scenario: {
      ...INITIAL,
      demandSpikePct: 35,
    },
  },
];

function scenariosEqual(a: Scenario, b: Scenario): boolean {
  return (
    a.leadTimeSlipWeeks === b.leadTimeSlipWeeks &&
    a.leadTimeSlipComponentId === b.leadTimeSlipComponentId &&
    a.demandSpikePct === b.demandSpikePct &&
    a.supplierCapCutPct === b.supplierCapCutPct &&
    a.supplierCapCutSupplier === b.supplierCapCutSupplier
  );
}

export function ScenarioPanel() {
  const bom = useStore((s) => s.bom);
  const scenario = useStore((s) => s.scenario);
  const setScenario = useStore((s) => s.setScenario);

  const [draft, setDraft] = useState<Scenario>(scenario);

  // Keep local draft in sync when the store scenario changes externally
  // (preset clicks, reset, etc.).
  useEffect(() => {
    setDraft(scenario);
  }, [scenario]);

  const suppliers = useMemo(
    () => Array.from(new Set(bom.map((c) => c.supplier))).sort(),
    [bom],
  );

  const componentName = useMemo(() => {
    const map = new Map(bom.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? (map.get(id) ?? id) : null);
  }, [bom]);

  const dirty = !scenariosEqual(draft, scenario);

  function updateDraft(patch: Partial<Scenario>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function applyDraft() {
    setScenario(draft);
  }

  function applyPreset(preset: Scenario) {
    setScenario(preset);
  }

  function clearScenario() {
    setScenario(INITIAL);
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Scenario stress test</h2>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              title={preset.description}
              onClick={() => applyPreset(preset.scenario)}
            >
              {preset.label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearScenario}
            title="Reset all scenario inputs to default"
          >
            <RotateCcw className="size-3" />
            Clear
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Lead time slip
          </Label>
          <Select
            value={draft.leadTimeSlipComponentId ?? NONE_VALUE}
            onValueChange={(v) =>
              updateDraft({
                leadTimeSlipComponentId: v === NONE_VALUE ? null : String(v),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a component">
                {componentName(draft.leadTimeSlipComponentId) ?? "Select a component"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>No component selected</SelectItem>
              {bom.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-3 pt-1">
            <Slider
              min={0}
              max={12}
              step={1}
              value={[draft.leadTimeSlipWeeks]}
              onValueChange={(v) =>
                updateDraft({
                  leadTimeSlipWeeks: Array.isArray(v) ? v[0] : Number(v),
                })
              }
            />
            <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              +{draft.leadTimeSlipWeeks}w
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Demand spike</Label>
          <div className="flex items-center gap-3 pt-7">
            <Slider
              min={-50}
              max={100}
              step={5}
              value={[draft.demandSpikePct]}
              onValueChange={(v) =>
                updateDraft({
                  demandSpikePct: Array.isArray(v) ? v[0] : Number(v),
                })
              }
            />
            <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {draft.demandSpikePct > 0 ? "+" : ""}
              {draft.demandSpikePct}%
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Supplier capacity cut
          </Label>
          <Select
            value={draft.supplierCapCutSupplier ?? NONE_VALUE}
            onValueChange={(v) =>
              updateDraft({
                supplierCapCutSupplier: v === NONE_VALUE ? null : String(v),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a supplier">
                {draft.supplierCapCutSupplier ?? "Select a supplier"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>No supplier selected</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-3 pt-1">
            <Slider
              min={0}
              max={100}
              step={5}
              value={[draft.supplierCapCutPct]}
              onValueChange={(v) =>
                updateDraft({
                  supplierCapCutPct: Array.isArray(v) ? v[0] : Number(v),
                })
              }
            />
            <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              -{draft.supplierCapCutPct}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t pt-3">
        <span className="text-xs text-muted-foreground">
          {dirty
            ? "Pending changes. Click Apply to update the plan."
            : "Plan is in sync with the current scenario."}
        </span>
        <Button
          size="sm"
          onClick={applyDraft}
          disabled={!dirty}
          title="Apply the staged scenario to the MRP and risk views"
        >
          <Check className="size-3" />
          Apply scenario
        </Button>
      </div>
    </div>
  );
}
