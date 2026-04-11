"use client";

import { create } from "zustand";

type Updater<T> = T | ((previous: T) => T);

const resolveUpdater = <T>(previous: T, next: Updater<T>) =>
  typeof next === "function" ? (next as (previous: T) => T)(previous) : next;

export type TaskSource = "all" | "me" | "approval" | "pinned";
export type TaskViewMode = "list" | "kanban" | "calendar";
export type TaskStageFilter = "All" | string;

export interface DateRangeFilter {
  start?: string | null;
  end?: string | null;
}

export interface AdvancedTaskFilters {
  projectId: string;
  clientId: string;
  assignedTo: string;
  priority: string;
}

type TasksPageStore = {
  statusFilter: TaskStageFilter;
  dateRange: DateRangeFilter;
  openFilters: boolean;
  searchTerm: string;
  advancedFilters: AdvancedTaskFilters;
  taskSource: TaskSource;
  viewMode: TaskViewMode;
  showAddTaskModal: boolean;
  showCalendarModal: boolean;
  showStagesModal: boolean;
  viewTaskId: number | null;
  showViewModal: boolean;
  duplicateOpen: boolean;
  duplicateTaskId: number | null;
  editOpen: boolean;
  editTaskId: number | null;
  pinnedTaskIds: number[];
  setStatusFilter: (value: Updater<TaskStageFilter>) => void;
  setDateRange: (value: Updater<DateRangeFilter>) => void;
  setOpenFilters: (value: Updater<boolean>) => void;
  setSearchTerm: (value: Updater<string>) => void;
  setAdvancedFilters: (value: Updater<AdvancedTaskFilters>) => void;
  setTaskSource: (value: Updater<TaskSource>) => void;
  setViewMode: (value: Updater<TaskViewMode>) => void;
  setShowAddTaskModal: (value: Updater<boolean>) => void;
  setShowCalendarModal: (value: Updater<boolean>) => void;
  setShowStagesModal: (value: Updater<boolean>) => void;
  setViewTaskId: (value: Updater<number | null>) => void;
  setShowViewModal: (value: Updater<boolean>) => void;
  setDuplicateOpen: (value: Updater<boolean>) => void;
  setDuplicateTaskId: (value: Updater<number | null>) => void;
  setEditOpen: (value: Updater<boolean>) => void;
  setEditTaskId: (value: Updater<number | null>) => void;
  setPinnedTaskIds: (value: Updater<number[]>) => void;
  resetAdvancedFilters: () => void;
};

const defaultAdvancedFilters: AdvancedTaskFilters = {
  projectId: "All",
  clientId: "All",
  assignedTo: "All",
  priority: "All",
};

export const useTasksPageStore = create<TasksPageStore>((set) => ({
  statusFilter: "All",
  dateRange: {},
  openFilters: false,
  searchTerm: "",
  advancedFilters: defaultAdvancedFilters,
  taskSource: "all",
  viewMode: "list",
  showAddTaskModal: false,
  showCalendarModal: false,
  showStagesModal: false,
  viewTaskId: null,
  showViewModal: false,
  duplicateOpen: false,
  duplicateTaskId: null,
  editOpen: false,
  editTaskId: null,
  pinnedTaskIds: [],
  setStatusFilter: (value) => set((state) => ({ statusFilter: resolveUpdater(state.statusFilter, value) })),
  setDateRange: (value) => set((state) => ({ dateRange: resolveUpdater(state.dateRange, value) })),
  setOpenFilters: (value) => set((state) => ({ openFilters: resolveUpdater(state.openFilters, value) })),
  setSearchTerm: (value) => set((state) => ({ searchTerm: resolveUpdater(state.searchTerm, value) })),
  setAdvancedFilters: (value) =>
    set((state) => ({ advancedFilters: resolveUpdater(state.advancedFilters, value) })),
  setTaskSource: (value) => set((state) => ({ taskSource: resolveUpdater(state.taskSource, value) })),
  setViewMode: (value) => set((state) => ({ viewMode: resolveUpdater(state.viewMode, value) })),
  setShowAddTaskModal: (value) =>
    set((state) => ({ showAddTaskModal: resolveUpdater(state.showAddTaskModal, value) })),
  setShowCalendarModal: (value) =>
    set((state) => ({ showCalendarModal: resolveUpdater(state.showCalendarModal, value) })),
  setShowStagesModal: (value) =>
    set((state) => ({ showStagesModal: resolveUpdater(state.showStagesModal, value) })),
  setViewTaskId: (value) => set((state) => ({ viewTaskId: resolveUpdater(state.viewTaskId, value) })),
  setShowViewModal: (value) =>
    set((state) => ({ showViewModal: resolveUpdater(state.showViewModal, value) })),
  setDuplicateOpen: (value) =>
    set((state) => ({ duplicateOpen: resolveUpdater(state.duplicateOpen, value) })),
  setDuplicateTaskId: (value) =>
    set((state) => ({ duplicateTaskId: resolveUpdater(state.duplicateTaskId, value) })),
  setEditOpen: (value) => set((state) => ({ editOpen: resolveUpdater(state.editOpen, value) })),
  setEditTaskId: (value) => set((state) => ({ editTaskId: resolveUpdater(state.editTaskId, value) })),
  setPinnedTaskIds: (value) =>
    set((state) => ({ pinnedTaskIds: resolveUpdater(state.pinnedTaskIds, value) })),
  resetAdvancedFilters: () => set({ advancedFilters: defaultAdvancedFilters }),
}));
