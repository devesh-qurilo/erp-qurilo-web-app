"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
    fetchTaskTimesheet,
    getStoredAccessToken,
    type TaskTimeLogRecord,
} from "../../../api";

interface TimesheetTabProps {
    taskId: number;
}

export default function TimesheetTab({ taskId }: TimesheetTabProps) {
    const [records, setRecords] = useState<TaskTimeLogRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTimesheet = useCallback(async () => {
        const token = getStoredAccessToken();
        if (!token) {
            setRecords([]);
            setError("Not authenticated");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setRecords(await fetchTaskTimesheet(token, taskId));
        } catch (err) {
            console.error("Timesheet fetch error:", err);
            setError(err instanceof Error ? err.message : "Failed to load timesheet");
        } finally {
            setLoading(false);
        }
    }, [taskId]);

    useEffect(() => {
        void fetchTimesheet();
    }, [fetchTimesheet]);

    return (
        <div className="space-y-6">

            {/* --------- Loading --------- */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-slate-400" size={26} />
                </div>
            ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
            ) : records.length === 0 ? (
                <p className="text-slate-500 text-sm">No timesheet entries found.</p>
            ) : (
                <Card className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-slate-600">
                            <tr>
                                <th className="text-left px-4 py-3">Employee</th>
                                <th className="text-left px-4 py-3">Start</th>
                                <th className="text-left px-4 py-3">End</th>
                                <th className="text-left px-4 py-3">Duration</th>
                                <th className="text-left px-4 py-3">Memo</th>
                            </tr>
                        </thead>

                        <tbody>
                            {records.map((rec) => (
                                <tr
                                    key={rec.id}
                                    className="border-t border-slate-200 hover:bg-slate-50"
                                >
                                    {/* Employee */}
                                    <td className="px-4 py-3 flex items-center gap-3">
                                        {rec.employees?.[0]?.profileUrl ? (
                                            <img
                                                src={rec.employees[0].profileUrl}
                                                alt="avatar"
                                                className="h-8 w-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-slate-300" />
                                        )}
                                        <div>
                                            <p className="font-medium text-slate-700">
                                                {rec.employees?.[0]?.name || rec.employeeId || "Unknown"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {rec.employees?.[0]?.designation || ""}
                                            </p>
                                        </div>
                                    </td>

                                    {/* Start Date / Time */}
                                    <td className="px-4 py-3">
                                        <p className="text-slate-700">{rec.startDate}</p>
                                        <p className="text-xs text-slate-500">{rec.startTime}</p>
                                    </td>

                                    {/* End Date / Time */}
                                    <td className="px-4 py-3">
                                        <p className="text-slate-700">{rec.endDate}</p>
                                        <p className="text-xs text-slate-500">{rec.endTime}</p>
                                    </td>

                                    {/* Duration */}
                                    <td className="px-4 py-3 text-slate-700">
                                        {rec.durationHours}h
                                    </td>

                                    {/* Memo */}
                                    <td className="px-4 py-3 text-slate-500">
                                        {rec.memo || "--"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
}
