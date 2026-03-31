
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const BASE_URL = process.env.NEXT_PUBLIC_MAIN;

export default function AddFollowupModal({
  open,
  deal,
  onClose,
  onSaved,
}: {
  open: boolean;
  deal: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nextDate, setNextDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("");
  const [sendReminder, setSendReminder] = useState(true);
  const [remindBefore, setRemindBefore] = useState<number>(1);
  const [remindUnit, setRemindUnit] = useState<"MINUTES" | "HOURS" | "DAYS">(
    "DAYS"
  );
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => setIsOpen(true), 10);
    }
  }, [open]);

  if (!open || !deal) return null;

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  const saveFollowup = async () => {
    if (!nextDate || !startTime) {
      alert("Next follow up date & time required");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Authentication token missing");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${BASE_URL}/deals/${deal.id}/followups`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nextDate: format(nextDate, "yyyy-MM-dd"),
          startTime,
          remarks,
          sendReminder,
          remindBefore: sendReminder ? remindBefore : null,
          remindUnit: sendReminder ? remindUnit : null,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to create followup");
      }

      await res.json();

      onSaved();
      handleClose();
    } catch (err) {
      console.error("Add followup error:", err);
      alert("Failed to add follow up");
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
          <div className="flex justify-between items-center pb-6 mb-8 border-b border-gray-300 shadow-sm sticky top-0 bg-white z-10">
            <h3 className="text-2xl font-semibold text-gray-900">
              Add Follow Up – {deal.leadName || "Deal"}
            </h3>

            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            >
              ✕
            </button>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="text-sm text-gray-600">
                Next Follow Up *
              </label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between mt-3"
                  >
                    {nextDate
                      ? format(nextDate, "dd-MM-yyyy")
                      : "Select date"}
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Calendar
                    mode="single"
                    selected={nextDate}
                    onSelect={setNextDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Start Time *
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-3"
              />
            </div>
          </div>

          {/* Reminder */}
          <div className="flex items-center gap-3 mt-8">
            <Checkbox
              checked={sendReminder}
              onCheckedChange={(v) =>
                setSendReminder(Boolean(v))
              }
            />
            <span className="text-sm">Send Reminder</span>
          </div>

          {sendReminder && (
            <div className="grid grid-cols-2 gap-8 mt-6">
              <Input
                type="number"
                min={1}
                placeholder="Remind before"
                value={remindBefore}
                onChange={(e) =>
                  setRemindBefore(Number(e.target.value))
                }
              />

              <select
                className="border rounded-md px-4 py-3"
                value={remindUnit}
                onChange={(e) =>
                  setRemindUnit(e.target.value as any)
                }
              >
                <option value="MINUTES">Minutes</option>
                <option value="HOURS">Hours</option>
                <option value="DAYS">Days</option>
              </select>
            </div>
          )}

          {/* Remarks */}
          <div className="mt-8">
            <label className="text-sm text-gray-600">
              Remarks
            </label>
            <textarea
              className="w-full border rounded-md p-4 mt-3 min-h-[200px]"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="mt-12 flex gap-6">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={saveFollowup} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
