"use client";

import type * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { Department } from "../../../../../types/departments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Props = {
  parents: Department[];
  initialName?: string; // ⭐ NEW
  initialParentId?: number | null;
  editId?: number | null; // ⭐ NEW (this tells form it's EDIT mode)
  onSuccess?: (d: Department) => void;
};

export function CreateDepartmentForm({
  parents,
  initialName = "",
  initialParentId = null,
  editId = null,
  onSuccess,
}: Props) {
  // ⭐ Auto-fill form for edit
  const [name, setName] = useState(initialName);
  const [parentId, setParentId] = useState<number | null>(initialParentId);
  const [submitting, setSubmitting] = useState(false);

  // When edit mode loads late (SWR), sync form again
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  useEffect(() => {
    setParentId(initialParentId);
  }, [initialParentId]);

  // Sort parent list
  const parentOptions = useMemo(
    () =>
      parents.sort((a, b) => a.departmentName.localeCompare(b.departmentName)),
    [parents]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Department name is required");
      return;
    }

    try {
      setSubmitting(true);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;
      if (!token) throw new Error("Access token not found");

      const payload = {
        departmentName: name.trim(),
        parentDepartmentId: parentId,
      };

      let url = "";
      let method = "";

      // ⭐ Detect mode
      if (editId) {
        // EDIT MODE
        url = `${process.env.NEXT_PUBLIC_MAIN}/admin/departments/${editId}`;
        method = "PUT";
      } else {
        // CREATE MODE
        url = `${process.env.NEXT_PUBLIC_MAIN}/admin/departments`;
        method = "POST";
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(
          errorBody.error || errorBody.message || "Failed to submit form"
        );
      }

      const data: Department = await res.json();

      toast.success(editId ? "Department updated" : "Department created", {
        description: `"${data.departmentName}" saved successfully.`,
      });

      onSuccess?.(data);
    } catch (err: any) {
      toast.error("Request failed", {
        description: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* NAME */}
      <div className="grid gap-2">
        <Label htmlFor="dept-name">Department name</Label>
        <Input
          id="dept-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Marketing"
        />
      </div>

      {/* PARENT */}
      <div className="grid gap-2">
        <Label>Parent department</Label>
        <Select
          value={parentId === null ? "none" : String(parentId)}
          onValueChange={(v) => setParentId(v === "none" ? null : Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="No parent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No parent</SelectItem>
            {parentOptions.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.departmentName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* SUBMIT BUTTON */}
      <Button type="submit" disabled={submitting}>
        {submitting
          ? editId
            ? "Updating..."
            : "Creating..."
          : editId
            ? "Update Department"
            : "Create Department"}
      </Button>
    </form>
  );
}
