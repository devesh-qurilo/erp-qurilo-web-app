"use client";

import React, { useEffect, useMemo, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

import { AddLabelModal } from "./AddLabelModal";
import {
  createProjectTask,
  fetchProjectAssignableEmployees,
  fetchProjectLabels,
  fetchProjectList,
  fetchProjectMilestones,
  fetchTaskCategories,
  fetchTaskStages,
  getStoredAccessToken,
  type ProjectEmployeeRecord,
  type ProjectMilestoneRecord,
  type ProjectRecord,
  type TaskCategoryRecord,
  type TaskLabelRecord,
  type TaskStageRecord,
} from "../api";

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onCreated: () => void;
}

const emptyError = null;

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
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
  const [error, setError] = useState<string | null>(emptyError);

  const [categories, setCategories] = useState<TaskCategoryRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [stages, setStages] = useState<TaskStageRecord[]>([]);
  const [projectEmployees, setProjectEmployees] = useState<ProjectEmployeeRecord[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestoneRecord[]>([]);
  const [labels, setLabels] = useState<TaskLabelRecord[]>([]);

  const [labelModalOpen, setLabelModalOpen] = useState(false);

  const token = getStoredAccessToken();

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setProjectId("");
    setStartDate("");
    setDueDate("");
    setTaskStageId("");
    setAssignedEmployeeIds([]);
    setDescription("");
    setLabelIds([]);
    setPriority("");
    setIsPrivate(false);
    setTimeEstimate(false);
    setTimeEstimateMinutes("");
    setIsDependent(false);
    setMilestoneId("");
    setFile(null);
    setError(emptyError);
    setProjectEmployees([]);
    setMilestones([]);
    setLabels([]);
  };

  useEffect(() => {
    if (!open || !token) return;

    void (async () => {
      try {
        setError(emptyError);
        const [nextCategories, nextProjects, nextStages] = await Promise.all([
          fetchTaskCategories(token),
          fetchProjectList(token),
          fetchTaskStages(token),
        ]);

        setCategories(nextCategories);
        setProjects(nextProjects);
        setStages(nextStages);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load task options");
      }
    })();
  }, [open, token]);

  useEffect(() => {
    if (open) return;
    resetForm();
  }, [open]);

  useEffect(() => {
    if (!projectId || !token) {
      setProjectEmployees([]);
      setMilestones([]);
      setLabels([]);
      setAssignedEmployeeIds([]);
      setMilestoneId("");
      setLabelIds([]);
      return;
    }

    void (async () => {
      try {
        setError(emptyError);
        const [nextMilestones, nextLabels, nextEmployees] = await Promise.all([
          fetchProjectMilestones(token, projectId),
          fetchProjectLabels(token, projectId),
          fetchProjectAssignableEmployees(token, projectId),
        ]);

        setMilestones(nextMilestones);
        setLabels(nextLabels);
        setProjectEmployees(nextEmployees);
        setAssignedEmployeeIds((previous) =>
          previous.filter((employeeId) =>
            nextEmployees.some((employee) => employee.employeeId === employeeId),
          ),
        );
        setLabelIds((previous) =>
          previous.filter((labelId) =>
            nextLabels.some((label) => String(label.id) === labelId),
          ),
        );
        setMilestoneId((previous) =>
          nextMilestones.some((milestone) => String(milestone.id) === previous)
            ? previous
            : "",
        );
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load project task options");
      }
    })();
  }, [projectId, token]);

  const projectAssignedEmployees = useMemo(() => projectEmployees, [projectEmployees]);

  const toggle = (values: string[], nextValue: string) =>
    values.includes(nextValue)
      ? values.filter((value) => value !== nextValue)
      : [...values, nextValue];

  const handleSave = async () => {
    if (!token) {
      setError("Not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError(emptyError);

      await createProjectTask(token, {
        title,
        category,
        projectId,
        startDate,
        dueDate,
        taskStageId,
        description,
        priority,
        isPrivate,
        timeEstimate,
        timeEstimateMinutes,
        isDependent,
        milestoneId,
        assignedEmployeeIds,
        labelIds,
        file,
      });

      resetForm();
      onCreated();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create task");
      alert("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[83%] max-w-[83%] h-screen overflow-y-auto p-0 sm:max-w-[83%]"
      >
        <SheetHeader className="px-6 py-4 border-b bg-slate-50">
          <SheetTitle className="text-lg font-semibold">
            Add New Task
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <Label>Title *</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div>
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((item) => (
                  <SelectItem value={String(item.id)} key={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem value={String(project.id)} key={project.id}>
                    {project.shortCode} - {project.name || project.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Milestone *</Label>
            <Select value={milestoneId} onValueChange={setMilestoneId}>
              <SelectTrigger>
                <SelectValue placeholder="Select milestone" />
              </SelectTrigger>
              <SelectContent>
                {milestones.map((item) => (
                  <SelectItem value={String(item.id)} key={item.id}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Task Stage *</Label>
            <Select value={taskStageId} onValueChange={setTaskStageId}>
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((item) => (
                  <SelectItem value={String(item.id)} key={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <div className="lg:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="lg:col-span-2">
            <Label>Assign To *</Label>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {projectAssignedEmployees.length > 0 ? (
                projectAssignedEmployees.map((employee) => (
                  <div key={employee.employeeId} className="flex items-center gap-2">
                    <Checkbox
                      checked={assignedEmployeeIds.includes(employee.employeeId)}
                      onCheckedChange={() =>
                        setAssignedEmployeeIds(
                          toggle(assignedEmployeeIds, employee.employeeId),
                        )
                      }
                    />
                    <span className="text-sm">{employee.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {projectId ? "No project members found" : "Select a project first"}
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Labels *</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLabelModalOpen(true)}
                disabled={!projectId}
                type="button"
              >
                + Add Label
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {labels.map((label) => (
                <div key={label.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={labelIds.includes(String(label.id))}
                    onCheckedChange={() =>
                      setLabelIds(toggle(labelIds, String(label.id)))
                    }
                  />
                  <span className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: label.colorCode ?? "#94a3b8" }}
                    />
                    {label.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <AddLabelModal
            open={labelModalOpen}
            onOpenChange={setLabelModalOpen}
            projectId={projectId}
            onCreated={() => {
              if (!projectId || !token) return;

              void (async () => {
                try {
                  setLabels(await fetchProjectLabels(token, projectId));
                } catch (err) {
                  console.error(err);
                  setError(err instanceof Error ? err.message : "Failed to refresh labels");
                }
              })();
            }}
          />

          <div>
            <Label>Start Date *</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>

          <div>
            <Label>Due Date *</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>

          <div className="lg:col-span-2">
            <Label>Description *</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div>
            <Label>Priority *</Label>
            <Select value={priority} onValueChange={setPriority}>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex gap-2 items-center">
              <Checkbox
                checked={isPrivate}
                onCheckedChange={(value) => setIsPrivate(Boolean(value))}
              />
              <span>Private Task</span>
            </div>

            <div className="flex gap-2 items-center">
              <Checkbox
                checked={isDependent}
                onCheckedChange={(value) => setIsDependent(Boolean(value))}
              />
              <span>Dependent Task</span>
            </div>

            <div className="flex gap-2 items-center">
              <Checkbox
                checked={timeEstimate}
                onCheckedChange={(value) => setTimeEstimate(Boolean(value))}
              />
              <span>Time Estimate</span>
            </div>

            {timeEstimate ? (
              <Input
                placeholder="Minutes"
                value={timeEstimateMinutes}
                onChange={(event) => setTimeEstimateMinutes(event.target.value)}
              />
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <Label>Attachment</Label>
            <Input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={loading} type="button">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save Task"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
