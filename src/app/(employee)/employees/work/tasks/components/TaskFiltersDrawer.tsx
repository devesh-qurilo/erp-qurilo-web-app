// "use client";

// import { X } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// interface Props {
//   open: boolean;
//   onClose: () => void;
//   filters: any;
//   onChange: (v: any) => void;
//   onClear: () => void;
// }

// export function TaskFiltersDrawer({
//   open,
//   onClose,
//   filters,
//   onChange,
//   onClear,
// }: Props) {
//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
//       <div className="h-full w-[360px] bg-white shadow-xl flex flex-col">
//         {/* Header */}
//         <div className="flex items-center justify-between border-b px-4 py-3">
//           <h2 className="text-sm font-semibold">Filters</h2>
//           <X className="cursor-pointer" size={18} onClick={onClose} />
//         </div>

//         {/* Body */}
//         <div className="flex-1 overflow-auto p-4 space-y-4">

//           {/* Project */}
//           <FilterSelect
//             label="Project"
//             value={filters.projectId}
//             onChange={(v) => onChange({ ...filters, projectId: v })}
//           />

//           {/* Client */}
//           <FilterSelect
//             label="Client"
//             value={filters.clientId}
//             onChange={(v) => onChange({ ...filters, clientId: v })}
//           />

//           {/* Assigned To */}
//           <FilterSelect
//             label="Assigned to"
//             value={filters.assignedTo}
//             onChange={(v) => onChange({ ...filters, assignedTo: v })}
//           />

//           {/* Priority */}
//           <div>
//             <label className="text-xs text-slate-500">Priority</label>
//             <Select
//               value={filters.priority}
//               onValueChange={(v) =>
//                 onChange({ ...filters, priority: v })
//               }
//             >
//               <SelectTrigger className="mt-1">
//                 <SelectValue placeholder="All" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="All">All</SelectItem>
//                 <SelectItem value="Low">Low</SelectItem>
//                 <SelectItem value="Medium">Medium</SelectItem>
//                 <SelectItem value="High">High</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="border-t p-4 flex justify-end">
//           <Button variant="outline" onClick={onClear}>
//             Clear
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function FilterSelect({ label, value, onChange }: any) {
//   return (
//     <div>
//       <label className="text-xs text-slate-500">{label}</label>
//       <Select value={value} onValueChange={onChange}>
//         <SelectTrigger className="mt-1">
//           <SelectValue placeholder="All" />
//         </SelectTrigger>
//         <SelectContent>
//           <SelectItem value="All">All</SelectItem>
//           {/* yahan dynamic options aayenge */}
//         </SelectContent>
//       </Select>
//     </div>
//   );
// }





"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Option {
    id: string;
    name: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    filters: any;
    onChange: (v: any) => void;
    onClear: () => void;

    projects: Option[];
    clients: Option[];
    employees: Option[];
    priorities: string[];
}

export function TaskFiltersDrawer({
    open,
    onClose,
    filters,
    onChange,
    onClear,
    projects,
    clients,
    employees,
    priorities,
}: Props) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
            <div className="h-full w-[360px] bg-white shadow-xl flex flex-col">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h2 className="text-sm font-semibold">Filters </h2>
                    <X size={18} onClick={onClose} className="cursor-pointer" />
                </div>

                <div className="flex-1 p-4 space-y-4 overflow-auto">
                    <FilterSelect
                        label="Project"
                        value={filters.projectId}
                        options={projects}
                        onChange={(v) => onChange({ ...filters, projectId: v })}
                    />

                    <FilterSelect
                        label="Client"
                        value={filters.clientId}
                        options={clients}
                        onChange={(v) => onChange({ ...filters, clientId: v })}
                    />

                    <FilterSelect
                        label="Assigned To"
                        value={filters.assignedTo}
                        options={employees}
                        onChange={(v) => onChange({ ...filters, assignedTo: v })}
                    />

                    <div>
                        <label className="text-xs text-slate-500">Priority</label>
                        <Select
                            value={filters.priority}
                            onValueChange={(v) =>
                                onChange({ ...filters, priority: v })
                            }
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All</SelectItem>
                                {priorities.map((p) => (
                                    <SelectItem key={p} value={p}>
                                        {p}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="border-t p-4 flex justify-end">
                    <Button variant="outline" onClick={onClear}>
                        Clear
                    </Button>
                </div>
            </div>
        </div>
    );
}

function FilterSelect({
    label,
    value,
    options,
    onChange,
}: any) {
    return (
        <div>
            <label className="text-xs text-slate-500">{label}</label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {options.map((o: any) => (
                        <SelectItem key={o.id} value={o.id}>
                            {o.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
