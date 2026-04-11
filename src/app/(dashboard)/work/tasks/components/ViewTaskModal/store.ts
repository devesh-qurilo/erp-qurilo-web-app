"use client";

import { create } from "zustand";

type Updater<T> = T | ((previous: T) => T);

const resolveUpdater = <T>(previous: T, next: Updater<T>) =>
  typeof next === "function" ? (next as (previous: T) => T)(previous) : next;

export type ViewTaskModalTab = "files" | "subtasks" | "timesheet" | "notes";

type ViewTaskModalStore = {
  activeTab: ViewTaskModalTab;
  setActiveTab: (value: Updater<ViewTaskModalTab>) => void;
  reset: () => void;
};

export const useViewTaskModalStore = create<ViewTaskModalStore>((set) => ({
  activeTab: "files",
  setActiveTab: (value) =>
    set((state) => ({ activeTab: resolveUpdater(state.activeTab, value) })),
  reset: () => set({ activeTab: "files" }),
}));
