"use client";
import { useEffect, useMemo, useState } from "react";
import LeaveActionMenu from "./LeaveActionMenu";
import { useRouter } from "next/navigation";
import NewLeaveDrawer from "./NewLeaveDrawer";
import { Calendar, List, User } from "lucide-react";

/* ================= TYPES ================= */
interface Leave {
  id: number;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  durationType: string;
  startDate: string | null;
  endDate: string | null;
  singleDate: string | null;
  reason: string;
  status: string;
  rejectionReason: string | null;
  approvedByName: string | null;
  isPaid: boolean;
  approvedAt: string | null;
  rejectedAt: string | null;
  documentUrls: string[];
  createdAt: string;
  updatedAt: string;
}

interface LeaveQuota {
  id: number;
  leaveType: string;
  totalLeaves: number;
  monthlyLimit: number;
  totalTaken: number;
  overUtilized: number;
  remainingLeaves: number;
}

interface EmployeeProfile {
  employeeId: string;
  name: string;
  profilePictureUrl?: string;
  designationName?: string;
  departmentName?: string;
  createdAt?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_MAIN;

export default function LeavesList() {
  /* ================= BASIC STATE ================= */
  const [view, setView] = useState<"LIST" | "CALENDAR" | "PROFILE">("LIST");
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [quota, setQuota] = useState<LeaveQuota[]>([]);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [openNewLeave, setOpenNewLeave] = useState(false);
  const Router = useRouter();

  /* ================= FILTER STATE ================= */
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    status: "",
    leaveType: "",
    paid: "",
  });

  /* ================= FETCH LEAVES ================= */
  const fetchLeaves = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const res = await fetch(`${BASE_URL}/employee/api/leaves/my-leaves`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setLeaves(await res.json());
  };

  /* ================= FETCH QUOTA ================= */
  const fetchQuota = async () => {
    const empId = localStorage.getItem("employeeId");
    const token = localStorage.getItem("accessToken");
    if (!empId || !token) return;

    const res = await fetch(`${BASE_URL}/employee/leave-quota/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setQuota(await res.json());
  };

  /* ================= FETCH EMPLOYEE ================= */
  const fetchEmployee = async () => {
    const empId = localStorage.getItem("employeeId");
    const token = localStorage.getItem("accessToken");
    if (!empId || !token) return;

    const res = await fetch(`${BASE_URL}/employee/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setEmployee(await res.json());
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (view === "PROFILE") {
      fetchQuota();
      fetchEmployee();
    }
  }, [view]);

  /* ================= FILTER LOGIC ================= */
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const date = l.singleDate ?? l.startDate;
      if (!date) return false;

      if (filters.fromDate && date < filters.fromDate) return false;
      if (filters.toDate && date > filters.toDate) return false;
      if (filters.status && l.status !== filters.status) return false;
      if (filters.leaveType && l.leaveType !== filters.leaveType) return false;
      if (filters.paid !== "" && String(l.isPaid) !== filters.paid)
        return false;

      return true;
    });
  }, [leaves, filters]);

  /* ================= CALENDAR HELPERS ================= */
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const calendarMap = useMemo(() => {
    const map: Record<string, Leave[]> = {};
    filteredLeaves.forEach((l) => {
      if (l.singleDate) {
        map[l.singleDate] = [...(map[l.singleDate] || []), l];
      } else if (l.startDate && l.endDate) {
        let d = new Date(l.startDate);
        const end = new Date(l.endDate);
        while (d <= end) {
          const key = d.toISOString().split("T")[0];
          map[key] = [...(map[key] || []), l];
          d.setDate(d.getDate() + 1);
        }
      }
    });
    return map;
  }, [filteredLeaves]);

  /* ================= HELPERS ================= */
  const remainingLeaves = useMemo(
    () => quota.reduce((s, q) => s + q.remainingLeaves, 0),
    [quota],
  );

  const getDisplayDates = (leave: Leave) => {
    if (leave.singleDate) return leave.singleDate;
    if (leave.startDate && leave.endDate)
      return `${leave.startDate} to ${leave.endDate}`;
    return "N/A";
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-700 flex items-center gap-2";
      case "REJECTED":
        return "text-red-600 flex items-center gap-2";
      case "PENDING":
        return "text-yellow-600 flex items-center gap-2";
      default:
        return "text-gray-600";
    }
  };

  /* ================= ACTIONS ================= */
  const approveLeave = async (id: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setLoadingId(id);
    await fetch(`${BASE_URL}/employee/api/leaves/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    await fetchLeaves();
    setLoadingId(null);
  };

  const rejectLeave = async (id: number, reason: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token || !reason) return;
    setLoadingId(id);
    await fetch(`${BASE_URL}/employee/api/leaves/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "REJECTED", rejectionReason: reason }),
    });
    await fetchLeaves();
    setLoadingId(null);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* ================= TOP BAR ================= */}
      <div className="flex justify-between items-center mb-4">
        {view !== "PROFILE" && (
          <>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => setOpenNewLeave(true)}
            >
              + New Leave
            </button>

            <NewLeaveDrawer
              open={openNewLeave}
              onClose={() => setOpenNewLeave(false)}
              onSuccess={fetchLeaves}
            />
          </>
        )}

        {/* ================= PROFILE HEADER ================= */}
        {view === "PROFILE" && employee && (
          <div className="flex gap-6 mb-6">
            <div className="flex items-center gap-4 border rounded-xl p-4 w-1/2">
              <img
                src={employee.profilePictureUrl || "/avatar.png"}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold">{employee.name}</h3>
                <p className="text-sm text-gray-500">
                  {employee.designationName} · {employee.departmentName}
                </p>
                <p className="text-xs text-gray-400">
                  Last login: {employee.createdAt?.split("T")[0]}
                </p>
              </div>
            </div>

            <div className="border rounded-xl p-4 w-1/2">
              <p className="text-sm text-gray-500">Remaining Leaves</p>
              <p className="text-2xl font-semibold text-blue-600">
                {remainingLeaves}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <List onClick={() => setView("LIST")} />
          <Calendar onClick={() => setView("CALENDAR")} />
          <User onClick={() => setView("PROFILE")} />
        </div>
      </div>

      {/* ================= LEAVE QUOTA TABLE (RESTORED) ================= */}
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
              {quota.map((q) => (
                <tr key={q.id} className="border-t">
                  <td className="p-3">{q.leaveType}</td>
                  <td className="p-3">{q.totalLeaves}</td>
                  <td className="p-3">{q.monthlyLimit}</td>
                  <td className="p-3">{q.totalTaken}</td>
                  <td className="p-3">{q.overUtilized}</td>
                  <td className="p-3">{q.remainingLeaves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= LIST VIEW ================= */}
      {view === "LIST" && (
        <>
          {/* FILTERS */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              type="date"
              className="border py-3 px-6 rounded-2xl"
              onChange={(e) =>
                setFilters((f) => ({ ...f, fromDate: e.target.value }))
              }
            />
            <input
              type="date"
              className="border py-3 px-6 rounded-2xl"
              onChange={(e) =>
                setFilters((f) => ({ ...f, toDate: e.target.value }))
              }
            />
            <select
              className="border py-3 px-6 rounded-2xl"
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="">Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              className="border py-3 px-6 rounded-2xl"
              onChange={(e) =>
                setFilters((f) => ({ ...f, leaveType: e.target.value }))
              }
            >
              <option value="">Leave Type</option>
              <option value="SICK">Sick</option>
              <option value="CASUAL">Casual</option>
              <option value="EARNED">Earned</option>
            </select>
            <select
              className="border py-3 px-6 rounded-2xl"
              onChange={(e) =>
                setFilters((f) => ({ ...f, paid: e.target.value }))
              }
            >
              <option value="">Paid</option>
              <option value="true">Paid</option>
              <option value="false">Unpaid</option>
            </select>
          </div>

          {/* TABLE */}
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
                    {/* <td className="px-6 py-4 max-w-xs truncate">{leave.reason}</td> */}

                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium
      ${
        leave.isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
                          Router.push(`/employees/hr/leave/admin/${leave.id}`)
                        }
                        onApprove={() => approveLeave(leave.id)}
                        onReject={() => {
                          const reason = prompt("Enter rejection reason");
                          if (reason) rejectLeave(leave.id, reason);
                        }}
                        onDelete={() => confirm("Delete this leave?")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ================= CALENDAR VIEW ================= */}
      {view === "CALENDAR" && (
        <div>
          <div className="flex justify-between mb-4">
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

          <div className="grid grid-cols-7 text-center font-medium mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={i} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              return (
                <div key={key} className="border rounded p-1 min-h-[90px]">
                  <div className="font-semibold">{day}</div>
                  {calendarMap[key]?.map((l) => (
                    <div
                      key={l.id}
                      className="text-xs bg-blue-100 rounded px-1 mt-1"
                    >
                      {l.employeeName} ({l.leaveType})
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
