"use client";

import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { useShallow } from "zustand/react/shallow";

// TODO: ye components hum alag files me banayenge
import { FiltersBar } from "./components/FiltersBar";
import { ActionsBar } from "./components/ActionsBar";
import { TaskTable } from "./components/TaskTable";
import { CalendarModal } from "./components/CalendarModal";
import { AddTaskModal } from "./components/AddTaskModal";
// import AddTaskModal from "./components/AddTaskModal";

import { KanbanBoard } from "./components/KanbanBoard";
import { StagesModal } from "./components/StagesModal";
import ViewTaskModal from "./components/ViewTaskModal/ViewTaskModal";
import EditTaskDrawer from "./components/EditTaskDrawer";
import { DuplicateTaskModal } from "./components/DuplicateTaskModal";
import { TaskFiltersDrawer } from "./components/TaskFiltersDrawer";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  approveProjectTask,
  deleteProjectTask,
  fetchAllProjectTasks,
  fetchMyProjectTasks,
  getStoredAccessToken,
  readPinnedTaskIds,
  writePinnedTaskIds,
} from "./api";
import { useTasksPageStore } from "./store";


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

/**
 * Main Tasks Page
 */
const TasksPage: React.FC = () => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const {
    statusFilter,
    setStatusFilter,
    dateRange,
    setDateRange,
    openFilters,
    setOpenFilters,
    searchTerm,
    setSearchTerm,
    advancedFilters,
    setAdvancedFilters,
    resetAdvancedFilters,
    taskSource,
    setTaskSource,
    viewMode,
    setViewMode,
    showAddTaskModal,
    setShowAddTaskModal,
    showCalendarModal,
    setShowCalendarModal,
    showStagesModal,
    setShowStagesModal,
    viewTaskId,
    setViewTaskId,
    showViewModal,
    setShowViewModal,
    duplicateOpen,
    setDuplicateOpen,
    duplicateTaskId,
    setDuplicateTaskId,
    editOpen,
    setEditOpen,
    editTaskId,
    setEditTaskId,
    pinnedTaskIds,
    setPinnedTaskIds,
  } = useTasksPageStore(
    useShallow((state) => ({
      statusFilter: state.statusFilter,
      setStatusFilter: state.setStatusFilter,
      dateRange: state.dateRange,
      setDateRange: state.setDateRange,
      openFilters: state.openFilters,
      setOpenFilters: state.setOpenFilters,
      searchTerm: state.searchTerm,
      setSearchTerm: state.setSearchTerm,
      advancedFilters: state.advancedFilters,
      setAdvancedFilters: state.setAdvancedFilters,
      resetAdvancedFilters: state.resetAdvancedFilters,
      taskSource: state.taskSource,
      setTaskSource: state.setTaskSource,
      viewMode: state.viewMode,
      setViewMode: state.setViewMode,
      showAddTaskModal: state.showAddTaskModal,
      setShowAddTaskModal: state.setShowAddTaskModal,
      showCalendarModal: state.showCalendarModal,
      setShowCalendarModal: state.setShowCalendarModal,
      showStagesModal: state.showStagesModal,
      setShowStagesModal: state.setShowStagesModal,
      viewTaskId: state.viewTaskId,
      setViewTaskId: state.setViewTaskId,
      showViewModal: state.showViewModal,
      setShowViewModal: state.setShowViewModal,
      duplicateOpen: state.duplicateOpen,
      setDuplicateOpen: state.setDuplicateOpen,
      duplicateTaskId: state.duplicateTaskId,
      setDuplicateTaskId: state.setDuplicateTaskId,
      editOpen: state.editOpen,
      setEditOpen: state.setEditOpen,
      editTaskId: state.editTaskId,
      setEditTaskId: state.setEditTaskId,
      pinnedTaskIds: state.pinnedTaskIds,
      setPinnedTaskIds: state.setPinnedTaskIds,
    })),
  );
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const handleViewTask = (task: Task) => {
    setViewTaskId(task.id);
    setShowViewModal(true);
  };

  const handleDuplicateTask = (task: Task) => {
    setDuplicateTaskId(task.id);
    setDuplicateOpen(true);
  };

  const hydratePinnedTasks = useCallback(() => {
    setPinnedTaskIds(readPinnedTaskIds());
  }, [setPinnedTaskIds]);

  const decoratePinnedTasks = useCallback(
    (tasks: Task[]) =>
      tasks.map((task) => ({
        ...task,
        pinned: pinnedTaskIds.includes(task.id),
      })),
    [pinnedTaskIds],
  );

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getStoredAccessToken();
      if (!token) {
        setAllTasks([]);
        setMyTasks([]);
        setError("Not authenticated");
        return;
      }

      const [allResult, myResult] = await Promise.allSettled([
        fetchAllProjectTasks<Task>(token),
        fetchMyProjectTasks<Task>(token),
      ]);

      const allSucceeded = allResult.status === "fulfilled";
      const mySucceeded = myResult.status === "fulfilled";

      if (allSucceeded) {
        setAllTasks(Array.isArray(allResult.value) ? allResult.value : []);
      } else {
        console.error(allResult.reason);
        setAllTasks([]);
      }

      if (mySucceeded) {
        setMyTasks(Array.isArray(myResult.value) ? myResult.value : []);
      } else {
        console.error(myResult.reason);
        setMyTasks([]);
      }

      if (!allSucceeded && mySucceeded) {
        setTaskSource("me");
        setError(null);
      } else if (!allSucceeded && !mySucceeded) {
        setError(
          (allResult.reason as Error)?.message ||
            (myResult.reason as Error)?.message ||
            "Failed to fetch tasks",
        );
      }
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [setTaskSource]);

  useEffect(() => {
    hydratePinnedTasks();
    loadTasks();
  }, [hydratePinnedTasks, loadTasks]);

  const displayAllTasks = useMemo(() => decoratePinnedTasks(allTasks), [allTasks, decoratePinnedTasks]);
  const displayMyTasks = useMemo(() => decoratePinnedTasks(myTasks), [myTasks, decoratePinnedTasks]);


  // ---------------- Filter Dropdown Options ----------------

  const projectOptions = useMemo(() => {
    const map = new Map<string, string>();
    displayAllTasks.forEach((t) => {
      if (t.projectId && t.projectName) {
        map.set(String(t.projectId), t.projectName);
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [displayAllTasks]);

  const clientOptions = useMemo(() => {
    const map = new Map<string, string>();
    displayAllTasks.forEach((t) => {
      if (t.categoryId?.id && t.categoryId?.name) {
        map.set(String(t.categoryId.id), t.categoryId.name);
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [displayAllTasks]);

  const employeeOptions = useMemo(() => {
    const map = new Map<string, string>();
    displayAllTasks.forEach((t) => {
      t.assignedEmployees?.forEach((e) => {
        map.set(e.employeeId, e.name);
      });
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [displayAllTasks]);

  const priorityOptions = ["LOW", "MEDIUM", "HIGH"];

  const sourceTasks: Task[] = useMemo(() => {
    let base: Task[] = [];

    switch (taskSource) {
      case "all":
        base = displayAllTasks;
        break;
      case "me":
        base = displayMyTasks.length ? displayMyTasks : displayAllTasks;
        break;
      case "approval":
        base = displayAllTasks.filter((t) => t.taskStage?.name === "Waiting");
        break;
      case "pinned":
        base = displayAllTasks.filter((t) => t.pinned);
        break;
      default:
        base = displayAllTasks;
    }

    // status filter
    if (statusFilter !== "All") {
      base = base.filter((t) => t.taskStage?.name === statusFilter);
    }

    // date range filter
    if (dateRange.start || dateRange.end) {
      base = base.filter((t) => {
        const start = t.startDate ? new Date(t.startDate) : null;
        const end = t.dueDate ? new Date(t.dueDate) : null;

        if (!start && !end) return false;

        const filterStart = dateRange.start ? new Date(dateRange.start) : null;
        const filterEnd = dateRange.end ? new Date(dateRange.end) : null;

        if (filterStart && end && end < filterStart) return false;
        if (filterEnd && start && start > filterEnd) return false;

        return true;
      });
    }

    // 🔥 ADVANCED FILTERS — YAHI PASTE KARO
    base = base.filter((t) => {
      if (
        advancedFilters.projectId !== "All" &&
        String(t.projectId) !== advancedFilters.projectId
      ) return false;

      if (
        advancedFilters.clientId !== "All" &&
        String(t.categoryId?.id) !== advancedFilters.clientId
      ) return false;

      if (
        advancedFilters.assignedTo !== "All" &&
        !t.assignedEmployeeIds?.includes(advancedFilters.assignedTo)
      ) return false;

      if (
        advancedFilters.priority !== "All" &&
        t.priority !== advancedFilters.priority
      ) return false;

      return true;
    });


    // 🔍 SEARCH FILTER
    if (deferredSearchTerm.trim()) {
      const q = deferredSearchTerm.toLowerCase();

      base = base.filter((t) => {
        return (
          t.title?.toLowerCase().includes(q) ||
          t.projectName?.toLowerCase().includes(q) ||
          t.categoryId?.name?.toLowerCase().includes(q) ||
          t.assignedEmployees?.some((e) =>
            e.name?.toLowerCase().includes(q)
          )
        );
      });
    }



    return base;
  }, [
    displayAllTasks,
    displayMyTasks,
    taskSource,
    statusFilter,
    dateRange,
    advancedFilters, // ⚠️ IMPORTANT
    deferredSearchTerm,

  ]);

  const duplicateTask = useMemo(
    () => sourceTasks.find((task) => task.id === duplicateTaskId) ?? displayAllTasks.find((task) => task.id === duplicateTaskId) ?? null,
    [duplicateTaskId, displayAllTasks, sourceTasks],
  );





  // --------- Handlers passed to child components ---------

  const handleAddTaskSuccess = () => {
    loadTasks();
  };

  const handleOpenCalendar = () => {
    setShowCalendarModal(true);
    setViewMode("calendar"); // UX: calendar button press par viewMode bhi change
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    const token = getStoredAccessToken();
    if (!token) {
      alert("Not authenticated");
      return;
    }

    try {
      await deleteProjectTask(token, taskId);
      await loadTasks();
    } catch (err) {
      console.error(err);
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
  setPinnedTaskIds((previous) => {
    const next = previous.includes(task.id)
      ? previous.filter((id) => id !== task.id)
      : [...previous, task.id];

    writePinnedTaskIds(next);
    return next;
  });
};



  const handleApproveTask = async (taskId: number) => {
    const token = getStoredAccessToken();
    if (!token) {
      alert("Not authenticated");
      return;
    }

    try {
      await approveProjectTask(token, taskId);
      await loadTasks();
    } catch (err) {
      console.error(err);
      alert("Unable to approve task");
    }
  };

  return (
    <main className="container mx-auto max-w-6xl px-4 py-8">
      <div className="flex min-h-screen flex-col bg-slate-50">
        {/* Top header */}
        <header className="flex items-center justify-between px-8 py-6">
          {/* <h1 className="text-2xl font-semibold text-slate-900">My Task</h1> */}


{loading && !initialLoaded ? (
  <Skeleton width={120} height={24} />
) : (
  <h1 className="text-2xl font-semibold text-slate-900">My Task</h1>
)}


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

              {/* <FiltersBar
                status={statusFilter}
                onStatusChange={setStatusFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onOpenFilters={() => setOpenFilters(true)}   // ✅ IMPORTANT
              /> */}





{loading && !initialLoaded ? (
  <div className="flex gap-4">
    <Skeleton width={120} height={35} />
    <Skeleton width={150} height={35} />
    <Skeleton width={100} height={35} />
  </div>
) : (
  <FiltersBar
    status={statusFilter}
    onStatusChange={setStatusFilter}
    dateRange={dateRange}
    onDateRangeChange={setDateRange}
    onOpenFilters={() => setOpenFilters(true)}
  />
)}


            </div>
          </Card>

          {/* -------- Section 2: Action Buttons -------- */}
          <Card className="border-none bg-white shadow-sm">
            <div className="p-4">
              {/* <ActionsBar
                taskSource={taskSource}
                onTaskSourceChange={setTaskSource}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onAddTask={() => setShowAddTaskModal(true)}
                onOpenCalendar={handleOpenCalendar}
                onOpenStages={() => setShowStagesModal(true)}
                onSearchChange={setSearchTerm}   // ✅ IMPORTANT

             
              /> */}



{loading && !initialLoaded ? (
  <div className="flex justify-between">
    <Skeleton width={200} height={35} />
    <Skeleton width={150} height={35} />
  </div>
) : (
  <ActionsBar
    taskSource={taskSource}
    onTaskSourceChange={setTaskSource}
    viewMode={viewMode}
    onViewModeChange={setViewMode}
    onAddTask={() => setShowAddTaskModal(true)}
    onOpenCalendar={handleOpenCalendar}
    onOpenStages={() => setShowStagesModal(true)}
    onSearchChange={setSearchTerm}
  />
)}



            </div>
          </Card>

          {/* -------- Section 3: Render Area (Table / Kanban / etc.) -------- */}
          <Card className="border-none bg-white shadow-sm">
            <div className="p-0">
              {/* {loading && !initialLoaded ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : error ? ( */}
                
                

                {loading && !initialLoaded ? (
  <div className="p-4 space-y-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-between border rounded p-3"
      >
        <div className="flex items-center gap-3">
          <Skeleton circle width={35} height={35} />
          <div className="space-y-2">
            <Skeleton width={200} height={14} />
            <Skeleton width={120} height={10} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Skeleton width={60} height={12} />
          <Skeleton width={80} height={12} />
          <Skeleton width={30} height={20} />
        </div>
      </div>
    ))}
  </div>
) : error ? (
                
                
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-red-500">
                  <p>{error}</p>
                  <button
                    onClick={loadTasks}
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
                  onApprove={(task) => handleApproveTask(task.id)}
                  onTaskUpdated={loadTasks}

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
          onOpenChange={(open) => {
            setShowViewModal(open);
            if (!open) setViewTaskId(null);
          }}
          taskId={viewTaskId}
        />
        <EditTaskDrawer
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditTaskId(null);
          }}
          taskId={editTaskId}
          onUpdated={() => {
            loadTasks();
          }}
        />

        {duplicateTask && (
          <DuplicateTaskModal
            open={duplicateOpen}
            onOpenChange={(open) => {
              setDuplicateOpen(open);
              if (!open) setDuplicateTaskId(null);
            }}
            task={duplicateTask}
            onCreated={() => {
              setDuplicateOpen(false);
              setDuplicateTaskId(null);
              loadTasks();
            }}
          />
        )}

        <TaskFiltersDrawer
          open={openFilters}
          onClose={() => setOpenFilters(false)}
          filters={advancedFilters}
          onChange={setAdvancedFilters}
          onClear={resetAdvancedFilters}
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
