"use client";

import React, { useMemo, useState } from "react";
import type { Timesheet } from "../page";
import { ChevronLeft, ChevronRight } from "lucide-react";

type FullCalendarViewProps = {
  events: Timesheet[];
  onEventClick: (ev: Timesheet) => void;
};

function getDateKey(date?: string) {
  return date ?? "";
}

const FullCalendarView: React.FC<FullCalendarViewProps> = ({
  events,
  onEventClick,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Timesheet[]>();
    events.forEach((e) => {
      if (!e.startDate) return;
      const key = getDateKey(e.startDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [events]);

  // Build grid for calendar
  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { date: Date | null }[] = [];

    for (let i = 0; i < startDay; i++) cells.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d) });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null });

    return cells;
  }, [currentMonth]);

  // Month label
  const monthLabel = currentMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function formatISO(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function changeMonth(delta: number) {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden border">

      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b  bg-gradient-to-r from-indigo-50 to-blue-50">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 hover:bg-white rounded-full shadow-sm"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        <div className="text-lg font-semibold text-gray-700">{monthLabel}</div>

        <button
          onClick={() => changeMonth(1)}
          className="p-2 hover:bg-white rounded-full shadow-sm"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* WEEK DAYS */}
      <div className="grid grid-cols-7 text-xs text-center border-b bg-gray-100">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-3 font-semibold text-gray-700 tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 gap-[1px] bg-gray-200">
        {days.map((cell, idx) => {
          if (!cell.date) {
            return (
              <div key={idx} className="bg-gray-50 h-[120px]" />
            );
          }

          const iso = formatISO(cell.date);
          const dayEvents = eventsByDate.get(iso) ?? [];

          return (
            <div
              key={idx}
              className="bg-white h-[120px] p-2 flex flex-col border border-gray-100 hover:bg-gray-50 transition group"
            >
              {/* Day number */}
              <div className="text-[12px] font-semibold text-gray-800 mb-1 group-hover:text-blue-600">
                {cell.date.getDate()}
              </div>

              {/* Events */}
              <div className="flex flex-col gap-1 overflow-hidden">
                {dayEvents.slice(0, 4).map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => onEventClick(ev)}
                    className="text-left rounded-md bg-blue-50 hover:bg-blue-100 transition px-2 py-1 text-[11px] truncate shadow-sm"
                  >
                    <span className="font-medium text-blue-700">
                      Task {ev.taskId ?? ev.id}
                    </span>
                    <span className="text-gray-500"> • {ev.durationHours ?? 0}h </span>
                  </button>
                ))}

                {/* Show "+more" */}
                {dayEvents.length > 4 && (
                  <div className="text-[10px] text-gray-500">
                    +{dayEvents.length - 4} more…
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FullCalendarView;
