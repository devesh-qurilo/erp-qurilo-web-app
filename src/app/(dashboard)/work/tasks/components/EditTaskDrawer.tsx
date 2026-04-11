"use client";

import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import {
  fetchProjectAssignableEmployees,
  fetchProjectLabels,
  fetchProjectList,
  fetchProjectMilestones,
  fetchTaskById,
  fetchTaskCategories,
  fetchTaskStages,
  getStoredAccessToken,
  updateProjectTask,
  type ProjectEmployeeRecord,
  type ProjectMilestoneRecord,
  type ProjectRecord,
  type TaskCategoryRecord,
  type TaskDetailRecord,
  type TaskLabelRecord,
  type TaskStageRecord,
} from "../api";

interface EditTaskDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number | null;
  onUpdated: () => void;
}

export default function EditTaskDrawer({
  open,
  onOpenChange,
  taskId,
  onUpdated,
}: EditTaskDrawerProps) {
  const token = getStoredAccessToken();

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
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<TaskCategoryRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [stages, setStages] = useState<TaskStageRecord[]>([]);
  const [projectEmployees, setProjectEmployees] = useState<ProjectEmployeeRecord[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestoneRecord[]>([]);
  const [labels, setLabels] = useState<TaskLabelRecord[]>([]);

  const toggle = (values: string[], nextValue: string) =>
    values.includes(nextValue)
      ? values.filter((value) => value !== nextValue)
      : [...values, nextValue];

  const fillFromTask = (task: TaskDetailRecord) => {
    setTitle(task.title || "");
    setCategory(String(task.categoryId?.id ?? ""));
    setProjectId(String(task.projectId ?? ""));
    setStartDate(task.startDate || "");
    setDueDate(task.dueDate || "");
    setTaskStageId(String(task.taskStageId ?? ""));
    setDescription(task.description || "");
    setPriority(task.priority || "");
    setIsPrivate(Boolean(task.isPrivate));
    setTimeEstimate(Boolean(task.timeEstimate));
    setTimeEstimateMinutes(task.timeEstimateMinutes ? String(task.timeEstimateMinutes) : "");
    setIsDependent(Boolean(task.isDependent));
    setMilestoneId(task.milestoneId ? String(task.milestoneId) : "");
    setAssignedEmployeeIds(task.assignedEmployeeIds ?? []);
    setLabelIds(task.labels?.map((label) => String(label.id)) || []);
    setFile(null);
  };

  useEffect(() => {
    if (!open || !token) return;

    void (async () => {
      try {
        setError(null);
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
        setError(err instanceof Error ? err.message : "Failed to load edit options");
      }
    })();
  }, [open, token]);

  useEffect(() => {
    if (!open || !taskId || !token) return;

    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const task = await fetchTaskById(token, taskId);
        fillFromTask(task);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load task");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, taskId, token]);

  useEffect(() => {
    if (!projectId || !token) {
      setMilestones([]);
      setLabels([]);
      setProjectEmployees([]);
      setAssignedEmployeeIds([]);
      setMilestoneId("");
      return;
    }

    void (async () => {
      try {
        setError(null);
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

  const handleUpdate = async () => {
    if (!token || !taskId) {
      setError("Not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updateProjectTask(token, taskId, {
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

      onUpdated();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update task");
      alert("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[999] bg-black/30 transition-opacity duration-300 ${
        open ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      <div
        className={`fixed right-0 top-0 h-full w-[83vw] max-w-[83vw] bg-white shadow-xl border-l overflow-y-auto transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <h2 className="text-xl font-semibold">Edit Task</h2>

          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded hover:bg-gray-100"
            type="button"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="flex justify-center py-20 lg:col-span-2">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              <div className="lg:col-span-2">
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>

              <div>
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
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
                      <SelectItem key={project.id} value={String(project.id)}>
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
                      <SelectItem key={item.id} value={String(item.id)}>
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
                      <SelectItem key={item.id} value={String(item.id)}>
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
                <Label>Assign To</Label>
                {projectId ? (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {projectEmployees.map((employee) => (
                      <label key={employee.employeeId} className="flex items-center gap-2">
                        <Checkbox
                          checked={assignedEmployeeIds.includes(employee.employeeId)}
                          onCheckedChange={() =>
                            setAssignedEmployeeIds(
                              toggle(assignedEmployeeIds, employee.employeeId),
                            )
                          }
                        />
                        {employee.name}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 pt-2">
                    Select a project first
                  </p>
                )}
              </div>

              <div className="lg:col-span-2">
                <Label>Labels</Label>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {labels.map((label) => (
                    <label
                      key={label.id}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        checked={labelIds.includes(String(label.id))}
                        onCheckedChange={() =>
                          setLabelIds(toggle(labelIds, String(label.id)))
                        }
                      />
                      {label.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="lg:col-span-2">
                <Label>Description</Label>
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

              <div className="lg:col-span-2 grid grid-cols-3 gap-4">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={isPrivate}
                    onCheckedChange={(value) => setIsPrivate(Boolean(value))}
                  />
                  Private Task
                </label>

                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={isDependent}
                    onCheckedChange={(value) => setIsDependent(Boolean(value))}
                  />
                  Dependent Task
                </label>

                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={timeEstimate}
                    onCheckedChange={(value) => setTimeEstimate(Boolean(value))}
                  />
                  Time Estimate
                </label>

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
            </>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t bg-white">
          <button
            onClick={() => onOpenChange(false)}
            className="px-5 py-2 rounded-md border"
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={handleUpdate}
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 text-white rounded-md"
            type="button"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Update Task"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
