"use client";

import { create } from "zustand";

export type ProjectDetailTabKey =
  | "overview"
  | "invoices"
  | "payments"
  | "files"
  | "notes"
  | "activity"
  | "discussion";

type Updater<T> = T | ((previous: T) => T);

const resolveUpdater = <T>(previous: T, next: Updater<T>) =>
  typeof next === "function" ? (next as (previous: T) => T)(previous) : next;

type ProjectDetailStore = {
  project: any;
  metrics: any;
  loading: boolean;
  activeTab: ProjectDetailTabKey;
  setProject: (value: Updater<any>) => void;
  setMetrics: (value: Updater<any>) => void;
  setLoading: (value: Updater<boolean>) => void;
  setActiveTab: (value: Updater<ProjectDetailTabKey>) => void;
  resetProjectDetailState: () => void;
};

const initialState = {
  project: null,
  metrics: null,
  loading: true,
  activeTab: "overview" as ProjectDetailTabKey,
};

export const useProjectDetailStore = create<ProjectDetailStore>((set) => ({
  ...initialState,
  setProject: (value) => set((state) => ({ project: resolveUpdater(state.project, value) })),
  setMetrics: (value) => set((state) => ({ metrics: resolveUpdater(state.metrics, value) })),
  setLoading: (value) => set((state) => ({ loading: resolveUpdater(state.loading, value) })),
  setActiveTab: (value) => set((state) => ({ activeTab: resolveUpdater(state.activeTab, value) })),
  resetProjectDetailState: () => set(initialState),
}));
