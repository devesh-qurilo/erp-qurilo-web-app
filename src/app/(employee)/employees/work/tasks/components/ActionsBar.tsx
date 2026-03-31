// "use client";

// import React from "react";
// import {
//     Plus,
//     LayoutGrid,
//     List as ListIcon,
//     CalendarDays,
//     CheckCircle2,
//     Pin,
//     Search,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { cn } from "@/lib/utils";

// type TaskSource = "all" | "me" | "approval" | "pinned";
// type TaskViewMode = "list" | "kanban" | "calendar";

// interface ActionsBarProps {
//     taskSource: TaskSource;
//     onTaskSourceChange: (v: TaskSource) => void;

//     viewMode: TaskViewMode;
//     onViewModeChange: (v: TaskViewMode) => void;

//     onAddTask: () => void;
//     onOpenCalendar: () => void;

//     // optional: future search use
//     onSearchChange?: (value: string) => void;
// }

// export const ActionsBar: React.FC<ActionsBarProps> = ({
//     taskSource,
//     onTaskSourceChange,
//     viewMode,
//     onViewModeChange,
//     onAddTask,
//     onOpenCalendar,
//     onSearchChange,
// }) => {
//     return (
//         <div className="flex flex-wrap items-center gap-4">
//             {/* Left side buttons */}
//             <div className="flex flex-wrap items-center gap-3">
//                 {/* Add Task */}
//                 <Button
//                     onClick={onAddTask}
//                     className="flex h-10 items-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-600"
//                 >
//                     <Plus size={16} />
//                     Add Task
//                 </Button>

//                 {/* All Tasks / My Tasks segmented buttons */}
//                 <Button
//                     variant="outline"
//                     className={cn(
//                         "h-10 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium shadow-sm",
//                         taskSource === "all" &&
//                         "border-indigo-500 bg-indigo-50 text-indigo-600"
//                     )}
//                     onClick={() => onTaskSourceChange("all")}
//                 >
//                     All Tasks
//                 </Button>

//                 <Button
//                     variant="outline"
//                     className={cn(
//                         "h-10 rounded-xl border-slate-300 bg-white px-4 text-sm font-medium shadow-sm",
//                         taskSource === "me" &&
//                         "border-indigo-500 bg-indigo-50 text-indigo-600"
//                     )}
//                     onClick={() => onTaskSourceChange("me")}
//                 >
//                     My Tasks
//                 </Button>
//             </div>

//             {/* Right side: search + view toggles */}
//             <div className="ml-auto flex flex-wrap items-center gap-3">
//                 {/* Search box */}
//                 <div className="relative">
//                     <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
//                     <Input
//                         placeholder="Search..."
//                         className="h-10 w-52 rounded-xl border-slate-300 bg-white pl-9 pr-3 text-sm shadow-sm"
//                         onChange={(e) => onSearchChange?.(e.target.value)}
//                     />
//                 </div>

//                 {/* View / action icon buttons */}
//                 <div className="flex items-center gap-2">
//                     {/* Kanban */}
//                     <IconToggleButton
//                         active={viewMode === "kanban"}
//                         onClick={() => {
//                             onViewModeChange("kanban");
//                         }}
//                         icon={<LayoutGrid size={16} />}
//                     />

//                     {/* List */}
//                     <IconToggleButton
//                         active={viewMode === "list"}
//                         onClick={() => {
//                             onViewModeChange("list");
//                         }}
//                         icon={<ListIcon size={16} />}
//                     />

//                     {/* Calendar */}
//                     <IconToggleButton
//                         active={viewMode === "calendar"}
//                         onClick={() => {
//                             onViewModeChange("calendar");
//                             onOpenCalendar();
//                         }}
//                         icon={<CalendarDays size={16} />}
//                     />

//                     {/* Approval (Waiting tasks) */}
//                     <IconToggleButton
//                         active={taskSource === "approval"}
//                         onClick={() => onTaskSourceChange("approval")}
//                         icon={<CheckCircle2 size={16} />}
//                     />

//                     {/* Pin (Pinned tasks list) */}
//                     <IconToggleButton
//                         active={taskSource === "pinned"}
//                         onClick={() => onTaskSourceChange("pinned")}
//                         icon={<Pin size={16} />}
//                     />
//                 </div>
//             </div>
//         </div>
//     );
// };

