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
  type TaskDetailRecord,
  type TaskLabelRecord,
  type TaskStageRecord,
} from "../api";

interface DuplicateTaskModalProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onCreated: () => void;
  task: TaskDetailRecord;
}

export const DuplicateTaskModal: React.FC<DuplicateTaskModalProps> = ({
  open,
  onOpenChange,
  onCreated,
  task,
}) => {
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
        setError(err instanceof Error ? err.message : "Failed to load duplicate task options");
      }
    })();
  }, [open, token]);

  useEffect(() => {
    if (!open || !task) return;

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
    setAssignedEmployeeIds(task.assignedEmployees?.map((employee) => employee.employeeId) || []);
    setLabelIds(task.labels?.map((label) => String(label.id)) || []);
    setMilestoneId(task.milestoneId ? String(task.milestoneId) : "");
    setFile(null);
    setError(null);
  }, [open, task]);

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

  const handleSave = async () => {
    if (!token) {
      setError("Not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError(null);

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

      onCreated();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to duplicate task");
      alert("Failed to duplicate task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] w-[900px] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Duplicate Task</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5">
          <div>
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
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div>
            <Label>Assign To *</Label>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {projectEmployees.length > 0 ? (
                projectEmployees.map((employee) => (
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

          <div>
            <Label>Labels *</Label>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {labels.map((label) => (
                <div key={label.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={labelIds.includes(String(label.id))}
                    onCheckedChange={() =>
                      setLabelIds(toggle(labelIds, String(label.id)))
                    }
                  />
                  <span>{label.name}</span>
                </div>
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

          <div>
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

          <div>
            <Label>Attachment</Label>
            <Input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} type="button">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Duplicate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
