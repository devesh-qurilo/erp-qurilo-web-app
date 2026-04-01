"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, List, User } from "lucide-react";

import LeaveActionMenu from "./LeaveActionMenu";
import NewLeaveDrawer from "./NewLeaveDrawer";
import {
  useAdminLeavesQuery,
  useDeleteLeaveMutation,
  useEmployeeProfileQuery,
  useLeaveQuotaQuery,
  useUpdateLeaveStatusMutation,
  type Leave,
} from "./api";

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function LeavesList() {
  const router = useRouter();
  const employeeId =
    typeof window !== "undefined"
      ? (localStorage.getItem("employeeId") ?? "")
      : "";

  const [view, setView] = useState<"LIST" | "CALENDAR" | "PROFILE">("LIST");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [openNewLeave, setOpenNewLeave] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    status: "",
    leaveType: "",
    paid: "",
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const {
    data: leaves = [],
    isLoading: leavesLoading,
    error: leavesError,
  } = useAdminLeavesQuery();
  const { data: quota = [] } = useLeaveQuotaQuery(
    employeeId,
    view === "PROFILE",
  );
  const { data: employee } = useEmployeeProfileQuery(
    employeeId,
    view === "PROFILE",
  );

  const updateLeaveStatus = useUpdateLeaveStatusMutation({
    onSettled: () => setLoadingId(null),
  });
  const deleteLeave = useDeleteLeaveMutation({
    onSettled: () => setLoadingId(null),
  });

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const date = leave.singleDate ?? leave.startDate;
      if (!date) return false;

      if (filters.fromDate && date < filters.fromDate) return false;
      if (filters.toDate && date > filters.toDate) return false;
      if (filters.status && leave.status !== filters.status) return false;
      if (filters.leaveType && leave.leaveType !== filters.leaveType)
        return false;
      if (filters.paid !== "" && String(leave.isPaid) !== filters.paid)
        return false;

      return true;
    });
  }, [filters, leaves]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const calendarMap = useMemo(() => {
    const map: Record<string, Leave[]> = {};
    const formatKey = (date: string) => {
      return new Date(date).toISOString().slice(0, 10); // YYYY-MM-DD
    };

    filteredLeaves.forEach((leave) => {
      if (leave.singleDate) {
        map[formatKey(leave.singleDate)] = [
          ...(map[formatKey(leave.singleDate)] || []),
          leave,
        ];
        return;
      }

      if (leave.startDate && leave.endDate) {
        const cursor = new Date(`${leave.startDate}T00:00:00`);
        const end = new Date(`${leave.endDate}T00:00:00`);

        while (cursor <= end) {
          const key = cursor.toISOString().slice(0, 10);
          map[key] = [...(map[key] || []), leave];
          cursor.setDate(cursor.getDate() + 1);
        }
      }
    });

    return map;
  }, [filteredLeaves]);

  const remainingLeaves = useMemo(
    () => quota.reduce((sum, item) => sum + item.remainingLeaves, 0),
    [quota],
  );

  const getDisplayDates = (leave: Leave) => {
    if (leave.singleDate) return formatDate(leave.singleDate);
    if (leave.startDate && leave.endDate)
      return `${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}`;
    return "N/A";
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-700";
      case "REJECTED":
        return "text-red-600";
      case "PENDING":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setLoadingId(id);
      await updateLeaveStatus.mutateAsync({
        id,
        request: { status: "APPROVED" },
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to approve leave");
    }
  };

  const handleReject = async (id: number) => {
    const rejectionReason = prompt("Enter rejection reason")?.trim();
    if (!rejectionReason) return;

    try {
      setLoadingId(id);
      await updateLeaveStatus.mutateAsync({
        id,
        request: { status: "REJECTED", rejectionReason },
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to reject leave");
    }
  };

  const handleDelete = async (id: number) => {
    const ok = confirm("Are you sure you want to delete this leave?");
    if (!ok) return;

    try {
      setLoadingId(id);
      await deleteLeave.mutateAsync(id);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete leave");
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        {view !== "PROFILE" && (
          <>
            <button
              className="rounded bg-blue-600 px-4 py-2 text-white"
              onClick={() => setOpenNewLeave(true)}
            >
              + New Leave
            </button>

            <NewLeaveDrawer
              open={openNewLeave}
              onClose={() => setOpenNewLeave(false)}
            />
          </>
        )}

        {view === "PROFILE" && employee && (
          <div className="mb-6 flex gap-6">
            <div className="flex w-1/2 items-center gap-4 rounded-xl border p-4">
              {employee.profilePictureUrl ? (
                <img
                  src={employee.profilePictureUrl}
                  className="h-14 w-14 rounded-full object-cover"
                  alt={employee.name}
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-lg font-semibold text-gray-700">
                  {employee.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-semibold">{employee.name}</h3>
                <p className="text-sm text-gray-500">
                  {employee.designationName} · {employee.departmentName}
                </p>
                <p className="text-xs text-gray-400">
                  Last login: {employee.createdAt?.split("T")[0] || "N/A"}
                </p>
              </div>
            </div>

            <div className="w-1/2 rounded-xl border p-4">
              <p className="text-sm text-gray-500">Remaining Leaves</p>
              <p className="text-2xl font-semibold text-blue-600">
                {remainingLeaves}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <List onClick={() => setView("LIST")} className="cursor-pointer" />
          <Calendar
            onClick={() => setView("CALENDAR")}
            className="cursor-pointer"
          />
          <User onClick={() => setView("PROFILE")} className="cursor-pointer" />
        </div>
      </div>

      {leavesError ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {leavesError.message || "Failed to load leave data"}
        </div>
      ) : null}

      {view === "PROFILE" && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Leave Type</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Monthly</th>
                <th className="p-3 text-left">Taken</th>
                <th className="p-3 text-left">Over</th>
                <th className="p-3 text-left">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {quota.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">{item.leaveType}</td>
                  <td className="p-3">{item.totalLeaves}</td>
                  <td className="p-3">{item.monthlyLimit}</td>
                  <td className="p-3">{item.totalTaken}</td>
                  <td className="p-3">{item.overUtilized}</td>
                  <td className="p-3">{item.remainingLeaves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "LIST" && (
        <>
          <div className="mb-6 flex flex-wrap gap-3">
            <input
              type="date"
              className="rounded-2xl border px-6 py-3"
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  fromDate: e.target.value,
                }))
              }
            />
            <input
              type="date"
              className="rounded-2xl border px-6 py-3"
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  toDate: e.target.value,
                }))
              }
            />
            <select
              className="rounded-2xl border px-6 py-3"
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  status: e.target.value,
                }))
              }
            >
              <option value="">Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              className="rounded-2xl border px-6 py-3"
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  leaveType: e.target.value,
                }))
              }
            >
              <option value="">Leave Type</option>
              <option value="SICK">Sick</option>
              <option value="CASUAL">Casual</option>
              <option value="EARNED">Earned</option>
            </select>
            <select
              className="rounded-2xl border px-6 py-3"
              onChange={(e) =>
                setFilters((current) => ({ ...current, paid: e.target.value }))
              }
            >
              <option value="">Paid</option>
              <option value="true">Paid</option>
              <option value="false">Unpaid</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{leave.employeeName}</td>
                    <td className="px-6 py-4">{leave.leaveType}</td>
                    <td className="px-6 py-4">{leave.durationType}</td>
                    <td className="px-6 py-4">{getDisplayDates(leave)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          leave.isPaid
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {leave.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusClass(leave.status)}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <LeaveActionMenu
                        status={leave.status}
                        loading={loadingId === leave.id}
                        onView={() =>
                          router.push(`/hr/leave/admin/${leave.id}`)
                        }
                        onApprove={() => handleApprove(leave.id)}
                        onReject={() => handleReject(leave.id)}
                        onDelete={() => handleDelete(leave.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!leavesLoading && filteredLeaves.length === 0 && (
            <div className="rounded border border-dashed px-4 py-10 text-center text-sm text-gray-500">
              No leave records found.
            </div>
          )}
        </>
      )}

      {view === "CALENDAR" && (
        <div>
          <div className="mb-4 flex justify-between">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))}>
              ←
            </button>
            <h2 className="font-semibold">
              {currentMonth.toLocaleString("default", { month: "long" })} {year}
            </h2>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))}>
              →
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center font-medium">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startDay }).map((_, index) => (
              <div key={index} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

              return (
                <div key={key} className="min-h-[90px] rounded border p-1">
                  <div className="font-semibold">{day}</div>
                  {calendarMap[key]?.map((leave) => (
                    <div
                      key={`${leave.id}-${key}`}
                      className="mt-1 rounded bg-blue-100 px-1 text-xs"
                    >
                      {leave.employeeName} ({leave.leaveType})
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
