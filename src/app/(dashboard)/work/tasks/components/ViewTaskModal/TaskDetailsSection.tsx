"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function TaskDetailsSection({ task }) {
    if (!task) return null;

    const assignedNames =
        task?.assignedEmployees?.map((e) => e.name).join(", ") || "--";

    const labels =
        task?.labels?.map((l) => l.name).join(", ") || "--";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 border-b">

            {/* ---------- LEFT SECTION ---------- */}
            <Card className="p-6 rounded-2xl border-slate-200 shadow-sm">
                <button className="px-4 py-2 mb-6 bg-indigo-500 text-white rounded-xl text-sm">
                    Mark As Complete
                </button>

                <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <p className="text-slate-500">Project</p>
                    <p className="text-slate-700">{task.projectName || "--"}</p>

                    <p className="text-slate-500">Priority</p>
                    <p className="flex items-center gap-2 text-slate-700">
                        <span
                            className={cn(
                                "h-2 w-2 rounded-full inline-block",
                                task.priority === "LOW" && "bg-green-500",
                                task.priority === "MEDIUM" && "bg-yellow-500",
                                task.priority === "HIGH" && "bg-red-500"
                            )}
                        />
                        {task.priority || "--"}
                    </p>

                    <p className="text-slate-500">Assigned To</p>
                    <p className="text-slate-700">{assignedNames}</p>

                    <p className="text-slate-500">Project Code</p>
                    <p className="text-slate-700">
                        {task.projectShortCode}-{task.id}
                    </p>

                    <p className="text-slate-500">Milestones</p>
                    <p className="text-slate-700">
                        {task.milestone?.title || "--"}
                    </p>

                    <p className="text-slate-500">Label</p>
                    <p className="text-slate-700">{labels}</p>

                    <p className="text-slate-500">Task Category</p>
                    <p className="text-slate-700">
                        {task.categoryId?.name || "--"}
                    </p>

                    <p className="text-slate-500">Description</p>
                    <p className="text-slate-700">
                        {task.description || "--"}
                    </p>
                </div>
            </Card>

            {/* ---------- RIGHT SECTION ---------- */}
            <Card className="p-6 rounded-2xl border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: task?.taskStage?.labelColor || "#3b82f6" }}
                    />
                    <p className="font-medium text-slate-700">
                        {task?.taskStage?.name || "--"}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <p className="text-slate-500">Created On</p>
                    <p className="text-slate-700">
                        {formatDate(task.createdAt)}
                    </p>

                    <p className="text-slate-500">Start Date</p>
                    <p className="text-slate-700">
                        {formatShort(task.startDate) || "--"}
                    </p>

                    <p className="text-slate-500">Due Date</p>
                    <p className="text-slate-700">
                        {formatShort(task.dueDate) || "--"}
                    </p>

                    <p className="text-slate-500">Hours Logged</p>
                    <p className="text-slate-700">
                        {task.hoursLogged || 0}h
                    </p>
                </div>
            </Card>

        </div>
    );
}

/* ---------- HELPERS ---------- */
function formatDate(dateString) {
    if (!dateString) return "--";
    const d = new Date(dateString);
    return d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatShort(dateString) {
    if (!dateString) return "--";
    const d = new Date(dateString);
    return d.toLocaleDateString("en-GB");
}
