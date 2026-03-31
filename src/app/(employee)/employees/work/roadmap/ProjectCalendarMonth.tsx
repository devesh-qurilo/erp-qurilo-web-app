
"use client";

import React, { useEffect, useMemo, useState } from "react";

/* ================= BASE URL ================= */
const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`;

/* ================= TYPES ================= */
type Project = {
  id: number;
  name: string;
  startDate: string;
  deadline: string;
};

/* ================= HELPERS ================= */
const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const isSameDay = (a: Date, b: Date) =>
  a.toDateString() === b.toDateString();

/* ================= COMPONENT ================= */
export default function ProjectCalendarMonth() {
  /* ================= STATE ================= */
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  /* ================= API FUNCTION ================= */
  const fetchProjects = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/projects`, {
         headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch projects");

      const data = await res.json();

      const mapped: Project[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        startDate: p.startDate,
        deadline: p.deadline,
      }));

      setProjects(mapped);
    } catch (err) {
      console.error("Project fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= EFFECT ================= */
  useEffect(() => {
    fetchProjects();
  }, []);

  /* ================= CALENDAR DAYS ================= */
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const days: Date[] = [];

    const startDay = new Date(start);
    startDay.setDate(start.getDate() - start.getDay());

    const endDay = new Date(end);
    endDay.setDate(end.getDate() + (6 - end.getDay()));

    let day = startDay;
    while (day <= endDay) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  /* ================= PROJECT MATCH ================= */
  const getProjectsForDay = (day: Date) => {
    return projects.filter((project) => {
      const start = new Date(project.startDate);
      const end = new Date(project.deadline);
      return day >= start && day <= end;
    });
  };

  /* ================= RENDER ================= */
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border p-4 ">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
              )
            )
          }
          className="px-3 py-1 border rounded"
        >
          ◀
        </button>

        <h2 className="text-lg font-semibold">
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>

        <button
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
              )
            )
          }
          className="px-3 py-1 border rounded"
        >
          ▶
        </button>
      </div>

      {loading && (
        <div className="text-center py-6 text-sm text-gray-500">
          Loading projects...
        </div>
      )}

      {/* ===== Week Days ===== */}
      <div className="grid grid-cols-7 text-sm font-medium text-center border-b pb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* ===== Calendar Grid ===== */}
    <div className="mt-2 max-h-[70vh] overflow-y-auto overflow-x-hidden">
      <div className="grid grid-cols-7 gap-px bg-gray-200 mt-2">
        {calendarDays.map((day, index) => {
          const dayProjects = getProjectsForDay(day);
          const isCurrentMonth =
            day.getMonth() === currentMonth.getMonth();

          return (
            <div
              key={index}
              className={`min-h-[110px] bg-white p-1 text-xs ${
                !isCurrentMonth ? "opacity-40" : ""
              }`}
            >
              <div className="text-right font-semibold">
                {day.getDate()}
              </div>

              <div className="space-y-1 mt-1">
                {dayProjects.map((project) => {
                  const isStart = isSameDay(
                    day,
                    new Date(project.startDate)
                  );
                  const isEnd = isSameDay(
                    day,
                    new Date(project.deadline)
                  );

                  return (
                    <div
                      key={project.id}
                      className={`px-2 py-1 rounded text-white text-[11px]
                        ${
                          isStart || isEnd
                            ? "bg-blue-600"
                            : "bg-blue-400"
                        }`}
                    >
                      {isStart && <span>▶ </span>}
                      {project.name}
                      {isEnd && <span> ◀</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}
