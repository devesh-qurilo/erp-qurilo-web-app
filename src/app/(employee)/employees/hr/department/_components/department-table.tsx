"use client";

import { useRouter } from "next/navigation";
import type { Department } from "../../../../../types/departments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Trash2, PencilLine } from "lucide-react";
import { toast } from "sonner";

type Props = {
  data: Department[];
  onDeleted?: () => void; // SWR mutate trigger
};

export function DepartmentTable({ data, onDeleted }: Props) {
  const router = useRouter();

  // ⭐ FIXED: correct delete API
  const handleDelete = async (id: number) => {
    const ok = confirm("Delete this department?");
    if (!ok) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Access token not found");

      // Backend API → NOT the Next.js API
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAIN}/admin/departments/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete department");
      }

      toast.success("Department deleted");
      onDeleted?.(); // SWR refetch
    } catch (error: any) {
      toast.error("Delete failed", {
        description: error.message,
      });
    }
  };

  // ⭐ FIXED EDIT HANDLER
  const handleEdit = (id: number) => {
    router.push(`/hr/department/${id}`); // your edit page
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[45%]">Name</TableHead>
            <TableHead className="w-[45%]">Parent Department</TableHead>
            <TableHead className="text-left w-[10%]">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((dept) => (
            <TableRow key={dept.id}>
              <TableCell className="font-medium">
                {dept.departmentName}
              </TableCell>

              <TableCell className="text-muted-foreground">
                {dept.parentDepartmentName ?? "--"}
              </TableCell>

              <TableCell className="text-left">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <EllipsisVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => handleEdit(dept.id)}>
                      <PencilLine className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(dept.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}

          {data.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground"
              >
                No departments found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
