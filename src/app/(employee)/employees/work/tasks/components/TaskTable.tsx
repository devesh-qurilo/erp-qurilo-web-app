"use client";

import React from "react";
import Image from "next/image";
import { MoreVertical } from "lucide-react";
import { Task } from "../page";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { TaskRowActions } from "./TaskRowActions";
import StatusDropdown from "./StatusDropdown";

interface TaskTableProps {
    tasks: Task[];
    onView?: (task: Task) => void;
    onEdit?: (task: Task) => void;
    onDelete?: (task: Task) => void;
    onDuplicate?: (task: Task) => void;
    onTogglePin?: (task: Task) => void;
}


export const TaskTable: React.FC<TaskTableProps> = ({
    tasks,
    onView,
    onEdit,
    onDelete,
    onDuplicate,
    onTogglePin
}) => {
    return (
        <div className="w-full overflow-hidden rounded-xl bg-white">
            <Table>
                <TableHeader className="bg-slate-100">
                    <TableRow>
                        <TableHead className="w-[120px] text-slate-600">Code</TableHead>
                        <TableHead className="min-w-[260px] text-slate-600">Task Name</TableHead>
                        <TableHead className="text-slate-600">Completed On</TableHead>
                        <TableHead className="text-slate-600">Start Date</TableHead>
                        <TableHead className="text-slate-600">Due Date</TableHead>
                        <TableHead className="text-slate-600">Estimated Time</TableHead>
                        <TableHead className="text-slate-600">Hours Logged</TableHead>
                        <TableHead className="text-slate-600">Assigned To</TableHead>
                        <TableHead className="text-slate-600">Status</TableHead>
                        <TableHead className="text-right text-slate-600">Action</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {tasks.map((task) => {
                        const hoursLogged = task.hoursLogged ? `${task.hoursLogged}h` : "--";

                        return (
                            <TableRow key={task.id} className="hover:bg-slate-50">
                                {/* Code */}
                                <TableCell className="font-medium text-slate-800">
                                    {task.projectShortCode ? `${task.projectShortCode}-${task.id}` : `TASK-${task.id}`}
                                </TableCell>

                                {/* Task Name + Labels + Project */}
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900">
                                            {task.title}
                                        </span>

                                        {/* Labels (Low / High etc) */}
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {task.labels?.map((label) => (
                                                <span
                                                    key={label.id}
                                                    className={cn(
                                                        "rounded-full px-2 py-0.5 text-xs font-medium",
                                                        "text-white"
                                                    )}
                                                    style={{ backgroundColor: label.colorCode }}
                                                >
                                                    {label.name}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Project Name */}
                                        <span className="text-xs text-slate-500">
                                            {task.categoryId?.name ?? "Project name"}
                                        </span>

                                        {/* Pinned Tag */}
                                        {task.pinned && (
                                            <span className="mt-1 w-fit rounded-md bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                                                Pinned
                                            </span>
                                        )}
                                    </div>
                                </TableCell>

                                {/* Completed On */}
                                <TableCell className="text-slate-600">
                                    {task.completedOn ?? "--"}
                                </TableCell>

                                {/* Dates */}
                                <TableCell className="text-slate-600">
                                    {task.startDate ?? "--"}
                                </TableCell>
                                <TableCell className="text-slate-600">
                                    {task.dueDate ?? "--"}
                                </TableCell>

                                {/* Estimated Time */}
                                <TableCell className="text-slate-600">
                                    {task.timeEstimate ? `${task.timeEstimateMinutes}m` : "--"}
                                </TableCell>

                                {/* Hours Logged */}
                                <TableCell className="font-medium text-slate-700">
                                    {hoursLogged}
                                </TableCell>

                                {/* Assigned To Avatars */}
                                <TableCell>
                                    <div className="flex -space-x-2">
                                        {task.assignedEmployees?.map((emp) => (
                                            <div
                                                key={emp.employeeId}
                                                className="h-8 w-8 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-200"
                                            >
                                                {emp.profileUrl ? (
                                                    <Image
                                                        src={emp.profileUrl}
                                                        alt={emp.name}
                                                        width={32}
                                                        height={32}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-600">
                                                        {emp.name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>

                                {/* Status Pill */}
                                {/* <TableCell>
                                    <span
                                        className="flex w-fit items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                                    >
                                        <span
                                            className="h-2 w-2 rounded-full"
                                            style={{ background: task.taskStage?.labelColor }}
                                        />
                                        {task.taskStage?.name}
                                    </span>
                                </TableCell> */}
                                <TableCell>
                                    <StatusDropdown task={task} />
                                </TableCell>

                                {/* Actions (...) */}
                                <TableCell className="text-right">
                                    {/* <TaskRowActions task={task} /> */}
                                    <TaskRowActions
                                        task={task}
                                        onView={onView}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onDuplicate={onDuplicate}
                                        onTogglePin={onTogglePin}
                                    />

                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};
