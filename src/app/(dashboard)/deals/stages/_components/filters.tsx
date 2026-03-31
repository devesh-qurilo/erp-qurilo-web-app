"use client";

import type { Deal } from "@/types/deals";
import { useMemo } from "react";

export default function Filters({
  deals,
  search,
  onSearchChange,
  pipeline,
  onPipelineChange,
  category,
  onCategoryChange,
}: {
  deals: Deal[];
  search: string;
  onSearchChange: (v: string) => void;
  pipeline: string | null;
  onPipelineChange: (v: string | null) => void;
  category: string | null;
  onCategoryChange: (v: string | null) => void;
}) {
  const pipelineOptions = useMemo(
    () =>
      Array.from(
        new Set(deals.map((d) => d.pipeline).filter(Boolean)),
      ) as string[],
    [deals],
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(deals.map((d) => d.dealCategory).filter(Boolean)),
      ) as string[],
    [deals],
  );

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex-1">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search deals by title, id, agent... "
          className="w-full md:max-w-md rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex items-center gap-2">
        <select
          value={pipeline ?? ""}
          onChange={(e) => onPipelineChange(e.target.value || null)}
          className="rounded-md border border-border bg-background px-2 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{"All Pipelines"}</option>
          {pipelineOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={category ?? ""}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          className="rounded-md border border-border bg-background px-2 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{"All Categories"}</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
