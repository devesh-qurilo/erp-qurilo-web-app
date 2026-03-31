// "use client";

// import React, { useEffect, useState } from "react";
// import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
// import { Loader2, X } from "lucide-react";
// import TaskDetailsSection from "./TaskDetailsSection";
// import FilesTab from "./Tabs/FilesTab";
// import SubTasksTab from "./Tabs/SubTasksTab";
// import TimesheetTab from "./Tabs/TimesheetTab";
// import NotesTab from "./Tabs/NotesTab";

// const MAIN_API = process.env.NEXT_PUBLIC_MAIN;

// export default function ViewTaskModal({ open, onOpenChange, taskId }) {
//     const [task, setTask] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [activeTab, setActiveTab] = useState("files");

//     useEffect(() => {
//         if (open && taskId) fetchTask();
//     }, [open, taskId]);

//     async function fetchTask() {
//         try {
//             setLoading(true);
//             const token = localStorage.getItem("accessToken");

//             const res = await fetch(`${MAIN_API}/projects/tasks/${taskId}`, {
//                 headers: { Authorization: `Bearer ${token}` },
//             });

//             const data = await res.json();
//             setTask(data);
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     }

//     return (
//         <Dialog open={open} onOpenChange={onOpenChange}>
//             <DialogContent
//                 className="
//        min-w-6xl 
//         w-full 
//         h-[90vh] 
//         p-0 
//         rounded-2xl 
//         overflow-auto 
//         flex flex-col
//     "
//             >
//                 {/* Top Header */}
//                 <div className="flex justify-between p-6 border-b">
//                     <div>
//                         <h2 className="text-xl font-semibold">
//                             Task #{task?.projectShortCode}-{task?.id}
//                         </h2>
//                         <p className="text-slate-500 text-sm">{task?.title}</p>
//                     </div>
//                     {/* <button className="p-2" onClick={() => onOpenChange(false)}>
//                         <X size={20} />
//                     </button> */}
//                 </div>

//                 {/* Loading State */}
//                 {loading ? (
//                     <div className="flex items-center justify-center h-96">
//                         <Loader2 className="animate-spin text-slate-500" size={30} />
//                     </div>
//                 ) : (
//                     <>
//                         {/* Task Details */}
//                         <TaskDetailsSection task={task} />

//                         {/* Tabs Switcher */}
//                         <div className="flex gap-6 px-6 pt-6 border-b">
//                             {["files", "subtasks", "timesheet", "notes"].map((t) => (
//                                 <button
//                                     key={t}
//                                     className={`pb-3 text-sm ${activeTab === t
//                                             ? "text-indigo-600 border-b-2 border-indigo-600"
//                                             : "text-slate-500"
//                                         }`}
//                                     onClick={() => setActiveTab(t)}
//                                 >
//                                     {t === "files" && "Files"}
//                                     {t === "subtasks" && "Sub Task"}
//                                     {t === "timesheet" && "Timesheet"}
//                                     {t === "notes" && "Notes"}
//                                 </button>
//                             ))}
//                         </div>

//                         {/* Tab Content */}
//                         <div className="p-6 min-h-[400px]">
//                             {activeTab === "files" && <FilesTab taskId={taskId} />}
//                             {activeTab === "subtasks" && <SubTasksTab taskId={taskId} />}
//                             {activeTab === "timesheet" && <TimesheetTab taskId={taskId} />}
//                             {activeTab === "notes" && <NotesTab taskId={taskId} />}
//                         </div>
//                     </>
//                 )}
//             </DialogContent>
//         </Dialog>
//     );
// }



"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import TaskDetailsSection from "./TaskDetailsSection";
import FilesTab from "./Tabs/FilesTab";
import SubTasksTab from "./Tabs/SubTasksTab";
import TimesheetTab from "./Tabs/TimesheetTab";
import NotesTab from "./Tabs/NotesTab";

const MAIN_API = process.env.NEXT_PUBLIC_MAIN;

export default function ViewTaskModal({ open, onOpenChange, taskId }) {
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("files");

    useEffect(() => {
        if (open && taskId) fetchTask();
    }, [open, taskId]);

    async function fetchTask() {
        try {
            setLoading(true);
            const token = localStorage.getItem("accessToken");

            const res = await fetch(`${MAIN_API}/projects/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            setTask(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className={`fixed inset-0 z-[999] bg-black/30 transition-opacity duration-300 
                ${open ? "opacity-100 visible" : "opacity-0 invisible"}`}
        >
            {/* RIGHT SIDE SLIDING DRAWER */}
            <div
                className={`
                    fixed right-0 top-0 h-full w-[83vw] max-w-[83vw] 
                    bg-white shadow-xl border-l 
                    transform transition-transform duration-300
                    flex flex-col
                    ${open ? "translate-x-0" : "translate-x-full"}
                `}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
                    <div>
                        <div className="text-sm text-gray-500">
                            Task #{task?.projectShortCode}-{task?.id}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ background: task?.taskStage?.labelColor }}
                            />
                            <div className="text-lg font-semibold">
                                {task?.title ?? "Task Name"}
                            </div>
                        </div>
                    </div>

                    <button
                        className="p-2 rounded hover:bg-gray-100"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* BODY SCROLL AREA */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-96">
                            Loading...
                        </div>
                    ) : (
                        <>
                            {/* TOP DETAILS SECTION */}
                            <TaskDetailsSection task={task} />

                            {/* TABS */}
                            <div className="px-6 mt-4 border-b flex gap-8 text-sm">
                                {["files", "subtasks", "timesheet", "notes"].map((t) => (
                                    <button
                                        key={t}
                                        className={`pb-3 ${activeTab === t
                                            ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                                            : "text-gray-500"
                                            }`}
                                        onClick={() => setActiveTab(t)}
                                    >
                                        {t === "files" && "Files"}
                                        {t === "subtasks" && "Sub Task"}
                                        {t === "timesheet" && "Timesheet"}
                                        {t === "notes" && "Notes"}
                                    </button>
                                ))}
                            </div>

                            {/* TAB CONTENT */}
                            <div className="p-6 min-h-[350px]">
                                {activeTab === "files" && <FilesTab taskId={taskId} />}
                                {activeTab === "subtasks" && <SubTasksTab taskId={taskId} />}
                                {activeTab === "timesheet" && (
                                    <TimesheetTab taskId={taskId} />
                                )}
                                {activeTab === "notes" && <NotesTab taskId={taskId} />}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
