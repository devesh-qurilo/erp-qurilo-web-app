// app/(dashboard)/hr/department/_components/org-node.tsx
"use client";

import React from "react";
import { Handle, Position } from "reactflow";
import {
  Users,
  FolderTree,
  Trash2,
  Plus,
  ArrowLeftRight,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  data: {
    label: string;
    color?: string;
    icon?: "team" | "unit" | "dept";
    onDetach?: (id: string) => void;
    onAddChild?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
  };
  id: string;
};

export default function OrgNode({ data, id }: Props) {
  const colorClass = data.color ?? "border-blue-400";

  return (
    <div
      className={`rounded-xl border ${colorClass} shadow-sm px-4 py-3 min-w-[180px] bg-white`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold">
          {data.icon === "team" && <Users className="h-4 w-4 text-slate-700" />}
          {data.icon === "unit" && (
            <FolderTree className="h-4 w-4 text-slate-700" />
          )}
          {data.icon === "dept" && (
            <FolderTree className="h-4 w-4 text-slate-700" />
          )}
          <span>{data.label}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => data.onDetach?.(id)}
            title="Detach (make top-level)"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => data.onAddChild?.(id)}
            title="Add Child"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => data.onRename?.(id)}
            title="Rename"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => data.onDelete?.(id)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* top handle for incoming edges */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#94a3b8" }}
      />
      {/* bottom handle for outgoing edges */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#94a3b8" }}
      />
    </div>
  );
}
