
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // ✅ Outside click + escape close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onCloseMenu();
        setMenuPosition(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseMenu();
        setMenuPosition(null);
      }
    };

    if (openMenuId === t.id) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenuId, t.id]);

  return (
    <tr className="even:bg-white odd:bg-white border-t">
      <td className="py-4 px-4 text-sm text-gray-700 border-r align-top">
        {t.projectShortCode ?? "—"}
      </td>

      <td className="py-4 px-4 border-r align-top">
        <div className="text-sm font-medium">
          Task {t.taskId ?? "—"}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {t.memo ?? ""}
        </div>
      </td>

      <td className="py-4 px-4 w-48 border-r align-top">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
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

      {/* ACTION COLUMN */}
      <td className="py-4 px-4 align-top text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();

            if (openMenuId === t.id) {
              onCloseMenu();
              setMenuPosition(null);
              return;
            }

            const rect =
              (e.currentTarget as HTMLElement).getBoundingClientRect();

            const menuWidth = 180;
            const menuHeight = 120;

            let left = rect.right - menuWidth;
            let top = rect.bottom + 6;

            if (left + menuWidth > window.innerWidth) {
              left = window.innerWidth - menuWidth - 10;
            }

            if (top + menuHeight > window.innerHeight) {
              top = rect.top - menuHeight - 6;
            }

            onToggleMenu(t.id);
            setMenuPosition({ top, left });
          }}
          className="p-2 rounded hover:bg-gray-100"
        >
          <MoreVertical className="h-5 w-5 text-gray-600" />
        </button>

        {/* ✅ PORTAL DROPDOWN */}
        {openMenuId === t.id &&
          menuPosition &&
          createPortal(
            <div
              ref={menuRef}
              className="fixed w-44 bg-white rounded-md border shadow-2xl z-[99999]"
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
              }}
            >
              <div className="p-2">
                <button
                  onClick={() => onView(t)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 text-sm text-gray-700"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>

                <button
                  onClick={() => onEdit(t)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 text-sm text-gray-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>


              </div>
            </div>,
            document.body
          )}
      </td>
    </tr>
  );
};



export default TimesheetRow;

