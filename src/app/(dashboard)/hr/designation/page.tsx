"use client";

import type React from "react";
import { useState, useMemo } from "react";
import useSWR from "swr";
import { Search, Plus, Edit2, Trash2, X, List, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import DesignationHierarchy from "./DesignationHierarchy";
import { ReactFlowProvider } from "reactflow";
import { format } from "date-fns";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface Designation {
  id: number;
  designationName: string;
  parentDesignationId: number | null;
  parentDesignationName: string | null;
  createdAt: string;
}

/* ================= FETCHER ================= */
const fetcher = async () => {
  const token = localStorage.getItem("accessToken");
  if (!token) throw new Error("No token");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_MAIN}/admin/designations`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!res.ok) throw new Error("Failed to fetch designations");
  return res.json();
};

export default function DesignationsPage() {
  const { data, isLoading, error, mutate } = useSWR<Designation[]>(
    "designations",
    fetcher,
  );

  /* ================= UI STATE ================= */
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [view, setView] = useState<"list" | "network">("list");

  /* ================= ADD FORM STATE ================= */
  const [designationName, setDesignationName] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* ================= EDIT STATE ================= */
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState<number | null>(null);

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((d) =>
      d.designationName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [data, search]);
  console.log("first", filtered);

  const formatKey = (date: string) => {
    return new Date(date).toISOString().slice(0, 10); // YYYY-MM-DD
  };

  /* ================= ADD ================= */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No token");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAIN}/admin/designations`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            designationName,
            parentDesignationId: parentId,
          }),
        },
      );

      if (!res.ok) throw new Error("Failed to create designation");

      await mutate();
      setShowAddModal(false);
      setDesignationName("");
      setParentId(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ================= LOAD FOR EDIT ================= */
  const loadForEdit = (d: Designation) => {
    setEditingId(d.id);
    setEditName(d.designationName);
    setEditParentId(d.parentDesignationId);
  };

  /* ================= UPDATE ================= */
  const handleUpdate = async (id: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      await fetch(`${process.env.NEXT_PUBLIC_MAIN}/admin/designations/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          designationName: editName,
          parentDesignationId: editParentId,
        }),
      });

      setEditingId(null);
      mutate();
    } catch {
      alert("Update failed");
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("accessToken");
    // if (!token) return;
    //console.log("delete mmm", id)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_MAIN}/admin/designations/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      alert("Delete failed");
      return;
    }

    // FORCE fresh fetch
    await mutate(undefined, { revalidate: true });
    // fetcher()
  };

  // if (isLoading) return <div className="p-6">Loading…</div>
  if (error) return <div className="p-6 text-red-500">{error.message}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        {isLoading ? (
          <>
            <Skeleton width={180} height={35} />
            <div className="flex gap-2">
              <Skeleton width={200} height={35} />
              <Skeleton width={40} height={40} />
              <Skeleton width={40} height={40} />
            </div>
          </>
        ) : (
          <>
            {/* <h1 className="text-2xl font-bold">Designations</h1> */}
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Designation
            </Button>
            <div className="flex gap-2">
              {/* SEARCH */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                {isLoading ? (
                  <Skeleton width={200} height={35} />
                ) : (
                  <Input
                    placeholder="Search designation…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                )}
              </div>

              <Button
                size="icon"
                variant={view === "list" ? "default" : "outline"}
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant={view === "network" ? "default" : "outline"}
                onClick={() => setView("network")}
              >
                <Network className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* TABLE */}

      {view === "list" && (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Parent</th>
                <th className="p-3 text-left">Created</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            {/* <tbody>
              {filtered.map((d) => ( */}

            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3">
                        <Skeleton width={140} />
                      </td>
                      <td className="p-3">
                        <Skeleton width={100} />
                      </td>
                      <td className="p-3">
                        <Skeleton width={80} />
                      </td>
                      <td className="p-3">
                        <Skeleton width={60} />
                      </td>
                    </tr>
                  ))
                : filtered.map((d) => (
                    <tr key={d.id} className="border-t">
                      <td className="p-3">
                        {editingId === d.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          d.designationName
                        )}
                      </td>

                      <td className="p-3">{d.id || "-"}</td>
                      <td className="p-3">
                        {formatKey(d.createdAt)}
                        {/* {d.createDate
                          ? format(new Date(d.createDate), "dd-MM-yyyy")
                          : "—"} */}
                      </td>
                      <td className="p-3 relative">
                        {editingId === d.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdate(d.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadForEdit(d)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(d.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* {view === "network" && (
        <ReactFlowProvider>
          <DesignationHierarchy
            data={data || []}
            onReorder={mutate}
          />
        </ReactFlowProvider>
      )} */}

      {view === "network" &&
        (isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <Skeleton width="90%" height={350} />
          </div>
        ) : (
          <ReactFlowProvider>
            <DesignationHierarchy data={data || []} onReorder={mutate} />
          </ReactFlowProvider>
        ))}

      {/* ================= ADD MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-lg p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-3 right-3"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-semibold mb-4">Add Designation</h2>

            <form onSubmit={handleAdd} className="space-y-4">
              <Input
                placeholder="Designation name"
                value={designationName}
                onChange={(e) => setDesignationName(e.target.value)}
                required
              />

              <select
                value={parentId ?? ""}
                onChange={(e) =>
                  setParentId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="">No Parent</option>
                {data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.designationName}
                  </option>
                ))}
              </select>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
