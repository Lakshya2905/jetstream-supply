"use client";

import { useMemo } from "react";
import { RotateCcw } from "lucide-react";
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

export function ScenarioPanel() {
  const bom = useStore((s) => s.bom);
  const scenario = useStore((s) => s.scenario);
  const setScenario = useStore((s) => s.setScenario);

  const suppliers = useMemo(
    () => Array.from(new Set(bom.map((c) => c.supplier))).sort(),
    [bom],
  );

  function update(patch: Partial<Scenario>) {
    setScenario({ ...scenario, ...patch });
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Scenario stress test</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setScenario(INITIAL)}
        >
          <RotateCcw className="size-3" />
          Reset scenario
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Lead time slip
          </Label>
          <Select
            value={scenario.leadTimeSlipComponentId ?? NONE_VALUE}
            onValueChange={(v) =>
              update({
                leadTimeSlipComponentId: v === NONE_VALUE ? null : String(v),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose component" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>None</SelectItem>
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
              value={[scenario.leadTimeSlipWeeks]}
              onValueChange={(v) =>
                update({
                  leadTimeSlipWeeks: Array.isArray(v) ? v[0] : Number(v),
                })
              }
            />
            <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              +{scenario.leadTimeSlipWeeks}w
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
              value={[scenario.demandSpikePct]}
              onValueChange={(v) =>
                update({
                  demandSpikePct: Array.isArray(v) ? v[0] : Number(v),
                })
              }
            />
            <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {scenario.demandSpikePct > 0 ? "+" : ""}
              {scenario.demandSpikePct}%
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Supplier capacity cut
          </Label>
          <Select
            value={scenario.supplierCapCutSupplier ?? NONE_VALUE}
            onValueChange={(v) =>
              update({
                supplierCapCutSupplier: v === NONE_VALUE ? null : String(v),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>None</SelectItem>
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
              value={[scenario.supplierCapCutPct]}
              onValueChange={(v) =>
                update({
                  supplierCapCutPct: Array.isArray(v) ? v[0] : Number(v),
                })
              }
            />
            <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              -{scenario.supplierCapCutPct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
