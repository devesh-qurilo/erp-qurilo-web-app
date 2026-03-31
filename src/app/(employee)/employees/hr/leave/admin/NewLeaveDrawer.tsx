"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_MAIN;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Employee {
  employeeId: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
  role: string;
  active: boolean;
}

export default function NewLeaveDrawer({ open, onClose, onSuccess }: Props) {
  //   const [employees, setEmployees] = useState<any[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  //   const [employeeOpen, setEmployeeOpen] = useState(false);

  const [form, setForm] = useState({
    employeeIds: [] as string[],
    leaveType: "",
    durationType: "FULL_DAY",
    singleDate: "",
    startDate: "",
    endDate: "",
    reason: "",
    // status: "PENDING",
  });

  /* ================= FETCH EMPLOYEES ================= */

  useEffect(() => {
    if (!open) return;
    const empId = localStorage.getItem("employeeId");
    if (empId) {
      setForm((prev) => ({
        ...prev,
        employeeIds: [empId],
      }));
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!form.employeeIds.length || !form.leaveType || !form.reason) {
      alert("Please fill all required fields");
      return;
    }

    if (
      form.durationType === "MULTIPLE_DAYS" &&
      (!form.startDate || !form.endDate)
    ) {
      alert("Please select start & end date");
      return;
    }

    if (form.durationType !== "MULTIPLE_DAYS" && !form.singleDate) {
      alert("Please select date");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("accessToken");

    const leavePayload: any = {
      employeeIds: form.employeeIds,
      leaveType: form.leaveType,
      durationType:
        form.durationType === "MULTIPLE_DAYS" ? "MULTIPLE" : form.durationType,
      reason: form.reason,
      //   status: form.status,
    };

    if (form.durationType === "MULTIPLE_DAYS") {
      leavePayload.startDate = form.startDate;
      leavePayload.endDate = form.endDate;
    } else {
      leavePayload.singleDate = form.singleDate;
    }

    const fd = new FormData();
    fd.append("leaveData", JSON.stringify(leavePayload));
    files.forEach((f) => fd.append("documents", f));

    const res = await fetch(`${BASE_URL}/employee/api/leaves/apply`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    if (!res.ok) {
      alert("Failed to apply leave");
      setLoading(false);
      return;
    }

    onSuccess();
    onClose();
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* DRAWER */}
      <div className="absolute right-0 top-0 h-full w-[83vw] max-w-[83vw] bg-white shadow-xl overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">New Leave</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          <div className="border rounded-xl p-6">
            <h3 className="font-medium mb-6">Assign Leave</h3>

            {/* ROW 1 */}
            <div className="grid grid-cols-3 gap-6">
              {/* MEMBER */}
              <div>
                {/* <label className="text-sm font-medium">Choose Member *</label> */}

                <div>
                  <label className="text-sm font-medium">Employee</label>
                  <input
                    disabled
                    className="w-full mt-1 border rounded px-3 py-2 bg-gray-100"
                    value="Current Logged-in Employee"
                  />
                </div>
              </div>

              {/* LEAVE TYPE */}
              <div>
                <label className="text-sm font-medium">Leave Type *</label>
                <select
                  className="w-full mt-1 border rounded px-3 py-2"
                  onChange={(e) =>
                    setForm({ ...form, leaveType: e.target.value })
                  }
                >
                  <option value="">--</option>
                  <option value="SICK">Sick</option>
                  <option value="CASUAL">Casual</option>
                  <option value="EARNED">Earned</option>
                </select>
              </div>


            </div>

            {/* DURATION */}
            <div className="mt-6">
              <label className="text-sm font-medium block mb-2">
                Select Duration
              </label>
              <div className="flex gap-6 text-sm">
                {[
                  ["FULL_DAY", "Full Day"],
                  ["MULTIPLE_DAYS", "Multiple Days"],
                  ["FIRST_HALF", "First Half"],
                  ["SECOND_HALF", "Second Half"],
                ].map(([v, l]) => (
                  <label key={v} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={form.durationType === v}
                      onChange={() => setForm({ ...form, durationType: v })}
                    />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            {/* DATE SECTION */}
            <div className="mt-6">
              {form.durationType === "MULTIPLE_DAYS" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Start Date *</label>
                    <input
                      type="date"
                      className="w-full mt-1 border rounded px-3 py-2"
                      onChange={(e) =>
                        setForm({ ...form, startDate: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">End Date *</label>
                    <input
                      type="date"
                      className="w-full mt-1 border rounded px-3 py-2"
                      onChange={(e) =>
                        setForm({ ...form, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium">Date *</label>
                  <input
                    type="date"
                    className="w-full mt-1 border rounded px-3 py-2"
                    onChange={(e) =>
                      setForm({ ...form, singleDate: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            {/* REASON */}
            <div className="mt-6">
              <label className="text-sm font-medium">
                Reason for absence *
              </label>
              <textarea
                rows={4}
                className="w-full mt-1 border rounded px-3 py-2"
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>

            {/* FILE */}
            <div className="mt-6">
              <label className="text-sm font-medium">Add File</label>
              <input
                type="file"
                multiple
                className="mt-2"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-4 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded text-blue-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
