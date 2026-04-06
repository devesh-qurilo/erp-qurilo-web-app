"use client";

import { useState } from "react";
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Project = {
  id: number;
  code: string;
  name: string;
  members: string[];
  startDate: string;
  deadline: string;
  client: {
    name: string;
    company: string;
    avatar: string;
  };
  status: "Not Started" | "In Progress" | "Completed" | "On Hold";
  progress: number;
};

// Dummy Data
const projects: Project[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  code: "RTA-40",
  name: "ERP System",
  members: [
    "https://i.pravatar.cc/40?img=1",
    "https://i.pravatar.cc/40?img=2",
    "https://i.pravatar.cc/40?img=3",
  ],
  startDate: "02/08/2025",
  deadline: i % 5 === 0 ? "22/08/2025" : "02/10/2025",
  client: {
    name: "John Doe",
    company: "Qurilo LLC",
    avatar: "https://i.pravatar.cc/40?img=4",
  },
  status: "In Progress",
  progress: 66,
}));

export default function RoadmapPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [progressFilter, setProgressFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [perPage] = useState(9);

  const [showFilters, setShowFilters] = useState(false);

  // Filtering
  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.client.name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || p.status === statusFilter;

    const matchesProgress =
      progressFilter === "All"
        ? true
        : progressFilter === "Completed"
          ? p.progress === 100
          : progressFilter === "In Progress"
            ? p.progress > 0 && p.progress < 100
            : p.progress === 0;

    return matchesSearch && matchesStatus && matchesProgress;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / perPage);
  const startIndex = (page - 1) * perPage;
  const paginated = filtered.slice(startIndex, startIndex + perPage);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Project Roadmap</h1>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center mb-6 bg-white shadow-sm p-4 rounded-xl">
        <input type="date" className="border rounded-lg px-3 py-2" />
        <input type="date" className="border rounded-lg px-3 py-2" />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2"
        >
          <option value="All">Status: All</option>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>

        <select
          value={progressFilter}
          onChange={(e) => {
            setProgressFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2"
        >
          <option value="All">Progress: All</option>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <button
          onClick={() => setShowFilters(true)}
          className="ml-auto flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50 hover:bg-gray-100"
        >
          <Filter size={16} /> More Filters
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center mb-4">
        <div className="relative w-72">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg pl-10 pr-3 py-2 w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-gray-600 text-sm">
            <tr>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Project Name</th>
              <th className="p-3 text-left">Members</th>
              <th className="p-3 text-left">Start Date</th>
              <th className="p-3 text-left">Deadline</th>
              <th className="p-3 text-left">Client</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50 text-sm">
                <td className="p-3">{p.code}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3">
                  <div className="flex -space-x-2">
                    {p.members.slice(0, 3).map((m, i) => (
                      <img
                        key={i}
                        src={m}
                        alt="member"
                        className="w-8 h-8 rounded-full border"
                      />
                    ))}
                    {p.members.length > 3 && (
                      <span className="w-8 h-8 flex items-center justify-center text-xs bg-gray-200 rounded-full border">
                        +{p.members.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3">{p.startDate}</td>
                <td
                  className={`p-3 ${
                    p.deadline === "22/08/2025"
                      ? "text-red-500 font-semibold"
                      : ""
                  }`}
                >
                  {p.deadline}
                </td>
                <td className="p-3 flex items-center gap-2">
                  <img
                    src={p.client.avatar}
                    alt={p.client.name}
                    className="w-8 h-8 rounded-full border"
                  />
                  <div>
                    <div className="font-medium">{p.client.name}</div>
                    <div className="text-xs text-gray-500">
                      {p.client.company}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          p.progress === 100
                            ? "bg-green-500"
                            : p.progress > 0
                              ? "bg-yellow-400"
                              : "bg-gray-400"
                        }`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="text-xs">{p.progress}%</span>
                  </div>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => router.push(`/roadmap/${p.id}`)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
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
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded disabled:opacity-50"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
