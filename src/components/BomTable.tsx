"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { Component } from "@/lib/types";

type SortKey =
  | "name"
  | "category"
  | "supplier"
  | "region"
  | "leadTimeWeeks"
  | "source"
  | "onHand"
  | "unitCost";

type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "supplier", label: "Supplier" },
  { key: "region", label: "Region" },
  { key: "leadTimeWeeks", label: "Lead Time", align: "right" },
  { key: "source", label: "Source" },
  { key: "onHand", label: "On Hand", align: "right" },
  { key: "unitCost", label: "Unit Cost", align: "right" },
];

const CATEGORIES = [
  "Silicon",
  "Memory",
  "Power",
  "Optics",
  "Passives",
  "PCB",
  "Mechanical",
  "Connector",
] as const;

export function BomTable() {
  const bom = useStore((s) => s.bom);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const visible = useMemo(() => {
    const filtered = activeCategory
      ? bom.filter((c) => c.category === activeCategory)
      : bom;
    const sorted = [...filtered].sort((a, b) => compare(a, b, sortKey));
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [bom, sortKey, sortDir, activeCategory]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Filter:</span>
        <Badge
          variant={activeCategory === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setActiveCategory(null)}
        >
          All
        </Badge>
        {CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead
                  key={col.key}
                  className={col.align === "right" ? "text-right" : undefined}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 h-7 gap-1 px-2 font-medium"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    <SortIcon
                      active={sortKey === col.key}
                      direction={sortDir}
                    />
                  </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((comp) => (
              <TableRow key={comp.id}>
                <TableCell className="font-medium">{comp.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {comp.category}
                </TableCell>
                <TableCell>{comp.supplier}</TableCell>
                <TableCell>{comp.region}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {comp.leadTimeWeeks}w
                </TableCell>
                <TableCell>
                  <SourceBadge source={comp.source} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {comp.onHand.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  ${formatCost(comp.unitCost)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function compare(a: Component, b: Component, key: SortKey): number {
  const av = a[key];
  const bv = b[key];
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av).localeCompare(String(bv));
}

function formatCost(value: number): string {
  return value < 1 ? value.toFixed(2) : value.toLocaleString();
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDir;
}) {
  if (!active) {
    return <ChevronsUpDown className="size-3 opacity-40" />;
  }
  return direction === "asc" ? (
    <ArrowUp className="size-3" />
  ) : (
    <ArrowDown className="size-3" />
  );
}

function SourceBadge({ source }: { source: Component["source"] }) {
  const variant =
    source === "sole" ? "destructive" : source === "dual" ? "secondary" : "outline";
  return <Badge variant={variant}>{source}</Badge>;
}
