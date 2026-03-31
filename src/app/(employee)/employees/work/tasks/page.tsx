"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// TODO: ye components hum alag files me banayenge
import { FiltersBar } from "./components/FiltersBar";
import { ActionsBar } from "./components/ActionsBar";
import { TaskTable } from "./components/TaskTable";
import { CalendarModal } from "./components/CalendarModal";
import { AddTaskModal } from "./components/AddTaskModal";
import { KanbanBoard } from "./components/KanbanBoard";
import { StagesModal } from "./components/StagesModal";
import ViewTaskModal from "./components/ViewTaskModal/ViewTaskModal";
import EditTaskDrawer from "./components/EditTaskDrawer";
import { DuplicateTaskModal } from "./components/DuplicateTaskModal";
import { TaskFiltersDrawer } from "./components/TaskFiltersDrawer";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


/**
 * ---- Shared Types (baaki components inko import karke use kar sakte hain) ----
 */

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | string;

export type TaskStageName =
  | "Waiting"
  | "Doing"
  | "Completed"
  | "Approval"
  | string;

export interface TaskStage {
  id: number;
  name: TaskStageName;
  labelColor?: string | null;
}

export interface AssignedEmployee {
  employeeId: string;
  name: string;
  profileUrl?: string | null;
  designation?: string | null;
  department?: string | null;
}

export interface TaskLabel {
  id: number;
  name: string;
  colorCode?: string | null;
}

export interface Task {
  id: number;
  title: string;
  projectId?: number;
  projectShortCode?: string;
  projectName?: string;
  categoryId?: {
    id: number;
    name: string;
  } | null;
  startDate?: string | null; // "2025-11-15"
  dueDate?: string | null; // "2026-11-29"
  noDueDate?: boolean;
  completedOn?: string | null;
  taskStageId?: number;
  taskStage?: TaskStage | null;
  assignedEmployeeIds?: string[];
  assignedEmployees?: AssignedEmployee[] | null;
  description?: string | null;
  labels?: TaskLabel[] | null;
  priority?: TaskPriority;
  isPrivate?: boolean;
  timeEstimate?: boolean;
  timeEstimateMinutes?: number | null;
  pinned?: boolean;
  hoursLoggedMinutes?: number;
  hoursLogged?: number;
}

export type TaskViewMode = "list" | "kanban" | "calendar";
export type TaskSource = "all" | "me" | "approval" | "pinned";

interface DateRangeFilter {
  start?: string | null; // ISO string (yyyy-mm-dd)
  end?: string | null;
}

const MAIN_API = process.env.NEXT_PUBLIC_MAIN;
const GATEWAY_API = process.env.NEXT_PUBLIC_MAIN;

/**
 * Main Tasks Page
 */
const TasksPage: React.FC = () => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);


const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

const [taskFilters, setTaskFilters] = useState({
  projectId: "All",
  clientId: "All",
  assignedTo: "All",
  priority: "All",
});


