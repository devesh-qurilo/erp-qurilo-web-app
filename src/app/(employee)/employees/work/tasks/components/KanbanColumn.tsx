"use client";

import React from "react";
import { Task } from "../page";
import { KanbanCard } from "./KanbanCard";

interface KanbanColumnProps {
    title: string;
    color?: string | null;
    tasks: Task[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
    title,
    color,
    tasks,
}) => {
    return (
        <div className="min-w-[280px] w-[280px] rounded-xl bg-slate-100 p-4 shadow-sm">
            {/* Column Title */}
            <div className="mb-4 flex items-center gap-2">
                <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: color || "#d1d5db" }}
                />
                <h2 className="font-semibold text-slate-700">{title}</h2>
                <span className="ml-auto rounded-md bg-white px-2 py-1 text-xs text-slate-500 shadow">
                    {tasks.length}
                </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3">
                {tasks.map((task) => (
                    <KanbanCard key={task.id} task={task} />
                ))}

                {tasks.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">No tasks</p>
                )}
            </div>
        </div>
    );
};
