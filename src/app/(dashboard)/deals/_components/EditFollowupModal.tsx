
"use client";

import { useEffect, useState } from "react";

type Followup = {
  id?: number;
  nextDate: string;
  startTime: string;
  remarks?: string;
  sendReminder?: boolean;
  remindBefore?: number;
  remindUnit?: "DAYS" | "HOURS" | "MINUTES" | string;
  status?: "PENDING" | "CANCELLED" | "COMPLETED" | string;
};

const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`;

export default function EditFollowupModal({
  dealId,
  followup,
  onClose,
  onUpdated,
}: {
  dealId: string;
  followup: Followup;
  onClose: () => void;
  onUpdated: (updated: Followup) => void;
}) {
  const [form, setForm] = useState<Followup>({
    ...followup,
    status: (followup.status || "PENDING").toUpperCase(),
  });

  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsOpen(true), 10);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  const handleSave = async () => {
    if (!form.nextDate || !form.startTime) {
      alert("Next Date and Start Time are required");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("No access token found");
        return;
      }

      const res = await fetch(
        `${BASE_URL}/deals/${dealId}/followups/${form.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            status: form.status?.toUpperCase(),
          }),
        }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to update followup");
      }

      const updated = await res.json();
      onUpdated(updated);
      handleClose();
    } catch (err: any) {
      alert(err.message || "Failed to update followup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className="relative h-full bg-white shadow-2xl border-l overflow-y-auto transition-transform duration-300 ease-in-out"
        style={{
          width: "83%",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="p-10">

          {/* Header */}
          <div className="flex justify-between items-center pb-6 mb-8 border-b border-gray-300  sticky top-0 bg-white z-10">
            <h3 className="text-2xl font-semibold text-gray-900">
              Edit Follow Up
            </h3>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-2 gap-8">

            <div>
              <label className="text-sm text-gray-600">
                Next Date *
              </label>
              <input
                type="date"
                value={form.nextDate}
                onChange={(e) =>
                  setForm({ ...form, nextDate: e.target.value })
                }
                className="mt-3 w-full border rounded-md px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Start Time *
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                className="mt-3 w-full border rounded-md px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
                className="mt-3 w-full border rounded-md px-4 py-3"
              >
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Remind Before
              </label>
              <input
                type="number"
                value={form.remindBefore}
                onChange={(e) =>
                  setForm({
                    ...form,
                    remindBefore: Number(e.target.value),
                  })
                }
                className="mt-3 w-full border rounded-md px-4 py-3"
              />
            </div>

            <div className="col-span-2">
              <label className="text-sm text-gray-600">
                Remarks
              </label>
              <textarea
                value={form.remarks}
                onChange={(e) =>
                  setForm({ ...form, remarks: e.target.value })
                }
                className="mt-3 w-full border rounded-md px-4 py-3 min-h-[200px]"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 flex gap-6">
            <button
              onClick={handleClose}
              className="px-8 py-3 border rounded-md"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-blue-600 text-white rounded-md"
            >
              {saving ? "Saving..." : "Update"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
