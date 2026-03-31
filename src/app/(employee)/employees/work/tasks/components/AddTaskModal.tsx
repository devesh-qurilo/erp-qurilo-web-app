"use client";

import React, { useEffect, useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

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

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
  // const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY;
  const MAIN = process.env.NEXT_PUBLIC_MAIN;

  // ---------------- FORM STATES ----------------
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

  // ---------------- API DATA STATES ----------------
  const [categories, setCategories] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  // const [employees, setEmployees] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);

  const [projectTasks, setProjectTasks] = useState<any[]>([]);

  // ---------------- API FETCH ----------------
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("accessToken")
      : null;
  // Task Categories
  const fetchCategories = async () => {
    const token = localStorage.getItem("accessToken");
    const res = await fetch(`${MAIN}/task/task-categories`, {
      // TODO: yaha pe agar token chahiye ho to header add karna
      headers: { Authorization: `Bearer ${token}` },
      // credentials: "include",
    });
    const data = await res.json();
    setCategories(data);
  };

  // Projects
  const fetchProjects = async () => {
    const res = await fetch(`${MAIN}/projects`, {
      // TODO: yaha pe agar token chahiye ho to header add karna
      headers: { Authorization: `Bearer ${token}` },
      // credentials: "include",
    });
    const data = await res.json();
    setProjects(data);
  };

  // Stages
  const fetchStages = async () => {
    const res = await fetch(`${MAIN}/status`, {
      // TODO: yaha pe agar token chahiye ho to header add karna
      headers: { Authorization: `Bearer ${token}` },
      // credentials: "include",
    });
    const data = await res.json();
    setStages(data);
  };

  // Employees
  const fetchEmployees = async () => {
    const res = await fetch(`${MAIN}/employee/all`, {
      // TODO: yaha pe agar token chahiye ho to header add karna
      headers: { Authorization: `Bearer ${token}` },
      // credentials: "include",
    });
    const data = await res.json();
    setEmployees(data);
  };

  // Milestones (depends on project)
  const fetchMilestones = async (pid: string) => {
    if (!pid) return;
    const res = await fetch(`${MAIN}/api/projects/${pid}/milestones`, {
      // TODO: yaha pe agar token chahiye ho to header add karna
      headers: { Authorization: `Bearer ${token}` },
      // credentials: "include",
    });
    const data = await res.json();
    setMilestones(data);
  };

  // Labels (depends on project)
  const fetchLabels = async (pid: string) => {
    if (!pid) return;
    const res = await fetch(`${MAIN}/projects/${pid}/labels`, {
      // TODO: yaha pe agar token chahiye ho to header add karna
      headers: { Authorization: `Bearer ${token}` },
      // credentials: "include",
    });
    const data = await res.json();
    setLabels(data);
  };


// ✅ ADD HERE
const fetchProjectTasks = async (pid: string) => {
  if (!pid) return;

  const res = await fetch(`${MAIN}/projects/${pid}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  setProjectTasks(data);
};


  // Initial load
  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchProjects();
      fetchStages();
      // fetchEmployees();
    }
  }, [open]);

  // Project change → milestones + labels reload
  useEffect(() => {
    if (projectId) {
      fetchMilestones(projectId);
      fetchLabels(projectId);
          fetchProjectTasks(projectId); // ✅ added

    }
  }, [projectId]);



const projectAssignedEmployees = React.useMemo(() => {
  if (!projectTasks.length) return [];

  const unique = new Map();

  projectTasks.forEach((task) => {
    task.assignedEmployees?.forEach((emp: any) => {
      if (!unique.has(emp.employeeId)) {
        unique.set(emp.employeeId, emp);
      }
    });
  });

  return Array.from(unique.values());
}, [projectTasks]);


  // Multi-select toggle
  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  // ---------------- SUBMIT ----------------
  const handleSave = async () => {
    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("title", title);
      fd.append("category", category); // ID
      fd.append("projectId", projectId); // ID
      fd.append("startDate", startDate);
      fd.append("dueDate", dueDate);
      fd.append("taskStageId", taskStageId); // ID
      fd.append("description", description);
      fd.append("priority", priority);
      fd.append("isPrivate", String(isPrivate));
      fd.append("timeEstimate", String(timeEstimate));
      fd.append("timeEstimateMinutes", timeEstimateMinutes);
      fd.append("isDependent", String(isDependent));
      fd.append("milestoneId", milestoneId); // REQUIRED

      // Arrays
      // assignedEmployeeIds.forEach((id) => fd.append("assignedEmployeeIds", id));
      assignedEmployeeIds.forEach((id) =>
  fd.append("assignedEmployeeIds[]", id)
);

      labelIds.forEach((id) => fd.append("labelIds", id));

      if (file) fd.append("taskFile", file);

      // const res = await fetch(`${MAIN}/projects/tasks`, {
      //   method: "POST",
      //   body: fd,
      //   // TODO: yaha pe agar token chahiye ho to header add karna
      //   headers: { Authorization: `Bearer ${token}` },
      //   // credentials: "include",
      // });


const res = await fetch(`${MAIN}/projects/tasks`, {
  method: "POST",
  body: fd,
  headers: { Authorization: `Bearer ${token}` },
});

const result = await res.json();

if (!res.ok) {
  console.log("API ERROR:", result);
  alert(result.message || "Failed to create task");
  return;
}

      if (!res.ok) throw new Error("Failed");

      onCreated();
      onOpenChange(false);
    } catch (e) {
      alert("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    // <Dialog open={open} onOpenChange={onOpenChange}>
    //   <DialogContent 
    //   className="max-h-[95vh] w-[900px] overflow-y-auto rounded-xl"
    //  >


<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent
     side="right"
     className="
      w-[83%]
     sm:max-w-[83%]
     max-w-[83%]
       h-screen
       overflow-y-auto
       p-0
     "
   >


        {/* <DialogHeader>
          <DialogTitle>Add New Task </DialogTitle>
        </DialogHeader> */}

<SheetHeader className="px-6 py-4 border-b bg-white">
  <SheetTitle className="text-lg font-semibold">
    Add New Task
  </SheetTitle>
</SheetHeader>


        {/* FORM */}
        {/* <div className="grid gap-5"> */}

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Title */}
          {/* <div> */}
          <div className="lg:col-span-2">
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
                {projects?.map((p) => (
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
         <div className="lg:col-span-2">
          {/* <div> */}
            <Label>Assign To *</Label>{" "}
            <span className="text-sm text-gray-300">
              choose only project Assign members
            </span>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {/* {employees.map((emp) => (
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
              ))} */}




{projectAssignedEmployees.length > 0 ? (
  projectAssignedEmployees.map((emp) => (
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
  ))
) : (
  <p className="text-sm text-muted-foreground">
    Select project to see assigned employees
  </p>
)}


            </div>
          </div>

          {/* Labels */}
        <div className="lg:col-span-2">
          {/* <div> */}
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
          <div className="lg:col-span-2">
          {/* <div> */}
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
          {/* <div> */}
          <div className="lg:col-span-2">
            <Label>Attachment *</Label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {/* FOOTER */}
        {/* <div className="flex justify-end gap-3 pt-4"> */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
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
      {/* </DialogContent>
    </Dialog> */}
    </SheetContent>
    </Sheet>
  );
};






















