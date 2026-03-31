"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Search,
  List,
  CalendarDays,
  Calendar,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const DEFAULT_API_BASE =  `${process.env.NEXT_PUBLIC_MAIN}`;
const ENDPOINT = "/timesheets/weekly";
const API_TIMEOUT_MS = 15000;

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thurs", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type WeeklyTimesheetModalProps = {
  open: boolean; // kept for compatibility but ignored
  onClose: () => void;
  apiBaseUrl?: string;
  authToken?: string | null;
};

// Row type
type Row = {
  id: string;
  taskId: string;
  taskLabel: string;
  hours: number[];
};

type TaskItem = {
  id: number;
  title: string;
  projectShortCode?: string;
};

const WeeklyTimesheetModal: React.FC<WeeklyTimesheetModalProps> = ({
  open,
  onClose,
  apiBaseUrl = DEFAULT_API_BASE,
  authToken = null,
}) => {
  /* -----------------------------------------------------
     FULL-SCREEN MODAL REMOVED → ALWAYS RENDER SECTION
  ------------------------------------------------------ */

  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const [rows, setRows] = useState<Row[]>([
    { id: "r-0", taskId: "", taskLabel: "", hours: Array(7).fill(0) },
  ]);

  const monday = getMonday(new Date());
  const [weekDays, setWeekDays] = useState(buildWeekDaysFromMonday(monday));
  const [weekLabel, setWeekLabel] = useState(generateWeekLabel(monday));

  const [loadingSave, setLoadingSave] = useState(false);
  const [saveResults, setSaveResults] = useState<string | null>(null);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  function getEffectiveToken() {
    try {
      const t = localStorage.getItem("accessToken");
      if (t && t.trim() !== "") return t.trim();
    } catch {}
    return authToken ?? null;
  }

  useEffect(() => {
    fetchMyTasks();
  }, []);

  async function fetchMyTasks() {
    setLoadingTasks(true);
    const token = getEffectiveToken();

    try {
      const res = await fetch(`${apiBaseUrl}/me/tasks`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Failed to fetch tasks");

      const json = await res.json();

      setTasks(
        json.map((t: any) => ({
          id: t.id,
          title: t.title,
          projectShortCode: t.projectShortCode,
        }))
      );
    } catch (err) {
    //  console.log("Task fetch failed:", err);
    } finally {
      setLoadingTasks(false);
    }
  }

  function openCalendar() {
    dateInputRef.current?.showPicker?.();
  }

  function handleDateSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = new Date(e.target.value);
    if (isNaN(chosen.getTime())) return;

    const newMonday = getMonday(chosen);
    const newWeek = buildWeekDaysFromMonday(newMonday);

    setWeekDays(newWeek);
    setWeekLabel(generateWeekLabel(newMonday));
  }

  function handleChangeHour(rowIndex: number, dayIndex: number, value: string) {
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIndex
          ? {
              ...r,
              hours: r.hours.map((h, j) =>
                j === dayIndex ? clampNumberFromString(value) : h
              ),
            }
          : r
      )
    );
  }

  function handleChangeTask(rowIndex: number, taskId: string) {
    const task = tasks.find((t) => String(t.id) === taskId);
    const label = task
      ? `${task.title} (${task.projectShortCode || "PRJ"})`
      : "";

    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIndex ? { ...r, taskId, taskLabel: label } : r
      )
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: `r-${Date.now()}`,
        taskId: "",
        taskLabel: "",
        hours: Array(7).fill(0),
      },
    ]);
  }

  function totalPerDay(i: number) {
    return rows.reduce((sum, r) => sum + (Number(r.hours[i]) || 0), 0);
  }

  async function handleSave() {
    setLoadingSave(true);
    setSaveResults("");

    const token = getEffectiveToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      for (const row of rows) {
        if (!row.taskId) continue;

        const payload = {
          taskId: Number(row.taskId),
          days: weekDays
            .map((d, i) => ({
              date: d.iso,
              hours: Number(row.hours[i] || 0),
            }))
            .filter((x) => x.hours > 0),
        };

        if (payload.days.length === 0) continue;

        await fetch(`${apiBaseUrl}${ENDPOINT}`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      }

      setSaveResults("Saved successfully.");
    } catch (err: any) {
      setSaveResults("Save failed.");
    } finally {
      setLoadingSave(false);
    }
  }

  /* ------------------------------------------------------------------
        NOW RENDER AS NORMAL SECTION (NOT FULL SCREEN)
  ------------------------------------------------------------------- */
  return (
    <div className="w-full bg-white border rounded-md shadow-sm p-6">
      {/* Hidden Calendar Input */}
      <input
        type="date"
        ref={dateInputRef}
        className="hidden"
        onChange={handleDateSelected}
      />

      {/* HEADER (Kept same UI) */}
      {/* <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Weekly Timesheet</h1>

        <div className="flex items-center gap-4">
          <button className="w-9 h-9 rounded-full border flex items-center justify-center">
            <Search className="w-4 h-4" />
          </button>

          <div className="flex items-center rounded-md border bg-white overflow-hidden">
            <button className="px-3 h-9 border-r">
              <List className="w-4 h-4" />
            </button>
            <button className="px-3 h-9 bg-indigo-500 text-white">
              <CalendarDays className="w-4 h-4" />
            </button>
            <button className="px-3 h-9 border-l">
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          <button className="w-9 h-9 rounded-full border flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </button>

          <div className="w-9 h-9 rounded-full border bg-gray-100 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>
      </header> */}

      {/* WEEK SELECTOR */}
      <div className="flex items-center gap-4 mb-4">
        <span className="w-16 text-sm">Week</span>

        <div
          onClick={openCalendar}
          className="flex items-center border rounded-md bg-white cursor-pointer"
        >
          <button className="h-9 px-3 border-r">
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="px-4 text-sm min-w-[160px] text-center">
            {weekLabel}
          </div>

          <button className="h-9 px-3 border-l">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TABLE SECTION — SAME UI */}
      <div className="bg-white rounded-md border shadow-sm">
        {/* HEADER */}
        <div className="bg-[#e8f0ff] border-b">
          <div className="grid grid-cols-[180px_repeat(7,1fr)]">
            <div className="px-4 py-3 text-xs font-medium">Task</div>

            {weekDays.map((d) => (
              <div key={d.iso} className="px-2 py-2 text-center border-l">
                <div className="text-sm font-semibold">{d.date}</div>
                <div className="text-[10px]">{d.month}</div>
                <div className="text-[10px] text-gray-500">{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ROWS */}
        {rows.map((row, rowIndex) => (
          <div key={row.id} className="border-b">
            <div className="grid grid-cols-[180px_repeat(7,1fr)]">
              <div className="px-4 py-3 border-r">
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={row.taskId}
                  onChange={(e) => handleChangeTask(rowIndex, e.target.value)}
                >
                  <option value="">
                    {loadingTasks ? "Loading…" : "Select Task"}
                  </option>

                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {weekDays.map((d, dayIndex) => (
                <div
                  key={dayIndex}
                  className="px-2 py-3 border-l flex justify-center"
                >
                  <input
                    type="number"
                    min={0}
                    step="0.25"
                    className="w-14 text-center border rounded-md text-sm"
                    value={row.hours[dayIndex]}
                    onChange={(e) =>
                      handleChangeHour(rowIndex, dayIndex, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* TOTAL ROW */}
        <div className="border-t bg-white">
          <div className="grid grid-cols-[180px_repeat(7,1fr)]">
            <div className="px-4 py-3 border-r text-sm">Total</div>

            {weekDays.map((_, i) => (
              <div key={i} className="px-2 py-3 border-l text-center text-sm">
                {totalPerDay(i)} hrs
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between mt-4">
        <div>
          <button
            onClick={addRow}
            className="px-4 py-2 border border-blue-500 text-blue-600 rounded-md bg-white"
          >
            + Add More
          </button>

          {saveResults && (
            <div className="mt-3 text-sm whitespace-pre-line">
              {saveResults}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={loadingSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-md"
        >
          {loadingSave ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
};

export default WeeklyTimesheetModal;

/* UTILITIES */
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}
function padNum(n: number) {
  return String(n).padStart(2, "0");
}
function shortMonth(d: Date) {
  return MONTH_NAMES[d.getMonth()].slice(0, 3);
}

function generateWeekLabel(monday: Date) {
  const start = `${padNum(monday.getDate())} ${shortMonth(monday)}`;
  const end = new Date(monday);
  end.setDate(monday.getDate() + 6);
  return `${start} - ${padNum(end.getDate())} ${shortMonth(end)}`;
}

function getMonday(d: Date) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
  return dt;
}

function buildWeekDaysFromMonday(monday: Date) {
  return Array.from({ length: 7 }).map((_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return {
      date: `${dd.getDate()}`,
      month: shortMonth(dd),
      label: WEEKDAY_LABELS[i],
      iso: isoDate(dd),
    };
  });
}

function clampNumberFromString(v: string) {
  const n = Number(v);
  return isNaN(n) || n < 0 ? 0 : n;
}
