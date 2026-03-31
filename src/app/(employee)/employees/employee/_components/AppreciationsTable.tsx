"use client";

import { useState } from "react";
import { MoreVertical, Pencil, Trash } from "lucide-react";

export default function AppreciationsTable() {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const appreciations = [
    { id: 1, name: "Riya Sharma", role: "Trainee", award: "Top SDE", icon: "🏆", date: "20/08/2025", avatar: "/Images/RiyaSharma.png" },
    { id: 2, name: "Jack Smith", role: "Trainee", award: "Top Assistant Manager", icon: "🥇", date: "20/08/2025", avatar: "/Images/JackSmith.png" },
    { id: 3, name: "Jimmy Shergil", role: "Trainee", award: "Top Tester", icon: "🛠️", date: "20/08/2025", avatar: "/Images/JimmyShergil.png" },
    { id: 4, name: "Sushmita", role: "Trainee", award: "Top UI/UX Designer", icon: "⭐", date: "20/08/2025", avatar: "/Images/Sushmita.webp" },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-4">Appreciations</h3>
      <table className="w-full border rounded-lg overflow-hidden">
        <thead className="bg-blue-50">
          <tr>
            <th className="p-2 text-left">Given To</th>
            <th className="p-2 text-left">Award Name</th>
            <th className="p-2 text-left">Given On</th>
            <th className="p-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {appreciations.map((a) => (
            <tr key={a.id} className="border-t relative">
              <td className="p-3 flex items-center gap-3">
                <img src={a.avatar} alt={a.name} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-gray-500">{a.role}</p>
                </div>
              </td>
              <td><span className="text-lg">{a.icon}</span> {a.award}</td>
              <td>{a.date}</td>
              <td className="p-6 text-center relative">
                <button onClick={() => setOpenMenuId(openMenuId === a.id ? null : a.id)}>
                  <MoreVertical className="w-5 h-5 text-gray-500 cursor-pointer" />
                </button>

                {openMenuId === a.id && (
                  <div className="absolute right-6 mt-2 w-32 bg-white border rounded-md shadow-md z-10">
                    <button
                      onClick={() => alert(`Edit ${a.name}`)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => alert(`Delete ${a.name}`)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <Trash className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
