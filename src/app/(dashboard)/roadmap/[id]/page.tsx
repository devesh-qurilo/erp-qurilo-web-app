
"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

// same TaskStats, HoursData, tasks, members, milestones from earlier
const TaskStats = [
  { name: "Complete", value: 30, color: "#22c55e" },
  { name: "To Do", value: 25, color: "#3b82f6" },
  { name: "Doing", value: 20, color: "#f97316" },
  { name: "Incomplete", value: 15, color: "#ef4444" },
  { name: "Waiting for approval", value: 10, color: "#eab308" },
];

const tasks = [
  {
    code: "RTA-40",
    task: "Task name",
    project: "Project name",
    completedOn: "--",
    startDate: "02/08/2025",
    dueDate: "28/08/2025",
    hours: "8h",
    assigned: "https://i.pravatar.cc/40?img=5",
    status: "Doing",
  },
  {
    code: "RTA-40",
    task: "Task name",
    project: "Project name",
    completedOn: "--",
    startDate: "02/08/2025",
    dueDate: "28/08/2025",
    hours: "0h",
    assigned: "https://i.pravatar.cc/40?img=6",
    status: "Incomplete",
  },
  {
    code: "RTA-40",
    task: "Task name",
    project: "Project name",
    completedOn: "--",
    startDate: "02/08/2025",
    dueDate: "28/10/2025",
    hours: "8h",
    assigned: "https://i.pravatar.cc/40?img=7",
    status: "To Do",
  },
];

const members = [
  {
    name: "Jack Smith",
    role: "Trainee",
    avatar: "https://i.pravatar.cc/40?img=8",
    assigned: 4,
    completed: 3,
    late: 0,
    hours: "8h",
  },
  {
    name: "Taylor Reed",
    role: "Trainee",
    avatar: "https://i.pravatar.cc/40?img=9",
    assigned: 4,
    completed: 2,
    late: 1,
    hours: "7h",
  },
];

const milestones = [
  {
    title: "Project Closure",
    status: "Incomplete",
    start: "29/08/2025",
    end: "02/09/2025",
  },
  {
    title: "Project Planning",
    status: "Complete",
    start: "20/08/2025",
    end: "25/08/2025",
  },
  {
    title: "Project Planning",
    status: "Complete",
    start: "20/08/2025",
    end: "25/08/2025",
  },
];

const HoursData = [
  { name: "Planned", value: 5 },
  { name: "Actual", value: 4 },
];

export default function ProjectView() {
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const perPage = 6;

  const paginatedTasks = tasks.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(tasks.length / perPage);

  const statusColor = (status: string) => {
    switch (status) {
      case "Complete":
        return "text-green-500";
      case "Doing":
        return "text-blue-500";
      case "To Do":
        return "text-yellow-500";
      case "Incomplete":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="p-6 border-b bg-white shadow-sm">
        <h1 className="text-2xl font-bold">Project {id} – ERP System</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto  p-6 space-y-6">
        {/* Overview + Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Overview */}
          <div className="bg-white rounded-2xl shadow-md border p-4">
            <h2 className="font-semibold mb-2">Overview</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Project Name:</span> ERP System</p>
              <p><span className="font-medium">Client:</span> John Doe (Qurio LLC)</p>
              <p><span className="font-medium">Status:</span> <span className="text-blue-500">In Progress</span></p>
              <p><span className="font-medium">Start Date:</span> 02/08/2025</p>
              <p><span className="font-medium">Deadline:</span> 02/10/2025</p>
              <p><span className="font-medium">Project Members:</span> 6</p>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-yellow-400 h-3 rounded-full" style={{ width: "76%" }}></div>
              </div>
              <p className="text-sm text-gray-600">Project Progress: 76%</p>
            </div>
          </div>

          {/* Task Statistics */}
          <div className="bg-white rounded-2xl shadow-md border p-4 flex flex-col items-center">
            <h2 className="font-semibold mb-2">Task Statistics </h2>
            <PieChart width={250} height={200}>
              <Pie data={TaskStats} dataKey="value" outerRadius={80} label>
                {TaskStats.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              {TaskStats.map((t, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: t.color }}
                  ></span>
                  <span>{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hours Logged */}
        <div className="bg-white rounded-2xl shadow-md border p-4">
          <h2 className="font-semibold mb-2">Hours Logged</h2>
          <BarChart width={400} height={250} data={HoursData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" fill="#22c55e" />
          </BarChart>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-2xl shadow-md border p-4">
          <h2 className="font-semibold mb-4">Tasks</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">Code</th>
                  <th className="p-2">Task</th>
                  <th className="p-2">Completed On</th>
                  <th className="p-2">Start Date</th>
                  <th className="p-2">Due Date</th>
                  <th className="p-2">Hours Logged</th>
                  <th className="p-2">Assigned To</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.map((t, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-2">{t.code}</td>
                    <td className="p-2">
                      {t.task}
                      <div className="text-xs text-gray-500">{t.project}</div>
                    </td>
                    <td className="p-2">{t.completedOn}</td>
                    <td className="p-2">{t.startDate}</td>
                    <td
                      className={`p-2 ${t.dueDate.includes("28/08") ? "text-red-500" : ""
                        }`}
                    >
                      {t.dueDate}
                    </td>
                    <td className="p-2">{t.hours}</td>
                    <td className="p-2">
                      <img
                        src={t.assigned}
                        className="w-8 h-8 rounded-full border"
                        alt="member"
                      />
                    </td>
                    <td className={`p-2 ${statusColor(t.status)}`}>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
            <div>Result per page: {perPage}</div>
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Members + Milestones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Members */}
          <div className="bg-white rounded-2xl shadow-md border p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Members</h2>
              <div className="relative">
                <Search className="absolute left-2 top-2 text-gray-400" size={16} />
                <input
                  placeholder="Search"
                  className="pl-7 pr-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Assigned</th>
                  <th className="p-2">Completed</th>
                  <th className="p-2">Late</th>
                  <th className="p-2">Hours</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-2 flex items-center gap-2">
                      <img src={m.avatar} className="w-8 h-8 rounded-full border" />
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-gray-500">{m.role}</div>
                      </div>
                    </td>
                    <td className="p-2">{m.assigned}</td>
                    <td className="p-2">{m.completed}</td>
                    <td className="p-2">{m.late}</td>
                    <td className="p-2">{m.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-2xl shadow-md border p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Milestones</h2>
              <div className="relative">
                <Search className="absolute left-2 top-2 text-gray-400" size={16} />
                <input
                  placeholder="Search"
                  className="pl-7 pr-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">Title</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Start</th>
                  <th className="p-2">End</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-2">{m.title}</td>
                    <td className={`p-2 ${statusColor(m.status)}`}>{m.status}</td>
                    <td className="p-2">{m.start}</td>
                    <td className="p-2">{m.end}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