const projectOptions = useMemo(() => {
  const map = new Map<string, string>();
  allTasks.forEach((t) => {
    if (t.projectId && t.projectName) {
      map.set(String(t.projectId), t.projectName);
    }
  });
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
}, [allTasks]);

  const clientOptions = useMemo(() => {
    const map = new Map<string, string>();
    allTasks.forEach((t) => {
      if (t.categoryId?.id && t.categoryId?.name) {
        map.set(String(t.categoryId.id), t.categoryId.name);
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [allTasks]);


const employeeOptions = useMemo(() => {
  const map = new Map<string, string>();
  allTasks.forEach((t) => {
    t.assignedEmployees?.forEach((e) => {
      map.set(e.employeeId, e.name);
    });
  });
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
}, [allTasks]);

const priorityOptions = ["LOW", "MEDIUM", "HIGH"];






  // top filters (section 1)
  const [statusFilter, setStatusFilter] = useState<TaskStageName | "All">(
    "All"
  );
  const [dateRange, setDateRange] = useState<DateRangeFilter>({});

  // action bar state (section 2)
  const [taskSource, setTaskSource] = useState<TaskSource>("all"); // All Tasks / My Tasks / Approval / Pin
  const [viewMode, setViewMode] = useState<TaskViewMode>("list"); // List / Kanban / Calendar

  // modals
  const [showAddTaskModal, setShowAddTaskModal] = useState<boolean>(false);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);

  const [showStagesModal, setShowStagesModal] = useState(false);

  const [viewTaskId, setViewTaskId] = useState<number | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateTask, setDuplicateTask] = useState<Task | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);

  const handleViewTask = (task: Task) => {
    setViewTaskId(task.id);
    setShowViewModal(true);
  };

  const handleDuplicateTask = (task: Task) => {
    setDuplicateTask(task);
    setDuplicateOpen(true);
  };

  // --------- API Calls ---------

  // Get All Tasks
  const fetchAllTasks = async () => {
    if (!MAIN_API) {
      console.error("NEXT_PUBLIC_MAIN is not defined");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("accessToken")
          : null;

      const res = await fetch(`${MAIN_API}/me/tasks`, {
        // TODO: yaha pe agar token chahiye ho to header add karna
        headers: { Authorization: `Bearer ${token}` },
        // credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch all tasks");
      }

      const data: Task[] = await res.json();
      setAllTasks(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch all tasks");
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  };

  // Get My Tasks
  const fetchMyTasks = async () => {
    if (!GATEWAY_API) {
      console.error("NEXT_PUBLIC_GATEWAY (or MAIN) is not defined");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${GATEWAY_API}/me/tasks`, {
        // TODO: yaha pe agar token chahiye ho to header add karna
        headers: { Authorization: `Bearer ${token}` },
        // credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch my tasks");
      }

      const data: Task[] = await res.json();
      setMyTasks(data);
    } catch (err) {
      console.error(err);
      // my tasks fail ho to bhi page chal sakta hai, isliye yaha hard error nahi dikha raha
    }
  };

  // initial load
  useEffect(() => {
    fetchAllTasks();
    fetchMyTasks();
  }, []);

  // --------- Derived Tasks based on Source + Filters ---------

  const sourceTasks: Task[] = useMemo(() => {
    let base: Task[] = [];

    switch (taskSource) {
      case "all":
        base = allTasks;
        break;
      case "me":
        base = myTasks.length ? myTasks : allTasks; // agar meTasks na mile to fallback
        break;
      case "approval":
        base = allTasks.filter((t) => t.taskStage?.name === "Waiting");
        break;
      case "pinned":
        base = allTasks.filter((t) => t.pinned);
        break;
      default:
        base = allTasks;
    }

    // status filter
    if (statusFilter !== "All") {
      base = base.filter((t) => t.taskStage?.name === statusFilter);
    }

    // date range filter (Duration: startDate to endDate)
    if (dateRange.start || dateRange.end) {
      base = base.filter((t) => {
        const start = t.startDate ? new Date(t.startDate) : null;
        const end = t.dueDate ? new Date(t.dueDate) : null;

        if (!start && !end) return false;

        const filterStart = dateRange.start ? new Date(dateRange.start) : null;
        const filterEnd = dateRange.end ? new Date(dateRange.end) : null;

        // basic overlap check
        if (filterStart && end && end < filterStart) return false;
        if (filterEnd && start && start > filterEnd) return false;

        return true;
      });
    }




// 🔥 DRAWER FILTERS (table-accurate)

// if (taskFilters.projectId !== "All") {
//   base = base.filter(
//     (t) => String(t.projectId) === taskFilters.projectId
//   );
// }

// if (taskFilters.clientId !== "All") {
//   base = base.filter(
//     (t: any) => String(t.clientId) === taskFilters.clientId
//   );
// }



// if (taskFilters.assignedTo !== "All") {
//   base = base.filter((t) =>
//     t.assignedEmployees?.some(
//       (e) => e.employeeId === taskFilters.assignedTo
//     )
//   );
// }

// if (taskFilters.priority !== "All") {
//   base = base.filter((t) => t.priority === taskFilters.priority);
// }



// 🔥 DRAWER FILTERS (FINAL & CORRECT)

if (taskFilters.projectId !== "All") {
  base = base.filter(
    (t) => String(t.projectId) === taskFilters.projectId
  );
}

if (taskFilters.clientId !== "All") {
  base = base.filter(
    (t) => String(t.categoryId?.id) === taskFilters.clientId
  );
}

if (taskFilters.assignedTo !== "All") {
  base = base.filter((t) =>
    t.assignedEmployees?.some(
      (e) => e.employeeId === taskFilters.assignedTo
    )
  );
}

if (taskFilters.priority !== "All") {
  base = base.filter((t) => t.priority === taskFilters.priority);
}







    return base;
  }, [allTasks, myTasks, taskSource, statusFilter, dateRange, taskFilters,]);




  // --------- Handlers passed to child components ---------

  const handleAddTaskSuccess = () => {
    // jab AddTaskModal se task successfully create ho jaye:
    fetchAllTasks();
    fetchMyTasks();
  };

  const handleOpenCalendar = () => {
    setShowCalendarModal(true);
    setViewMode("calendar"); // UX: calendar button press par viewMode bhi change
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const token = localStorage.getItem("accessToken");

    const res = await fetch(`${MAIN_API}/api/projects/tasks/${taskId}/delete`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      fetchAllTasks();
      fetchMyTasks();
    } else {
      alert("Failed to delete");
    }
  };

  // const handlePinToggle = async (taskId: number) => {
  //   const token = localStorage.getItem("accessToken");

  //   const res = await fetch(`${MAIN_API}/projects/tasks/${taskId}/pin`, {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${token}` },
  //   });

  //   if (res.ok) {
  //     fetchAllTasks();
  //     fetchMyTasks();
  //   } else {
  //     alert("Unable to toggle pin");
  //   }
  // };



const handlePinToggle = async (task: Task) => {
  const token = localStorage.getItem("accessToken");

  const method = task.pinned ? "DELETE" : "POST";

  const res = await fetch(`${MAIN_API}/projects/tasks/${task.id}/pin`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.ok) {
    fetchAllTasks();
    fetchMyTasks();
  } else {
    alert("Unable to toggle pin");
  }
};



  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <div className="flex min-h-screen flex-col bg-slate-50">
        {/* Top header */}
        <header className="flex items-center justify-between px-8 py-6">
          <h1 className="text-2xl font-semibold text-slate-900">My Task </h1>

          {/* yaha future me notification icon, profile avatar etc aa sakta hai */}
          <div className="flex items-center gap-4 text-sm text-slate-500">
            {/* Placeholder for bell & profile */}
            <div className="hidden text-xs md:block">
              {/* Top right content optional */}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 space-y-4 px-4 pb-6 md:px-8">
          {/* -------- Section 1: Filters -------- */}
          <Card className="border-none bg-white shadow-sm">
            <div className="p-4">
              <FiltersBar
                status={statusFilter}
                onStatusChange={setStatusFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onOpenFilters={() => setFiltersDrawerOpen(true)} // 👈 ADD THIS

              />
            </div>
          </Card>

          {/* -------- Section 2: Action Buttons -------- */}
          <Card className="border-none bg-white shadow-sm">
            <div className="p-4">
              <ActionsBar
                taskSource={taskSource}
                onTaskSourceChange={setTaskSource}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onAddTask={() => setShowAddTaskModal(true)}
                onOpenCalendar={handleOpenCalendar}
                onOpenStages={() => setShowStagesModal(true)}
                // ye special actions automatically filters se handle ho rahe hain:
                // - Approval -> taskSource = "approval"
                // - Pin -> taskSource = "pinned"
              />
            </div>
          </Card>

          {/* -------- Section 3: Render Area (Table / Kanban / etc.) -------- */}
          <Card className="border-none bg-white shadow-sm">
            <div className="p-0">
              {loading && !initialLoaded ? (
                // <div className="flex h-64 items-center justify-center">
                //   <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                // </div>



<div className="p-4">
  <table className="w-full">
    <thead>
      <tr>
        {Array.from({ length: 6 }).map((_, i) => (
          <th key={i} className="p-3 text-left">
            <Skeleton height={16} width={100} />
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-t">
          <td className="p-3">
            <Skeleton width={120} />
          </td>

          <td className="p-3">
            <Skeleton width={100} />
          </td>

          <td className="p-3 flex gap-2">
            <Skeleton circle width={28} height={28} />
            <Skeleton circle width={28} height={28} />
          </td>

          <td className="p-3">
            <Skeleton width={80} />
          </td>

          <td className="p-3">
            <Skeleton width={90} />
          </td>

          <td className="p-3 text-right">
            <Skeleton width={30} height={30} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>




              ) : error ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-red-500">
                  <p>{error}</p>
                  <button
                    onClick={fetchAllTasks}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Retry
                  </button>
                </div>
              ) : sourceTasks.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-slate-500">
                  <p>No tasks found for selected filters.</p>
                </div>
              ) : viewMode === "list" ? (
                // <TaskTable
                //     tasks={sourceTasks}
                //     onView={handleViewTask}
                // />
                <TaskTable
                  tasks={sourceTasks}
                  onView={handleViewTask}
                  onEdit={(task) => {
                    setEditTaskId(task.id);
                    setEditOpen(true);
                  }}
                  onDelete={(task) => handleDeleteTask(task.id)}
                  onDuplicate={handleDuplicateTask}
                  // onTogglePin={(task) => handlePinToggle(task.id)}
                  onTogglePin={handlePinToggle}
                />
              ) : viewMode === "kanban" ? (
                <KanbanBoard tasks={sourceTasks} />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                  Calendar data is available in the calendar modal.
                </div>
              )}
            </div>
          </Card>
        </main>

        {/* -------- Modals (kept outside Cards) -------- */}
        <AddTaskModal
          open={showAddTaskModal}
          onOpenChange={setShowAddTaskModal}
          onCreated={handleAddTaskSuccess}
        />

        <CalendarModal
          open={showCalendarModal}
          onOpenChange={setShowCalendarModal}
          tasks={sourceTasks}
        />
        <StagesModal open={showStagesModal} onOpenChange={setShowStagesModal} />

        <ViewTaskModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          taskId={viewTaskId}
        />
        <EditTaskDrawer
          open={editOpen}
          onOpenChange={setEditOpen}
          taskId={editTaskId}
          onUpdated={() => {
            fetchAllTasks();
            fetchMyTasks();
          }}
        />

        {duplicateTask && (
          <DuplicateTaskModal
            open={duplicateOpen}
            onOpenChange={setDuplicateOpen}
            task={duplicateTask}
            onCreated={() => {
              setDuplicateOpen(false);
              setDuplicateTask(null);
              fetchAllTasks();
              fetchMyTasks();
            }}
          />
        )} 




<TaskFiltersDrawer
  open={filtersDrawerOpen}
  onClose={() => setFiltersDrawerOpen(false)}
  filters={taskFilters}
  onChange={setTaskFilters}
  onClear={() =>
    setTaskFilters({
      projectId: "All",
      clientId: "All",
      assignedTo: "All",
      priority: "All",
    })
  }
  projects={projectOptions}
  clients={clientOptions}
  employees={employeeOptions}
  priorities={priorityOptions}
/>




      </div>
    </main>
  );
};

export default TasksPage;
