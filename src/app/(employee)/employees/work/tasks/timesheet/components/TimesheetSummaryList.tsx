
// components/TimesheetSummaryList.tsx
"use client";

import React, { useEffect, useState } from "react";

type EmployeeAvatar = {
    employeeId: string;
    name?: string | null;
    profileUrl?: string | null;
    designation?: string | null;
    department?: string | null;
};

type TimeLog = {
    id: number;
    projectId?: number;
    projectShortCode?: string;
    projectName?: string;
    taskId?: number;
    taskName?: string;
    employeeId?: string;
    employees?: EmployeeAvatar[];
    startDate?: string; // "YYYY-MM-DD"
    startTime?: string; // "HH:MM:SS"
    endDate?: string;
    endTime?: string;
    memo?: string | null;
    durationHours?: number;
    createdAt?: string;
};

type EmployeeSummary = {
    employeeId: string;
    employeeName: string;
    employeeEmail?: string;
    designation?: string;
    totalMinutes?: number;
    totalHours?: number;
    timeLogs: TimeLog[];
};

const BASE =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_MAIN) ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_GATEWAY) ||
    "http://localhost:3000";

const fetchUrl = () => `${BASE.replace(/\/$/, "")}/timesheets/summary`;

function formatHours(hours?: number) {
    if (hours == null || isNaN(Number(hours))) return "0h";
    const n = Number(hours);
    if (n === 0) return "0h";
    return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}h`;
}

function formatDateTime(dateStr?: string, timeStr?: string) {
    if (!dateStr) return "-";
    const dt = timeStr ? `${dateStr}T${timeStr}` : dateStr;
    const d = new Date(dt);
    if (isNaN(d.getTime())) {
        return `${dateStr}${timeStr ? " " + timeStr : ""}`;
    }
    return d.toLocaleString(undefined, {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function TimesheetSummaryList() {
    const [data, setData] = useState<EmployeeSummary[] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const token =
                    typeof window !== "undefined"
                        ? localStorage.getItem("accessToken")
                        : null;
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                };
                if (token) headers.Authorization = `Bearer ${token}`;

                const res = await fetch(fetchUrl(), { headers, cache: "no-store" });
                if (res.status === 401) {
                    try {
                        localStorage.removeItem("accessToken");
                    } catch { }
                    throw new Error("401: Unauthorized — please login.");
                }
                if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    throw new Error(`Failed to fetch: ${res.status} ${txt}`);
                }
                const json = (await res.json()) as EmployeeSummary[];
                if (mounted) setData(json);
            } catch (err: any) {
                if (mounted) setError(err?.message || "Unknown error");
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, []);

    function toggle(employeeId: string) {
        setExpanded((prev) => ({ ...prev, [employeeId]: !prev[employeeId] }));
    }

    if (loading)
        return <div className="py-6 px-4 text-gray-600">Loading summary…</div>;
    if (error)
        return (
            <div className="py-6 px-4 text-red-600">
                Error loading summaries: {error}
            </div>
        );
    if (!data || data.length === 0)
        return <div className="py-6 px-4 text-gray-600">No summary found.</div>;

    return (
        <div className="space-y-3 px-4 pb-8">
            {data.map((emp) => {
                const isOpen = !!expanded[emp.employeeId];
                const avatarUrl = emp.timeLogs?.[0]?.employees?.[0]?.profileUrl;
                return (
                    <div
                        key={emp.employeeId}
                        className="border rounded-lg bg-white shadow-sm overflow-hidden"
                    >
                        {/* Header row */}
                        <div className="flex items-center gap-4 px-4 py-3">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border">
                                    {avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={avatarUrl}
                                            alt={emp.employeeName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm font-medium text-gray-700">
                                            {emp.employeeName
                                                ? emp.employeeName
                                                    .split(" ")
                                                    .map((s) => s[0])
                                                    .join("")
                                                    .toUpperCase()
                                                : "?"}
                                        </span>
                                    )}
                                </div>

                                <div className="min-w-0">
                                    <div className="font-medium text-sm text-gray-800 truncate">
                                        {emp.employeeName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {emp.designation ?? "—"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right mr-2">
                                    <div className="text-xs text-gray-500">Total</div>
                                    <div className="font-medium text-sm">
                                        {formatHours(emp.totalHours)}
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggle(emp.employeeId)}
                                    aria-expanded={isOpen}
                                    className="w-9 h-9 flex items-center justify-center rounded border hover:bg-gray-50"
                                >
                                    {!isOpen ? (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-blue-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            aria-hidden
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 4v16m8-8H4"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 text-gray-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            aria-hidden
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M20 12H4"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Expanded detail */}
                        {isOpen && (
                            <div className="border-t bg-gray-50 px-4 py-4">
                                <div className="overflow-auto">
                                    <table className="w-full min-w-[720px] table-fixed text-sm">
                                        <thead>
                                            <tr className="text-left text-xs text-gray-600">
                                                <th className="w-1/3 py-2 px-3">Task</th>
                                                <th className="w-1/3 py-2 px-3">Time</th>
                                                <th className="w-1/6 py-2 px-3 text-center">Total Hours</th>
                                                <th className="w-1/6 py-2 px-3 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {emp.timeLogs && emp.timeLogs.length > 0 ? (
                                                emp.timeLogs.map((tl) => (
                                                    <tr
                                                        key={tl.id}
                                                        className="border-t bg-white last:border-b"
                                                    >
                                                        <td className="py-3 px-3 align-top">
                                                            <div className="font-medium">{tl.taskName ?? "Task Name"}</div>
                                                            <div className="text-xs text-gray-500">{tl.projectName ?? ""}</div>
                                                        </td>
                                                        <td className="py-3 px-3 align-top">
                                                            <div className="text-xs text-gray-600">
                                                                {formatDateTime(tl.startDate, tl.startTime)}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {formatDateTime(tl.endDate, tl.endTime)}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 align-top text-center">
                                                            <div className="font-medium">{formatHours(tl.durationHours)}</div>
                                                        </td>
                                                        <td className="py-3 px-3 align-top text-center">
                                                            <button
                                                                title="More actions"
                                                                className="p-1 rounded hover:bg-gray-100"
                                                                onClick={() => {
                                                                //    console.log("Actions for timesheet", tl.id);
                                                                }}
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-5 w-5 text-gray-500"
                                                                    viewBox="0 0 20 20"
                                                                    fill="currentColor"
                                                                >
                                                                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="py-4 px-3 text-gray-500">
                                                        No time logs available.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}





