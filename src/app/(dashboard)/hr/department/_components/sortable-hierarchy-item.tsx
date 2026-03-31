"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FolderTree } from "lucide-react";
import { Department } from "@/types/departments";
import { Button } from "@/components/ui/button";

type Props = {
  item: Department;
  onDropParent: (parentId: number | null) => void;
};

export function SortableHierarchyItem({ item, onDropParent }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="flex items-center gap-3 p-2 border rounded mb-2 bg-card cursor-move"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <FolderTree className="h-4 w-4 text-primary" />
      <span className="flex-1">{item.departmentName}</span>

      {/* Change Parent */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          const parent = prompt(
            "Enter new parent department ID (or empty for none):"
          );
          if (parent === null) return;
          onDropParent(parent ? Number(parent) : null);
        }}
      >
        Set Parent
      </Button>
    </div>
  );
}
