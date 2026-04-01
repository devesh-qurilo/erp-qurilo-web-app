"use client";

import { Button } from "@/components/ui/button";
import { Calendar, List } from "lucide-react";
import { createPortal } from "react-dom";
import { useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import HolidayCalendar from "./HolidayCalendar";
import {
  type DefaultWeeklyHolidayRequest,
  type Holiday,
  useCreateBulkHolidaysMutation,
  useCreateDefaultWeeklyHolidaysMutation,
  useCreateHolidayMutation,
  useDeleteHolidayMutation,
  useHolidayListQuery,
  useToggleHolidayStatusMutation,
  useUpcomingHolidaysQuery,
  useUpdateHolidayMutation,
} from "./api";

interface HolidayDraft {
  date: string;
  occasion: string;
}

type ViewMode = "list" | "calendar";
type ModalMode = "single" | "bulk" | "default-weekly";

const weekDayOptions = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const emptyHolidayDraft = (): HolidayDraft => ({ date: "", occasion: "" });

export default function HolidayPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | "">(new Date().getMonth() + 1);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("single");
  const [drafts, setDrafts] = useState<HolidayDraft[]>([emptyHolidayDraft()]);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [error, setError] = useState("");

  const [defaultWeekly, setDefaultWeekly] =
    useState<DefaultWeeklyHolidayRequest>({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      occasion: "Weekly Holiday",
      weekDays: ["SUNDAY"],
    });

  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const holidaysQuery = useHolidayListQuery();
  const upcomingQuery = useUpcomingHolidaysQuery();
  const createHolidayMutation = useCreateHolidayMutation();
  const createBulkMutation = useCreateBulkHolidaysMutation();
  const createDefaultWeeklyMutation = useCreateDefaultWeeklyHolidaysMutation();
  const updateHolidayMutation = useUpdateHolidayMutation();
  const deleteHolidayMutation = useDeleteHolidayMutation();
  const toggleHolidayStatusMutation = useToggleHolidayStatusMutation();

  const holidayData = holidaysQuery.data;
  const loading = holidaysQuery.isLoading;
  const saving =
    createHolidayMutation.isPending ||
    createBulkMutation.isPending ||
    createDefaultWeeklyMutation.isPending ||
    updateHolidayMutation.isPending ||
    deleteHolidayMutation.isPending ||
    toggleHolidayStatusMutation.isPending;

  const filteredHolidays = useMemo(() => {
    let list = holidayData ?? [];

    if (year || month) {
      list = list.filter((holiday) => {
        const [holidayYear, holidayMonth] = holiday.date.split("-").map(Number);
        if (year && holidayYear !== year) return false;
        if (month && holidayMonth !== month) return false;
        return true;
      });
    }

    if (search.trim()) {
      list = list.filter(
        (holiday) =>
          holiday.occasion.toLowerCase().includes(search.toLowerCase()) ||
          holiday.day.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return list;
  }, [holidayData, month, search, year]);

  const closeModal = () => {
    setModalOpen(false);
    setModalMode("single");
    setDrafts([emptyHolidayDraft()]);
    setEditingHoliday(null);
    setError("");
  };

  const openCreateModal = (mode: ModalMode) => {
    setModalMode(mode);
    setEditingHoliday(null);
    setDrafts(
      mode === "bulk"
        ? [emptyHolidayDraft(), emptyHolidayDraft()]
        : [emptyHolidayDraft()],
    );
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (holiday: Holiday) => {
    setModalMode("single");
    setEditingHoliday(holiday);
    setDrafts([{ date: holiday.date, occasion: holiday.occasion }]);
    setError("");
    setModalOpen(true);
  };

  const addDraftRow = () =>
    setDrafts((current) => [...current, emptyHolidayDraft()]);
  const removeDraftRow = (index: number) =>
    setDrafts((current) => current.filter((_, i) => i !== index));

  const updateDraft = (
    index: number,
    key: keyof HolidayDraft,
    value: string,
  ) => {
    setDrafts((current) =>
      current.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, [key]: value } : draft,
      ),
    );
  };

  const validDrafts = drafts.filter(
    (draft) => draft.date && draft.occasion.trim(),
  );

  const handleSave = async () => {
    setError("");

    try {
      if (editingHoliday) {
        if (!validDrafts.length) {
          setError("Date and occasion are required");
          return;
        }

        await updateHolidayMutation.mutateAsync({
          id: editingHoliday.id,
          payload: validDrafts[0],
        });
        closeModal();
        return;
      }

      if (modalMode === "default-weekly") {
        if (!defaultWeekly.weekDays?.length) {
          setError("Select at least one weekday");
          return;
        }
        if (!defaultWeekly.month || !defaultWeekly.year) {
          setError("Month and year are required");
          return;
        }

        await createDefaultWeeklyMutation.mutateAsync(defaultWeekly);
        closeModal();
        return;
      }

      if (!validDrafts.length) {
        setError("At least one holiday is required");
        return;
      }

      if (modalMode === "bulk") {
        await createBulkMutation.mutateAsync(validDrafts);
      } else {
        await createHolidayMutation.mutateAsync(validDrafts[0]);
      }

      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this holiday?")) return;

    try {
      await deleteHolidayMutation.mutateAsync(id);
      setOpenActionId(null);
      setMenuPosition(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete holiday");
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleHolidayStatusMutation.mutateAsync(id);
      setOpenActionId(null);
      setMenuPosition(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to toggle holiday status",
      );
    }
  };
  const formatKey = (date: string) => {
    return new Date(date).toISOString().slice(0, 10); // YYYY-MM-DD
  };
  return (
    <div className="max-w-7xl mx-auto rounded-lg border bg-white p-6">
      <div className="mb-4 flex flex-wrap gap-3">
        {loading ? (
          <>
            <Skeleton width={80} height={35} />
            <Skeleton width={150} height={35} />
          </>
        ) : (
          <>
            <input
              type="number"
              value={year}
              onChange={(e) =>
                setYear(Number(e.target.value) || new Date().getFullYear())
              }
              className="w-24 rounded border px-2 py-1"
            />
            <select
              value={month}
              onChange={(e) =>
                setMonth(e.target.value ? Number(e.target.value) : "")
              }
              className="rounded border px-2 py-1"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }).map((_, index) => (
                <option key={index} value={index + 1}>
                  {new Date(0, index).toLocaleString("default", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {loading ? (
          <>
            <Skeleton width={180} height={35} />
            <div className="flex gap-2">
              <Skeleton width={220} height={35} />
              <Skeleton width={40} height={40} />
              <Skeleton width={40} height={40} />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openCreateModal("single")}
                className="rounded-md bg-blue-600 px-4 py-2 text-white"
              >
                + Add Holiday
              </button>
              <button
                onClick={() => openCreateModal("bulk")}
                className="rounded-md border px-4 py-2"
              >
                + Bulk Holidays
              </button>
              <button
                onClick={() => openCreateModal("default-weekly")}
                className="rounded-md border px-4 py-2"
              >
                + Default Weekly
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative w-64">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search holiday"
                  className="w-full rounded border py-1 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button
                size="icon"
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant={viewMode === "calendar" ? "default" : "outline"}
                onClick={() => setViewMode("calendar")}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      {holidaysQuery.error ? (
        <p className="mb-4 text-sm text-red-600">
          {holidaysQuery.error.message}
        </p>
      ) : null}

      <div className="mb-6 rounded-lg border bg-gray-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Upcoming Holidays
          </h2>
          {upcomingQuery.isFetching ? (
            <span className="text-xs text-gray-500">Refreshing...</span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {(upcomingQuery.data ?? []).slice(0, 6).map((holiday) => (
            <div
              key={holiday.id}
              className={`rounded-md px-3 py-2 text-sm ${holiday.isActive ? "bg-white text-gray-800" : "bg-gray-200 text-gray-500 line-through"}`}
            >
              <div className="font-medium">{holiday.occasion}</div>
              <div className="text-xs">{formatKey(holiday.date)}</div>
            </div>
          ))}
          {!upcomingQuery.isLoading &&
          (upcomingQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming holidays found.</p>
          ) : null}
        </div>
      </div>

      {viewMode === "list" ? (
        <table className="w-full overflow-visible rounded-lg border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Day</th>
              <th className="px-4 py-2 text-left">Occasion</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      <Skeleton width={100} />
                    </td>
                    <td className="px-4 py-2">
                      <Skeleton width={70} />
                    </td>
                    <td className="px-4 py-2">
                      <Skeleton width={160} />
                    </td>
                    <td className="px-4 py-2">
                      <Skeleton width={90} />
                    </td>
                    <td className="px-4 py-2">
                      <Skeleton width={90} />
                    </td>
                    <td className="px-4 py-2">
                      <Skeleton width={30} />
                    </td>
                  </tr>
                ))
              : filteredHolidays.map((holiday) => (
                  <tr key={holiday.id} className="border-t">
                    <td className="px-4 py-2">{formatKey(holiday.date)}</td>
                    <td className="px-4 py-2">{holiday.day}</td>
                    <td className="px-4 py-2">{holiday.occasion}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${holiday.isDefaultWeekly ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {holiday.isDefaultWeekly ? "Default Weekly" : "Manual"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleToggleStatus(holiday.id)}
                        className={`rounded-full px-2 py-1 text-xs ${holiday.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}
                      >
                        {holiday.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="relative px-4 py-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (openActionId === holiday.id) {
                            setOpenActionId(null);
                            setMenuPosition(null);
                            return;
                          }
                          const rect = (
                            event.currentTarget as HTMLElement
                          ).getBoundingClientRect();
                          const menuWidth = 180;
                          const menuHeight = 132;
                          let left = rect.right - menuWidth;
                          let top = rect.bottom + 6;
                          if (left + menuWidth > window.innerWidth)
                            left = window.innerWidth - menuWidth - 10;
                          if (top + menuHeight > window.innerHeight)
                            top = rect.top - menuHeight - 6;
                          setOpenActionId(holiday.id);
                          setMenuPosition({ top, left });
                        }}
                        className="cursor-pointer px-2 py-1"
                      >
                        ⋮
                      </button>

                      {openActionId === holiday.id && menuPosition
                        ? createPortal(
                            <div
                              ref={menuRef}
                              className="fixed z-[99999] w-44 rounded-md border bg-white shadow-2xl"
                              style={{
                                top: menuPosition.top,
                                left: menuPosition.left,
                              }}
                            >
                              <button
                                onClick={() => {
                                  openEditModal(holiday);
                                  setOpenActionId(null);
                                  setMenuPosition(null);
                                }}
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  void handleToggleStatus(holiday.id)
                                }
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                              >
                                {holiday.isActive
                                  ? "Mark Inactive"
                                  : "Mark Active"}
                              </button>
                              <button
                                onClick={() => void handleDelete(holiday.id)}
                                className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>,
                            document.body,
                          )
                        : null}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      ) : (
        <HolidayCalendar
          holidays={filteredHolidays}
          year={year}
          month={month || new Date().getMonth() + 1}
        />
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h2 className="font-semibold">
                  {editingHoliday
                    ? "Edit Holiday"
                    : modalMode === "bulk"
                      ? "Add Holidays In Bulk"
                      : modalMode === "default-weekly"
                        ? "Generate Default Weekly Holidays"
                        : "Add Holiday"}
                </h2>
                <p className="text-sm text-gray-500">
                  {editingHoliday
                    ? "Update a holiday entry."
                    : modalMode === "default-weekly"
                      ? "Create recurring weekly holidays for a month."
                      : "Create holiday records that match the employee-service API."}
                </p>
              </div>
              <button type="button" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode("single");
                    setEditingHoliday(null);
                    setDrafts([emptyHolidayDraft()]);
                  }}
                  className={`rounded-md px-3 py-2 text-sm ${modalMode === "single" && !editingHoliday ? "bg-blue-600 text-white" : "border"}`}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalMode("bulk");
                    setEditingHoliday(null);
                    setDrafts([emptyHolidayDraft(), emptyHolidayDraft()]);
                  }}
                  className={`rounded-md px-3 py-2 text-sm ${modalMode === "bulk" ? "bg-blue-600 text-white" : "border"}`}
                >
                  Bulk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalMode("default-weekly");
                    setEditingHoliday(null);
                  }}
                  className={`rounded-md px-3 py-2 text-sm ${modalMode === "default-weekly" ? "bg-blue-600 text-white" : "border"}`}
                >
                  Default Weekly
                </button>
              </div>

              {modalMode === "default-weekly" && !editingHoliday ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      value={defaultWeekly.year ?? ""}
                      onChange={(e) =>
                        setDefaultWeekly((current) => ({
                          ...current,
                          year: Number(e.target.value) || null,
                        }))
                      }
                      className="rounded border px-3 py-2"
                      placeholder="Year"
                    />
                    <select
                      value={defaultWeekly.month ?? ""}
                      onChange={(e) =>
                        setDefaultWeekly((current) => ({
                          ...current,
                          month: Number(e.target.value) || null,
                        }))
                      }
                      className="rounded border px-3 py-2"
                    >
                      {Array.from({ length: 12 }).map((_, index) => (
                        <option key={index} value={index + 1}>
                          {new Date(0, index).toLocaleString("default", {
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>
                    <input
                      value={defaultWeekly.occasion ?? ""}
                      onChange={(e) =>
                        setDefaultWeekly((current) => ({
                          ...current,
                          occasion: e.target.value,
                        }))
                      }
                      className="rounded border px-3 py-2"
                      placeholder="Occasion"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {weekDayOptions.map((weekDay) => {
                      const checked = defaultWeekly.weekDays?.includes(weekDay);
                      return (
                        <label
                          key={weekDay}
                          className="flex items-center gap-2 rounded border px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setDefaultWeekly((current) => {
                                const next = new Set(current.weekDays ?? []);
                                if (checked) {
                                  next.delete(weekDay);
                                } else {
                                  next.add(weekDay);
                                }
                                return {
                                  ...current,
                                  weekDays: Array.from(next),
                                };
                              });
                            }}
                          />
                          {weekDay.charAt(0) + weekDay.slice(1).toLowerCase()}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {drafts.map((draft, index) => (
                    <div key={index} className="grid grid-cols-5 gap-3">
                      <input
                        type="date"
                        value={draft.date}
                        onChange={(e) =>
                          updateDraft(index, "date", e.target.value)
                        }
                        className="col-span-2 rounded border px-3 py-2"
                      />
                      <input
                        value={draft.occasion}
                        onChange={(e) =>
                          updateDraft(index, "occasion", e.target.value)
                        }
                        className="col-span-2 rounded border px-3 py-2"
                        placeholder="Occasion"
                      />
                      {drafts.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeDraftRow(index)}
                          className="rounded bg-red-500 text-white"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                  ))}

                  {!editingHoliday && modalMode === "bulk" ? (
                    <button
                      type="button"
                      onClick={addDraftRow}
                      className="text-blue-600"
                    >
                      + Add Row
                    </button>
                  ) : null}
                </div>
              )}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>

            <div className="flex justify-end gap-3 border-t p-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded bg-gray-200 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="rounded bg-blue-600 px-4 py-2 text-white"
              >
                {saving ? "Saving..." : editingHoliday ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
