"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function TasksTable() {
  const [tasks, setTasks] = useState([
    { id: "RTA-40", name: "Planning", status: "To do", due: "02/08/2025" },
    { id: "RTA-40", name: "Testing", status: "Doing", due: "02/08/2025" },
    { id: "RTA-40", name: "Testing", status: "Incomplete", due: "02/08/2025" },
    { id: "RTA-40", name: "Testing", status: "Incomplete", due: "02/08/2025" },
  ]);

  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const statusOptions = [
    { label: "To do", color: "bg-yellow-500" },
    { label: "Doing", color: "bg-blue-500" },
    { label: "Incomplete", color: "bg-red-500" },
  ];

  const handleStatusChange = (index: number, newStatus: string) => {
    const updated = [...tasks];
    updated[index].status = newStatus;
    setTasks(updated);
    setOpenDropdown(null); // close dropdown after selecting
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-4">My Tasks</h3>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Task #</th>
            <th className="p-2 border">Task Name</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Due Date</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => {
            const activeStatus = statusOptions.find((s) => s.label === t.status);
            return (
              <tr key={i} className="text-center relative">
                <td className="p-2 border">{t.id}</td>
                <td className="p-2 border">{t.name}</td>
                <td className="p-2 border">
                  <div className="relative inline-block text-left">
                    {/* Button */}
                    <button
                      onClick={() =>
                        setOpenDropdown(openDropdown === i ? null : i)
                      }
                      className="flex items-center border rounded px-2 py-1 text-sm bg-white"
                    >
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${activeStatus?.color}`}
                      ></span>
                      {t.status}
                      {openDropdown === i ? (
                        <ChevronUp className="ml-2 w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="ml-2 w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {/* Dropdown menu */}
                    {openDropdown === i && (
                      <div className="absolute mt-1 bg-white border rounded shadow w-32 z-10">
                        {statusOptions.map((opt) => (
                          <div
                            key={opt.label}
                            onClick={() => handleStatusChange(i, opt.label)}
                            className="flex items-center px-4 py-1 text-sm hover:bg-gray-100 cursor-pointer"
                          >
                            <span
                              className={`w-2 h-2 rounded-full mr-2 ${opt.color}`}
                            ></span>
                            {opt.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-2 border">{t.due}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
