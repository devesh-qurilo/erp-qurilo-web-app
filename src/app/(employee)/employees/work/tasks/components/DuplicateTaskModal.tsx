"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

/* ================= PROPS ================= */
interface DuplicateTaskModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
  task: any; // existing task to duplicate
}

/* ================= COMPONENT ================= */
export const DuplicateTaskModal: React.FC<DuplicateTaskModalProps> = ({
  open,
  onOpenChange,
  onCreated,
  task,
}) => {
  const MAIN = process.env.NEXT_PUBLIC_MAIN;
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("accessToken")
      : null;

  /* ================= FORM STATES ================= */
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskStageId, setTaskStageId] = useState("");
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [priority, setPriority] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [timeEstimate, setTimeEstimate] = useState(false);
  const [timeEstimateMinutes, setTimeEstimateMinutes] = useState("");
  const [isDependent, setIsDependent] = useState(false);
  const [milestoneId, setMilestoneId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  /* ================= API DATA ================= */
  const [categories, setCategories] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);

  /* ================= FETCHERS ================= */
  const fetchCategories = async () => {
    const res = await fetch(`${MAIN}/task/task-categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCategories(await res.json());
  };

  const fetchProjects = async () => {
    const res = await fetch(`${MAIN}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProjects(await res.json());
  };

  const fetchStages = async () => {
    const res = await fetch(`${MAIN}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStages(await res.json());
  };

  const fetchEmployees = async () => {
    const res = await fetch(`${MAIN}/employee/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setEmployees(await res.json());
  };

  const fetchMilestones = async (pid: string) => {
    if (!pid) return;
    const res = await fetch(`${MAIN}/api/projects/${pid}/milestones`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMilestones(await res.json());
  };

  const fetchLabels = async (pid: string) => {
    if (!pid) return;
    const res = await fetch(`${MAIN}/projects/${pid}/labels`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setLabels(await res.json());
  };

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    if (!open) return;

    fetchCategories();
    fetchProjects();
    fetchStages();
    fetchEmployees();
  }, [open]);

  /* ================= PREFILL DATA ================= */
  useEffect(() => {
    if (!open || !task) return;

    setTitle(task.title || "");
    setCategory(String(task.categoryId || ""));
    setProjectId(String(task.projectId || ""));
    setStartDate(task.startDate || "");
    setDueDate(task.dueDate || "");
    setTaskStageId(String(task.taskStageId || ""));
    setDescription(task.description || "");
    setPriority(task.priority || "");
    setIsPrivate(Boolean(task.isPrivate));
    setTimeEstimate(Boolean(task.timeEstimate));
    setTimeEstimateMinutes(
      task.timeEstimateMinutes ? String(task.timeEstimateMinutes) : ""
    );
    setIsDependent(Boolean(task.isDependent));
    setMilestoneId(String(task.milestoneId || ""));

    setAssignedEmployeeIds(
      task.assignedEmployees?.map((e: any) => e.employeeId) || []
    );

    setLabelIds(task.labels?.map((l: any) => String(l.id)) || []);
  }, [open, task]);

  /* ================= DEPENDENCIES ================= */
  useEffect(() => {
    if (projectId) {
      fetchMilestones(projectId);
      fetchLabels(projectId);
    }
  }, [projectId]);

  /* ================= HELPERS ================= */
  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  /* ================= SUBMIT ================= */
  const handleSave = async () => {
    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("title", title);
      fd.append("category", category);
      fd.append("projectId", projectId);
      fd.append("startDate", startDate);
      fd.append("dueDate", dueDate);
      fd.append("taskStageId", taskStageId);
      fd.append("description", description);
      fd.append("priority", priority);
      fd.append("isPrivate", String(isPrivate));
      fd.append("timeEstimate", String(timeEstimate));
      fd.append("timeEstimateMinutes", timeEstimateMinutes);
      fd.append("isDependent", String(isDependent));
      fd.append("milestoneId", milestoneId);

      assignedEmployeeIds.forEach((id) =>
        fd.append("assignedEmployeeIds", id)
      );
      labelIds.forEach((id) => fd.append("labelIds", id));

      if (file) fd.append("taskFile", file);

      const res = await fetch(`${MAIN}/api/projects/tasks`, {
        method: "POST",
        body: fd,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed");

      onCreated();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      alert("Failed to duplicate task");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] w-[900px] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Duplicate Task</DialogTitle>
        </DialogHeader>

        {/* SAME UI AS ADD TASK */}
        {/* (UI intentionally kept identical) */}

   <div className="grid gap-5">
                    {/* Title */}
                    <div>
                        <Label>Title *</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    {/* Category */}
                    <div>
                        <Label>Category *</Label>
                        <Select onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem value={String(c.id)} key={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Project */}
                    <div>
                        <Label>Project *</Label>
                        <Select onValueChange={setProjectId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((p) => (
                                    <SelectItem value={String(p.id)} key={p.id}>
                                        {p.shortCode} - {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Milestones */}
                    <div>
                        <Label>Milestone *</Label>
                        <Select onValueChange={setMilestoneId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select milestone" />
                            </SelectTrigger>
                            <SelectContent>
                                {milestones.map((m) => (
                                    <SelectItem value={String(m.id)} key={m.id}>
                                        {m.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Stage */}
                    <div>
                        <Label>Task Stage *</Label>
                        <Select onValueChange={setTaskStageId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                            <SelectContent>
                                {stages.map((s) => (
                                    <SelectItem value={String(s.id)} key={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Assigned Employees */}
                    <div>
                        <Label>Assign To *</Label>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            {employees.map((emp) => (
                                <div key={emp.employeeId} className="flex items-center gap-2">
                                    <Checkbox
                                        checked={assignedEmployeeIds.includes(emp.employeeId)}
                                        onCheckedChange={() =>
                                            setAssignedEmployeeIds(
                                                toggle(assignedEmployeeIds, emp.employeeId)
                                            )
                                        }
                                    />
                                    <span className="text-sm">{emp.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Labels */}
                    <div>
                        <Label>Labels *</Label>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            {labels.map((l) => (
                                <div key={l.id} className="flex items-center gap-2">
                                    <Checkbox
                                        checked={labelIds.includes(String(l.id))}
                                        onCheckedChange={() =>
                                            setLabelIds(toggle(labelIds, String(l.id)))
                                        }
                                    />
                                    <span>{l.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Start Date *</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Due Date *</Label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <Label>Description *</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <Label>Priority *</Label>
                        <Select onValueChange={setPriority}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex gap-2 items-center">
                            <Checkbox
                                checked={isPrivate}
                                onCheckedChange={(v) => setIsPrivate(Boolean(v))}
                            />
                            <span>Private Task</span>
                        </div>

                        <div className="flex gap-2 items-center">
                            <Checkbox
                                checked={isDependent}
                                onCheckedChange={(v) => setIsDependent(Boolean(v))}
                            />
                            <span>Dependent Task</span>
                        </div>

                        <div className="flex gap-2 items-center">
                            <Checkbox
                                checked={timeEstimate}
                                onCheckedChange={(v) => setTimeEstimate(Boolean(v))}
                            />
                            <span>Time Estimate</span>
                        </div>

                        {timeEstimate && (
                            <Input
                                placeholder="Minutes"
                                value={timeEstimateMinutes}
                                onChange={(e) => setTimeEstimateMinutes(e.target.value)}
                            />
                        )}
                    </div>

                    {/* File Upload */}
                    <div>
                        <Label>Attachment *</Label>
                        <Input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                    </div>
                </div>





        {/* FOOTER */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save Task"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
