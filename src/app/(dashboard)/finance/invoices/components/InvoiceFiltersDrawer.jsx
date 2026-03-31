"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";

export default function InvoiceFiltersDrawer({
  open,
  onClose,
  filters,
  setFilters,
  invoices,
}) {
  if (!open) return null;

  const projectList = ["All", ...new Set(invoices.map(i => i.project?.projectName).filter(Boolean))];
  const statusList = ["All", ...new Set(invoices.map(i => i.status).filter(Boolean))];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="w-[340px] bg-white h-full shadow-lg flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-lg">Filters</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-4 py-4 space-y-4">

          {/* Project */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Project</label>
            <Select
              value={filters.project}
              onValueChange={(v) =>
                setFilters(f => ({ ...f, project: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {projectList.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Status</label>
            <Select
              value={filters.status}
              onValueChange={(v) =>
                setFilters(f => ({ ...f, status: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {statusList.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3 flex justify-end">
          <Button
            variant="outline"
            onClick={() =>
              setFilters(f => ({
                ...f,
                project: "All",
                status: "All",
              }))
            }
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