// interface IconToggleButtonProps {
//     active?: boolean;
//     onClick?: () => void;
//     icon: React.ReactNode;
// }

// const IconToggleButton: React.FC<IconToggleButtonProps> = ({
//     active,
//     onClick,
//     icon,
// }) => (
//     <Button
//         variant="outline"
//         size="icon"
//         onClick={onClick}
//         className={cn(
//             "flex h-9 w-9 items-center justify-center rounded-xl border-slate-300 bg-white shadow-sm",
//             active && "border-indigo-500 bg-indigo-50 text-indigo-600"
//         )}
//     >
//         {icon}
//     </Button>
// );







"use client";

import React from "react";
import {
    Plus,
    LayoutGrid,
    List as ListIcon,
    CalendarDays,
    CheckCircle2,
    Pin,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TaskSource = "all" | "me" | "approval" | "pinned";
type TaskViewMode = "list" | "kanban" | "calendar";

interface ActionsBarProps {
    taskSource: TaskSource;
    onTaskSourceChange: (v: TaskSource) => void;

    viewMode: TaskViewMode;
    onViewModeChange: (v: TaskViewMode) => void;

    onAddTask: () => void;
    onOpenCalendar: () => void;

    // optional: future search use
    onSearchChange?: (value: string) => void;

    onOpenStages?: () => void;   // ⭐ NEW
}

export const ActionsBar: React.FC<ActionsBarProps> = ({
    taskSource,
    onTaskSourceChange,
    viewMode,
    onViewModeChange,
    onAddTask,
    onOpenCalendar,
    onSearchChange,
    onOpenStages,
}) => {
    return (
        <div className="flex flex-wrap items-center gap-4">
            {/* Left side buttons */}
            {/* Left side buttons */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Add Task */}
                <Button
                    onClick={onAddTask}
                    className="flex h-10 items-center gap-2 rounded-xl bg-indigo-500 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-600"
                >
                    <Plus size={16} />
                    Add Task
                </Button>

                {/* KANBAN MODE → show All Task Stages */}
               
            </div>


            {/* Right side: search + view toggles */}
            <div className="ml-auto flex flex-wrap items-center gap-3">
                {/* Search box */}
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search..."
                        className="h-10 w-52 rounded-xl border-slate-300 bg-white pl-9 pr-3 text-sm shadow-sm"
                        onChange={(e) => onSearchChange?.(e.target.value)}
                    />
                </div>

                {/* View / action icon buttons */}
                <div className="flex items-center gap-2">
                    {/* Kanban */}
                    <IconToggleButton
                        active={viewMode === "kanban"}
                        onClick={() => {
                            onViewModeChange("kanban");
                        }}
                        icon={<LayoutGrid size={16} />}
                    />

                    {/* List */}
                    <IconToggleButton
                        active={viewMode === "list"}
                        onClick={() => {
                            onViewModeChange("list");
                        }}
                        icon={<ListIcon size={16} />}
                    />

                    {/* Calendar */}
                    <IconToggleButton
                        active={viewMode === "calendar"}
                        onClick={() => {
                            onViewModeChange("calendar");
                            onOpenCalendar();
                        }}
                        icon={<CalendarDays size={16} />}
                    />

                    {/* Approval (Waiting tasks) */}
                    <IconToggleButton
                        active={taskSource === "approval"}
                        onClick={() => onTaskSourceChange("approval")}
                        icon={<CheckCircle2 size={16} />}
                    />

                    {/* Pin (Pinned tasks list) */}
                    <IconToggleButton
                        active={taskSource === "pinned"}
                        onClick={() => onTaskSourceChange("pinned")}
                        icon={<Pin size={16} />}
                    />
                </div>
            </div>
        </div>
    );
};

interface IconToggleButtonProps {
    active?: boolean;
    onClick?: () => void;
    icon: React.ReactNode;
}

const IconToggleButton: React.FC<IconToggleButtonProps> = ({
    active,
    onClick,
    icon,
}) => (
    <Button
        variant="outline"
        size="icon"
        onClick={onClick}
        className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border-slate-300 bg-white shadow-sm",
            active && "border-indigo-500 bg-indigo-50 text-indigo-600"
        )}
    >
        {icon}
    </Button>
);