"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Task } from "../page";
// import { CalendarDays } from "lucide-react";
import { CalendarDays, X } from "lucide-react";

interface CalendarModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tasks: Task[];
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
    open,
    onOpenChange,
    tasks,
}) => {

if (!open) return null;

    return (
        // <Dialog open={open} onOpenChange={onOpenChange}>
        //     <DialogContent className="max-h-[90vh] w-[600px] overflow-y-auto rounded-2xl border border-slate-200 p-0">
        //         <DialogHeader className="border-b border-slate-200 px-6 py-4">
        //             <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
        //                 <CalendarDays size={20} />
        //                 Task Date Overview
        //             </DialogTitle>
        //         </DialogHeader>



 <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="flex-1 bg-black/40"
        onClick={() => onOpenChange(false)}
      />

      {/* Right Drawer */}
      <div className="h-full w-[83%] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300  bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <CalendarDays size={20} />
            Task Date Overview
          </div>

          <button onClick={() => onOpenChange(false)}>
            <X size={20} />
          </button>
        </div>


                {/* BODY */}
                <div className="space-y-4 px-6 py-4">
                    {tasks.length === 0 ? (
                        <p className="py-10 text-center text-sm text-slate-500">
                            No tasks available for selected filters.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                                >
                                    <div className="mb-1 flex justify-between">
                                        <h3 className="font-medium text-slate-800">{task.title}</h3>
                                        <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700">
                                            {task.projectShortCode ?? "TASK"}-{task.id}
                                        </span>
                                    </div>

                                    {/* Date Range */}
                                    <div className="mt-2">
                                        <p className="text-xs text-slate-500">Start Date</p>
                                        <p className="text-sm font-medium text-slate-700">
                                            {task.startDate ?? "--"}
                                        </p>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-xs text-slate-500">Due Date</p>
                                        <p className="text-sm font-medium text-slate-700">
                                            {task.dueDate ?? "--"}
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div className="mt-3">
                                        <span className="flex w-fit items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700">
                                            <span
                                                className="h-2 w-2 rounded-full"
                                                style={{
                                                    background: task.taskStage?.labelColor,
                                                }}
                                            />
                                            {task.taskStage?.name}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            {/* </DialogContent> */}
        {/* </Dialog> */}
        </div>
        </div>
    );
};
