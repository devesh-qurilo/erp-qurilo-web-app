"use client";

import React from "react";
import { Task } from "../page";
import { MoreVertical } from "lucide-react";
import { TaskRowActions } from "./TaskRowActions";

export const KanbanCard: React.FC<{ task: Task }> = ({ task }) => {
    return (
        <div className="rounded-xl bg-white p-4 shadow hover:shadow-md transition cursor-pointer border border-slate-200">
            <div className="flex justify-between">
                <h3 className="font-medium text-slate-800 text-sm">{task.title}</h3>

                {/* <TaskRowActions task={task} /> */}
            </div>
            <div className="mt-3 text-xs text-slate-500">
                {task?.projectName}
            </div>

                        <div className="mt-3 text-xs text-slate-500">{task?.dueDate}</div>


            {/* Labels */}
            {task.labels && (
                <div className="mt-2 flex flex-wrap gap-2">
                    {task.labels.map((l) => (
                        <span
                            key={l.id}
                            className="rounded-full px-2 py-0.5 text-xs text-white"
                            style={{ background: l.colorCode }}
                        >
                            {l.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Info */}
            <div className="mt-3 text-xs text-slate-500">
                {task.projectShortCode}-{task.id}
            </div>

            {/* Assigned employees */}
            <div className="mt-3 flex -space-x-2">
                {task.assignedEmployees?.map((emp) => (
                    <img
                        key={emp.employeeId}
                        src={
                            emp.profileUrl ??
                            "https://avatar.iran.liara.run/public/boy?57"
                        }
                        className="h-7 w-7 rounded-full border-2 border-white object-cover"
                    />
                ))}
            </div>
        </div>
    );
};
