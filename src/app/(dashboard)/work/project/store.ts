"use client";

import { create } from "zustand";

export type ProjectViewMode = "grid" | "list" | "calendar";

type Updater<T> = T | ((previous: T) => T);

const resolveUpdater = <T>(previous: T, next: Updater<T>) =>
  typeof next === "function" ? (next as (previous: T) => T)(previous) : next;

type ProjectPageStore = {
  searchInput: string;
  searchQuery: string;
  statusFilter: string;
  progressFilter: string;
  durationFrom: string | null;
  durationTo: string | null;
  showFilters: boolean;
  filterProject: string;
  filterMember: string;
  filterClient: string;
  currentPage: number;
  totalPages: number;
  showAddModal: boolean;
  showCategoryModal: boolean;
  showUpdateModal: boolean;
  updateProjectId: number | null;
  viewMode: ProjectViewMode;
  showArchivedOnly: boolean;
  showPinnedOnly: boolean;
  calendarOpen: boolean;
  setSearchInput: (value: Updater<string>) => void;
  setSearchQuery: (value: Updater<string>) => void;
  setStatusFilter: (value: Updater<string>) => void;
  setProgressFilter: (value: Updater<string>) => void;
  setDurationFrom: (value: Updater<string | null>) => void;
  setDurationTo: (value: Updater<string | null>) => void;
  setShowFilters: (value: Updater<boolean>) => void;
  setFilterProject: (value: Updater<string>) => void;
  setFilterMember: (value: Updater<string>) => void;
  setFilterClient: (value: Updater<string>) => void;
  setCurrentPage: (value: Updater<number>) => void;
  setTotalPages: (value: Updater<number>) => void;
  setShowAddModal: (value: Updater<boolean>) => void;
  setShowCategoryModal: (value: Updater<boolean>) => void;
  setShowUpdateModal: (value: Updater<boolean>) => void;
  setUpdateProjectId: (value: Updater<number | null>) => void;
  setViewMode: (value: Updater<ProjectViewMode>) => void;
  setShowArchivedOnly: (value: Updater<boolean>) => void;
  setShowPinnedOnly: (value: Updater<boolean>) => void;
  setCalendarOpen: (value: Updater<boolean>) => void;
};

export const useProjectPageStore = create<ProjectPageStore>((set) => ({
  searchInput: "",
  searchQuery: "",
  statusFilter: "all",
  progressFilter: "all",
  durationFrom: null,
  durationTo: null,
  showFilters: false,
  filterProject: "all",
  filterMember: "all",
  filterClient: "all",
  currentPage: 1,
  totalPages: 1,
  showAddModal: false,
  showCategoryModal: false,
  showUpdateModal: false,
  updateProjectId: null,
  viewMode: "grid",
  showArchivedOnly: false,
  showPinnedOnly: false,
  calendarOpen: false,
  setSearchInput: (value) => set((state) => ({ searchInput: resolveUpdater(state.searchInput, value) })),
  setSearchQuery: (value) => set((state) => ({ searchQuery: resolveUpdater(state.searchQuery, value) })),
  setStatusFilter: (value) => set((state) => ({ statusFilter: resolveUpdater(state.statusFilter, value) })),
  setProgressFilter: (value) => set((state) => ({ progressFilter: resolveUpdater(state.progressFilter, value) })),
  setDurationFrom: (value) => set((state) => ({ durationFrom: resolveUpdater(state.durationFrom, value) })),
  setDurationTo: (value) => set((state) => ({ durationTo: resolveUpdater(state.durationTo, value) })),
  setShowFilters: (value) => set((state) => ({ showFilters: resolveUpdater(state.showFilters, value) })),
  setFilterProject: (value) => set((state) => ({ filterProject: resolveUpdater(state.filterProject, value) })),
  setFilterMember: (value) => set((state) => ({ filterMember: resolveUpdater(state.filterMember, value) })),
  setFilterClient: (value) => set((state) => ({ filterClient: resolveUpdater(state.filterClient, value) })),
  setCurrentPage: (value) => set((state) => ({ currentPage: resolveUpdater(state.currentPage, value) })),
  setTotalPages: (value) => set((state) => ({ totalPages: resolveUpdater(state.totalPages, value) })),
  setShowAddModal: (value) => set((state) => ({ showAddModal: resolveUpdater(state.showAddModal, value) })),
  setShowCategoryModal: (value) =>
    set((state) => ({ showCategoryModal: resolveUpdater(state.showCategoryModal, value) })),
  setShowUpdateModal: (value) =>
    set((state) => ({ showUpdateModal: resolveUpdater(state.showUpdateModal, value) })),
  setUpdateProjectId: (value) =>
    set((state) => ({ updateProjectId: resolveUpdater(state.updateProjectId, value) })),
  setViewMode: (value) => set((state) => ({ viewMode: resolveUpdater(state.viewMode, value) })),
  setShowArchivedOnly: (value) =>
    set((state) => ({ showArchivedOnly: resolveUpdater(state.showArchivedOnly, value) })),
  setShowPinnedOnly: (value) =>
    set((state) => ({ showPinnedOnly: resolveUpdater(state.showPinnedOnly, value) })),
  setCalendarOpen: (value) => set((state) => ({ calendarOpen: resolveUpdater(state.calendarOpen, value) })),
}));
