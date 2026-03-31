"use client";

import * as React from "react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactFlowProvider } from "reactflow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { List, Network, Search } from "lucide-react";

import { Department } from "@/types/departments";
import { CreateDepartmentForm } from "./_components/department-form";
import { DepartmentTable } from "./_components/department-table";
import DepartmentHierarchy from "./_components/department-hierarchy";

// Fetcher for SWR
const fetcher = async (url: string) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  if (!token) throw new Error("Access token not found");

  const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/admin/departments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch departments");
  }

  return res.json();
};

export default function DepartmentsPage() {
  const { data, error, isLoading, mutate } = useSWR<Department[]>(
    "/api/hr/department",
    fetcher
  );

  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  // List or Tree (Hierarchy) View
  const [view, setView] = React.useState<"list" | "tree">("list");

  // Filtered list
  const filteredList = React.useMemo(() => {
    if (!data) return [];

    const q = query.trim().toLowerCase();
    if (!q) return data;

    return data.filter((d) => {
      const byName = d.departmentName.toLowerCase().includes(q);
      const byId = String(d.id) === q;
      const byParent = d.parentDepartmentName?.toLowerCase().includes(q);
      return byName || byParent || byId;
    });
  }, [data, query]);

  return (
    <main className="container mx-auto max-w-6xl p-4 md:p-6">
      {/* HEADER */}
      <header className="mb-4 flex items-center justify-between">
        {/* Add Department Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ Add Department</Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Department</DialogTitle>
            </DialogHeader>

            <CreateDepartmentForm
              parents={data ?? []}
              onSuccess={async () => {
                setOpen(false);
                await mutate(); // refresh list + hierarchy
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Search + View Switch Buttons */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* List View Button */}
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            aria-label="List View"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>

          {/* Hierarchy View Button */}
          <Button
            variant={view === "tree" ? "default" : "outline"}
            size="icon"
            aria-label="Hierarchy View"
            onClick={() => setView("tree")}
          >
            <Network className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* CONTENT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-pretty">
            {view === "list" ? "Departments" : "Department Hierarchy"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Loading / Error States */}
          {isLoading && (
            <div className="text-sm text-muted-foreground">
              Loading departments...
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive">
              Failed to load: {String(error)}
            </div>
          )}

          {/* LIST VIEW */}
          {!isLoading && !error && view === "list" && (
            <DepartmentTable
              data={filteredList}
              onDeleted={async () => mutate()}
            />
          )}

          {/* TREE (ORG-CHART) VIEW */}
          {view === "tree" && (
            <ReactFlowProvider>
              <DepartmentHierarchy data={data ?? []} onReorder={mutate} />
            </ReactFlowProvider>
          )}

          <Separator />

          {/* Pagination Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Result per page - 9</span>
            <span>Page 1 of 1</span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
