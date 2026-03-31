
"use client";

import { Button } from "@/components/ui/button";
import { Calendar, List, User } from "lucide-react";
// import { useEffect, useState } from "react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import HolidayCalendar from "./HolidayCalendar";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

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


  const [isEditMode, setIsEditMode] = useState(false);
const [editId, setEditId] = useState<number | null>(null);



const [menuPosition, setMenuPosition] = useState<{
  top: number;
  left: number;
} | null>(null);

const menuRef = useRef<HTMLDivElement | null>(null);


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

  // const handleAdd = async () => {
  //   const validHolidays = newHolidays.filter(
  //     (h) => h.date && h.occasion.trim()
  //   );

  //   if (!validHolidays.length) {
  //     setError("At least one holiday is required");
  //     return;
  //   }

  //   try {
  //     setSaving(true);
  //     setError("");

  //     const token = localStorage.getItem("accessToken");
  //     if (!token) {
  //       setError("Authentication required");
  //       return;
  //     }

  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_MAIN}/employee/api/holidays/bulk`,
  //       {
  //         method: "POST",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           holidays: validHolidays, // ✅ EXACT API FORMAT
  //         }),
  //       }
  //     );

  //     if (!res.ok) {
  //       const text = await res.text();
  //       throw new Error(text || "Failed to add holidays");
  //     }

  //     // response is array of created holidays
  //     await fetchHolidays(); // refresh table
  //     setAddingHoliday(false);
  //     setNewHolidays([{ date: "", occasion: "" }]);
  //   } catch (err: any) {
  //     setError(err.message);
  //   } finally {
  //     setSaving(false);
  //   }
  // };



const handleSave = async () => {
  const validHolidays = newHolidays.filter(
    (h) => h.date && h.occasion.trim()
  );

  if (!validHolidays.length) {
    setError("At least one holiday is required");
    return;
  }

  try {
    setSaving(true);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Authentication required");
      return;
    }

    // ✨ EDIT MODE
    if (isEditMode && editId) {
      await fetch(`${BASE_URL}/employee/api/holidays/${editId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validHolidays[0]),
      });
    }
    // ➕ ADD MODE
    else {
      await fetch(`${BASE_URL}/employee/api/holidays/bulk`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ holidays: validHolidays }),
      });
    }

    await fetchHolidays();

    // reset
    setAddingHoliday(false);
    setIsEditMode(false);
    setEditId(null);
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



useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setOpenActionId(null);
      setMenuPosition(null);
    }
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpenActionId(null);
      setMenuPosition(null);
    }
  };

  if (openActionId !== null) {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("keydown", handleEscape);
  };
}, [openActionId]);




  // if (loading) return <p className="p-6">Loading…</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg border">

  <div className="flex gap-3 mb-4">


      {loading ? (
    <>
      <Skeleton width={80} height={35} />
      <Skeleton width={150} height={35} />
    </>
  ) : (
    <>
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
    

    </>
  )}
      </div>






      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">

  {loading ? (
    <>
      <Skeleton width={140} height={35} />
      <div className="flex gap-2">
        <Skeleton width={200} height={35} />
        <Skeleton width={40} height={40} />
        <Skeleton width={40} height={40} />
      </div>
    </>
  ) : (
    <>

        {/* <h1 className="text-xl font-semibold">Holiday Management</h1> */}
        <button
          onClick={() => {
            setAddingHoliday(true);
            setNewHolidays([{ date: "", occasion: "" }]);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          + Add Holiday
        </button>





        <div className="flex gap-2">



<div className="relative w-64">
  {/* search icon */}
  <svg
    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>

  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search occasion"
    className="border pl-9 pr-3 py-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>



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


</>
  )}
      </div>



      {/* FILTERS */}
 





      {viewMode === "list" ? (
        /* ================= LIST VIEW ================= */
        // <table className="w-full border rounded-lg overflow-hidden">
        <table className="w-full border  rounded-lg overflow-visible">

          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Day</th>
              <th className="px-4 py-2 text-left">Occasion</th>
              <th className="px-4 py-2 text-left">Action </th>
            </tr>
          </thead>
          {/* <tbody>
            {filteredHolidays.map((h) => ( */}

<tbody>
  {loading
    ? Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          <td className="px-4 py-2">
            <Skeleton width={100} />
          </td>
          <td className="px-4 py-2">
            <Skeleton width={60} />
          </td>
          <td className="px-4 py-2">
            <Skeleton width={150} />
          </td>
          <td className="px-4 py-2">
            <Skeleton width={40} />
          </td>
        </tr>
      ))
    : filteredHolidays.map((h) => (


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
                    
{/* 
<button
  type="button"
  onClick={() =>
    setOpenActionId(openActionId === h.id ? null : h.id)
  }
  className="px-2 py-1 cursor-pointer z-30"
>
  ⋮
</button> */}



<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();

    if (openActionId === h.id) {
      setOpenActionId(null);
      setMenuPosition(null);
      return;
    }

    const rect =
      (e.currentTarget as HTMLElement).getBoundingClientRect();

    const menuWidth = 160;
    const menuHeight = 100;

    let left = rect.right - menuWidth;
    let top = rect.bottom + 6;

    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10;
    }

    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 6;
    }

    setOpenActionId(h.id);
    setMenuPosition({ top, left });
  }}
  className="px-2 py-1 cursor-pointer"
>
  ⋮
</button>



                      {/* {openActionId === h.id && (
                        // <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-20">
                        <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow z-50">

                         


<button
  onClick={() => {
    setIsEditMode(true);
    setEditId(h.id);
    setAddingHoliday(true);

    // 👇 modal ko prefill karo
    setNewHolidays([
      {
        date: h.date,
        occasion: h.occasion,
      },
    ]);

    setOpenActionId(null);
  }}
  className="block w-full text-left px-3 py-2 hover:bg-gray-100"
>
  Edit 
</button>


                          <button
                            onClick={() => {
                              handleDelete(h.id);
                              setOpenActionId(null);
                            }}
                            className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )} */}




{openActionId === h.id &&
  menuPosition &&
  createPortal(
    <div
      ref={menuRef}
      className="fixed w-36 bg-white border rounded-md shadow-2xl z-[99999]"
      style={{
        top: menuPosition.top,
        left: menuPosition.left,
      }}
    >
      <button
        onClick={() => {
          setIsEditMode(true);
          setEditId(h.id);
          setAddingHoliday(true);
          setNewHolidays([
            { date: h.date, occasion: h.occasion },
          ]);
          setOpenActionId(null);
          setMenuPosition(null);
        }}
        className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
      >
        Edit
      </button>

      <button
        onClick={() => {
          handleDelete(h.id);
          setOpenActionId(null);
          setMenuPosition(null);
        }}
        className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 text-sm"
      >
        Delete
      </button>
    </div>,
    document.body
  )}



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


      {/* ADD MODAL */}
      {addingHoliday && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg">
            <div className="flex justify-between items-center p-4 border-b">
              {/* <h2 className="font-semibold">Add Holidays</h2> */}
              <h2 className="font-semibold">
  {isEditMode ? "Edit Holiday" : "Add Holidays"}
</h2>

              <button onClick={() => setAddingHoliday(false)}>✕</button>
            </div>

            <div className="p-6 space-y-4">
              {newHolidays.map((h, i) => (
                <div key={i} className="grid grid-cols-5 gap-3">
                  <input
                    type="date"
                    value={h.date}
                    onChange={(e) => updateRow(i, "date", e.target.value)}
                    className="border px-2 py-1 rounded col-span-2"
                  />
                  <input
                    value={h.occasion}
                    onChange={(e) =>
                      updateRow(i, "occasion", e.target.value)
                    }
                    className="border px-2 py-1 rounded col-span-2"
                    placeholder="Occasion"
                  />
                  {newHolidays.length > 1 && (
                    <button
                      onClick={() => removeRow(i)}
                      className="bg-red-500 text-white rounded"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addRow} className="text-blue-600">
                + Add Row
              </button>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setAddingHoliday(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              {/* <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button> */}

<button
  onClick={handleSave}
  className="px-4 py-2 bg-blue-600 text-white rounded"
>
  {isEditMode ? "Update" : "Save"}
</button>


            </div>
          </div>
        </div>
      )}
    </div>
  );
}



