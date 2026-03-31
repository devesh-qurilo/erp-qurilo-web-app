import React from "react";
import { Eye, Edit2, Trash2, MoreVertical } from "lucide-react";
import type { Timesheet } from "../page";

type TimesheetRowProps = {
    t: Timesheet;
    openMenuId: number | null;
    onToggleMenu: (id: number) => void;
    onCloseMenu: () => void;
    onView: (row: Timesheet) => void;
    onEdit: (row: Timesheet) => void;
    onDelete: (row: Timesheet) => void;
    fmtDateTime: (date?: string, time?: string) => string;
};

const TimesheetRow: React.FC<TimesheetRowProps> = ({
    t,
    openMenuId,
    onToggleMenu,
    onCloseMenu,
    onView,
    onEdit,
    onDelete,
    fmtDateTime,
}) => {
    const employee =
        t.employees && t.employees.length > 0 ? t.employees[0] : undefined;
    const avatar =
        employee?.profileUrl ??
        "/_next/static/media/avatar-placeholder.7b9f2b3a.jpg";

    return (
        <tr key={t.id} className="even:bg-white odd:bg-white border-t">
            <td className="py-4 px-4 text-sm text-gray-700 border-r align-top">
                {t.projectShortCode ?? "—"}
            </td>
            <td className="py-4 px-4 border-r align-top">
                <div className="text-sm font-medium">Task {t.taskId ?? "—"}</div>
                <div className="text-xs text-gray-400 mt-1">{t.memo ?? ""}</div>
            </td>
            <td className="py-4 px-4 w-48 border-r align-top">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={avatar}
                            alt={employee?.name ?? "employee"}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <div className="text-sm text-gray-800">
                            {employee?.name ?? t.employeeId ?? "—"}
                        </div>
                        <div className="text-xs text-gray-400">
                            {employee?.designation ?? employee?.department ?? ""}
                        </div>
                    </div>
                </div>
            </td>
            <td className="py-4 px-4 border-r align-top text-sm text-gray-600">
                {fmtDateTime(t.startDate, t.startTime)}
            </td>
            <td className="py-4 px-4 border-r align-top text-sm text-gray-600">
                {fmtDateTime(t.endDate, t.endTime)}
            </td>
            <td className="py-4 px-4 border-r align-top text-sm text-gray-700">
                {t.durationHours ?? 0}h
            </td>
            <td className="py-4 px-4 align-top text-right">
                <div className="inline-flex items-center relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (typeof t.id === "number") onToggleMenu(t.id);
                        }}
                        className="p-2 rounded hover:bg-gray-100"
                        title="Actions"
                        aria-expanded={openMenuId === t.id}
                    >
                        <MoreVertical className="h-5 w-5 text-gray-600" />
                    </button>

                    {openMenuId === t.id && (
                        <>
                            <div
                                onClick={onCloseMenu}
                                className="fixed inset-0 z-[10005]"
                            />
                            <div className="absolute right-0 top-8 z-[10010] w-44 bg-white rounded-md border shadow-lg">
                                <div className="p-2">
                                    <button
                                        onClick={() => onView(t)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 text-sm text-gray-700"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span>View</span>
                                    </button>

                                    <button
                                        onClick={() => onEdit(t)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 text-sm text-gray-700"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        <span>Edit</span>
                                    </button>

                                    <button
                                        onClick={() => onDelete(t)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 text-sm text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default TimesheetRow;
