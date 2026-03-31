

"use client";

import { Button } from "@/components/ui/button";
import { Calendar, List, User } from "lucide-react";
import { useEffect, useState } from "react";
import HolidayCalendar from "./HolidayCalendar";

interface Holiday {
  id: number;
  date: string;
  day: string;
  occasion: string;
  isDefaultWeekly: boolean;
  isActive: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_MAIN;

export default function HolidayPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [filteredHolidays, setFilteredHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* filters */
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | "">(new Date().getMonth() + 1);
  const [search, setSearch] = useState("");

  /* add modal */
  const [addingHoliday, setAddingHoliday] = useState(false);
  const [newHolidays, setNewHolidays] = useState([{ date: "", occasion: "" }]);

  /* edit / action */
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");


  /* ================= FETCH ================= */
  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${BASE_URL}/employee/api/holidays`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch holidays");
      setHolidays(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  /* ================= FILTER ================= */
  useEffect(() => {
    let list = holidays;

    if (year || month) {
      list = list.filter((h) => {
        const [y, m] = h.date.split("-").map(Number);
        if (year && y !== year) return false;
        if (month && m !== month) return false;
        return true;
      });
    }

    if (search.trim()) {
      list = list.filter((h) =>
        h.occasion.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredHolidays(list);
  }, [holidays, year, month, search]);

  /* ================= ADD ================= */
  const addRow = () =>
    setNewHolidays([...newHolidays, { date: "", occasion: "" }]);

  const updateRow = (i: number, k: "date" | "occasion", v: string) => {
    const copy = [...newHolidays];
    copy[i][k] = v;
    setNewHolidays(copy);
  };

  const removeRow = (i: number) =>
    setNewHolidays(newHolidays.filter((_, idx) => idx !== i));

  const handleAdd = async () => {
    const validHolidays = newHolidays.filter(
      (h) => h.date && h.occasion.trim()
    );

    if (!validHolidays.length) {
      setError("At least one holiday is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAIN}/employee/api/holidays/bulk`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            holidays: validHolidays, // ✅ EXACT API FORMAT
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to add holidays");
      }

      // response is array of created holidays
      await fetchHolidays(); // refresh table
      setAddingHoliday(false);
      setNewHolidays([{ date: "", occasion: "" }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };


  /* ================= UPDATE ================= */
  const handleUpdate = async () => {
    if (!editingHoliday) return;
    try {
      setSaving(true);
      const token = localStorage.getItem("accessToken");

      await fetch(
        `${BASE_URL}/employee/api/holidays/${editingHoliday.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: editingHoliday.date,
            occasion: editingHoliday.occasion,
          }),
        }
      );

      await fetchHolidays();
      setEditingHoliday(null);
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this holiday?")) return;
    try {
      setSaving(true);
      const token = localStorage.getItem("accessToken");
      await fetch(`${BASE_URL}/employee/api/holidays/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchHolidays();
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // reset row-level UI state when switching views
    setOpenActionId(null);
    setEditingHoliday(null);
  }, [viewMode]);

  if (loading) return <p className="p-6">Loading…</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg border">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">

        <div className="flex text-right gap-2">
          <Button
            size="icon"
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            aria-label="List View"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant={viewMode === "calendar" ? "default" : "outline"}
            onClick={() => setViewMode("calendar")}
            aria-label="Calendar View"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>

      </div>

      {/* FILTERS */}
      <div className="flex gap-3 mb-4">
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(+e.target.value)}
          className="border px-2 py-1 rounded w-24"
        />
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value ? +e.target.value : "")}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Months</option>
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search occasion"
          className="border px-3 py-1 rounded flex-1"
        />
      </div>





      {viewMode === "list" ? (
        /* ================= LIST VIEW ================= */
        <table className="w-full border rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Day</th>
              <th className="px-4 py-2 text-left">Occasion</th>
              {/* <th className="px-4 py-2 text-left">Action</th> */}
            </tr>
          </thead>
          <tbody>
            {filteredHolidays.map((h) => (
              <tr key={h.id} className="border-t">
                <td className="px-4 py-2">
                  {editingHoliday?.id === h.id ? (
                    <input
                      type="date"
                      value={editingHoliday.date}
                      onChange={(e) =>
                        setEditingHoliday({
                          ...editingHoliday,
                          date: e.target.value,
                        })
                      }
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    h.date
                  )}
                </td>

                <td className="px-4 py-2">{h.day}</td>
                <td className="px-4 py-2">
                  {editingHoliday?.id === h.id ? (
                    <input
                      value={editingHoliday.occasion}
                      onChange={(e) =>
                        setEditingHoliday({
                          ...editingHoliday,
                          occasion: e.target.value,
                        })
                      }
                      className="border px-2 py-1 rounded w-full"
                    />
                  ) : (
                    h.occasion
                  )}
                </td>

                <td className="px-4 py-2 relative">
                  {editingHoliday?.id === h.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdate}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingHoliday(null)}
                        className="bg-gray-300 px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>



                    </>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        /* ================= CALENDAR VIEW ================= */
        <HolidayCalendar holidays={filteredHolidays} year={year} month={month || new Date().getMonth() + 1} />
      )}

    </div>
  );
}



