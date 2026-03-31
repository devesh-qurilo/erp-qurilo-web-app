"use client";

import axios from "axios";
import { useState } from "react";

interface NewHoliday {
  date: string;
  occasion: string;
}

export default function AddHolidayPage() {
  const [newHolidays, setNewHolidays] = useState<NewHoliday[]>([
    { date: "", occasion: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Handle holiday input change
  const handleHolidayChange = (index: number, field: keyof NewHoliday, value: string) => {
    const updated = [...newHolidays];
    updated[index][field] = value;
    setNewHolidays(updated);
  };

  // Add new row
  const addHolidayRow = () => {
    setNewHolidays([...newHolidays, { date: "", occasion: "" }]);
  };

  // Remove row
  const removeHolidayRow = (index: number) => {
    setNewHolidays(newHolidays.filter((_, i) => i !== index));
  };

  // Submit holidays
  const handleSubmit = async () => {
    try {
      // setSubmitting(true);
      // setMessage("");

      const token = localStorage.getItem("accessToken")
      // if (!token) {
      //   setMessage("❌ No token found in localStorage");
      //   setSubmitting(false);
      //   return;
      // }
      //("dekh bhaiiii", JSON.stringify({ holidays: newHolidays }))
      const res = await axios.post(`${process.env.NEXT_PUBLIC_MAIN}/employee/api/holidays/bulk`, {

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ holidays: newHolidays }),
      });

      if (!res.ok) {
        throw new Error("Failed to create holidays");
      }

      await res.data;
      setMessage("✅ Holidays created successfully!");
      setNewHolidays([{ date: "", occasion: "" }]);
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Add New Holidays</h1>

      {newHolidays.map((holiday, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <input
            type="date"
            value={holiday.date}
            onChange={(e) => handleHolidayChange(index, "date", e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            value={holiday.occasion}
            onChange={(e) => handleHolidayChange(index, "occasion", e.target.value)}
            placeholder="Occasion"
            className="border p-2 rounded flex-1"
          />
          {newHolidays.length > 1 && (
            <button
              onClick={() => removeHolidayRow(index)}
              className="bg-red-500 text-white px-3 rounded"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <div className="flex gap-2 mt-4">
        <button
          onClick={addHolidayRow}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          + Add Row
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
