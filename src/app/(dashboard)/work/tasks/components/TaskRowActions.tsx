// "use client";

// import React from "react";
// import {
//     Eye,
//     Pencil,
//     Copy,
//     Pin,
//     Trash2,
//     MoreVertical,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuTrigger,
//     DropdownMenuSeparator,
// } from "@/components/ui/dropdown-menu";
// import { Task } from "../page";

// interface TaskRowActionsProps {
//     task: Task;

//     // Future optional callbacks
//     onView?: (task: Task) => void;
//     onEdit?: (task: Task) => void;
//     onDuplicate?: (task: Task) => void;
//     onTogglePin?: (task: Task) => void;
//     onDelete?: (task: Task) => void;
// }

// export const TaskRowActions: React.FC<TaskRowActionsProps> = ({
//     task,
//     onView,
//     onEdit,
//     onDuplicate,
//     onTogglePin,
//     onDelete,
// }) => {
//     return (
//         <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//                 <Button
//                     variant="ghost"
//                     size="icon"
//                     className="h-8 w-8 rounded-full hover:bg-slate-100"
//                 >
//                     <MoreVertical size={18} className="text-slate-600" />
//                 </Button>
//             </DropdownMenuTrigger>

//             <DropdownMenuContent
//                 align="end"
//                 className="w-40 rounded-xl border border-slate-200 bg-white shadow-lg"
//             >
//                 {/* View */}
//                 <DropdownMenuItem
//                     className="flex cursor-pointer items-center gap-2 text-slate-700"
//                     onClick={() => onView?.(task)}
//                 >
//                     <Eye size={16} />
//                     View
//                 </DropdownMenuItem>

//                 {/* Edit */}
//                 <DropdownMenuItem
//                     className="flex cursor-pointer items-center gap-2 text-slate-700"
//                     onClick={() => onEdit?.(task)}
//                 >
//                     <Pencil size={16} />
//                     Edit
//                 </DropdownMenuItem>

//                 {/* Duplicate */}
//                 <DropdownMenuItem
//                     className="flex cursor-pointer items-center gap-2 text-slate-700"
//                     onClick={() => onDuplicate?.(task)}
//                 >
//                     <Copy size={16} />
//                     Duplicate
//                 </DropdownMenuItem>

//                 <DropdownMenuSeparator />

//                 {/* Pin */}
//                 <DropdownMenuItem
//                     className="flex cursor-pointer items-center gap-2 text-slate-700"
//                     onClick={() => onTogglePin?.(task)}
//                 >
//                     <Pin size={16} />
//                     {task.pinned ? "Unpin Task" : "Pin Task"}
//                 </DropdownMenuItem>

//                 <DropdownMenuSeparator />

//                 {/* Delete */}
//                 <DropdownMenuItem
//                     className="flex cursor-pointer items-center gap-2 text-red-600"
//                     onClick={() => onDelete?.(task)}
//                 >
//                     <Trash2 size={16} className="text-red-600" />
//                     Delete
//                 </DropdownMenuItem>
//             </DropdownMenuContent>
//         </DropdownMenu>
//     );
// };




"use client";

import React from "react";
import {
  Eye,
  Pencil,
  Copy,
  Pin,
  Trash2,
  MoreVertical,
  Check
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Task } from "../page";

interface TaskRowActionsProps {
  task: Task;
  onView?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
  onTogglePin?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onApprove?: (task: Task) => void;
}

export const TaskRowActions: React.FC<TaskRowActionsProps> = ({
  task,
  onView,
  onEdit,
  onDuplicate,
  onTogglePin,
  onDelete,
  onApprove,
}) => {

  const isWaiting =
    // task?.status?.toString().trim().toLowerCase() === "waiting";
      task?.taskStage?.name?.toString().trim().toLowerCase() === "waiting";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-slate-100"
        >
          <MoreVertical size={18} className="text-slate-600" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-44 rounded-xl border border-slate-200 bg-white shadow-lg"
      >
        {/* ALWAYS SHOW VIEW */}
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 text-slate-700"
          onClick={() => onView?.(task)}
        >
          <Eye size={16} />
          View
        </DropdownMenuItem>

        {/* IF STATUS = WAITING → ONLY APPROVE */}
        {isWaiting && (
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2 text-slate-700"
            onClick={() => onApprove?.(task)}
          >
            <Check size={16} />
            Approve
          </DropdownMenuItem>
        )}

        {/* IF STATUS ≠ WAITING → SHOW OTHER OPTIONS */}
        {!isWaiting && (
          <>
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 text-slate-700"
              onClick={() => onEdit?.(task)}
            >
              <Pencil size={16} />
              Edit
            </DropdownMenuItem>

            {/* <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 text-slate-700"
              onClick={() => onDuplicate?.(task)}
            >
              <Copy size={16} />
              Duplicate h
            </DropdownMenuItem> */}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 text-slate-700"
              onClick={() => onTogglePin?.(task)}
            >
              <Pin size={16} />
              {task.pinned ? "Unpin Task" : "Pin Task"}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 text-red-600"
              onClick={() => onDelete?.(task)}
            >
              <Trash2 size={16} />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};