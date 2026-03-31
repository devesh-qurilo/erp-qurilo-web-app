
"use client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { UserIcon } from "@heroicons/react/24/outline";

type AssignedEmployee = {
  employeeId: string;
  name: string;
  profileUrl?: string | null;
  designation?: string | null;
  department?: string | null;
};

type Project = {
  id: number;
  shortCode?: string;
  name?: string;
  assignedEmployees?: AssignedEmployee[];
  assignedEmployeeIds?: string[];
  projectAdminId?: string | null;
};

const MAIN = process.env.NEXT_PUBLIC_MAIN || "";

// ------------------------------------------
// AXIOS INSTANCE SETUP
// ------------------------------------------
const api = axios.create({
  baseURL: MAIN || "/", // if MAIN empty → use Next.js API routes
  timeout: 15000,
});

// Auto-add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-handle JSON + errors
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err?.response?.data?.message ||
      err?.response?.statusText ||
      err.message ||
      "Request failed";
    return Promise.reject(new Error(message));
  }
);

export default function ProjectMembersTableFetch({
  projectId,
}: {
  projectId: number;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<AssignedEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberInput, setNewMemberInput] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [employees, setEmployees] = useState<AssignedEmployee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);


  // ------------------------------------------
  // GET Project Members
  // ------------------------------------------
  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/projects/${projectId}`;
      const full = `${MAIN}/api/projects/${projectId}`;
      // console.log("GET:", full);

      const data = await api.get(full);

      setProject(data);
      setMembers(data?.assignedEmployees ?? []);
    } catch (err: any) {
      setError(err.message);
      setProject(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };





  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const res = await fetch(`${MAIN}/employee/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Employees API failed ${res.status}`);
      }

      const data = await res.json();

      setEmployees(
        (data || []).map((e: any) => ({
          employeeId: e.employeeId,
          name: e.name,
          profileUrl: e.profilePictureUrl ?? null,
        }))
      );
    } catch (err: any) {
      console.error("Failed to load employees:", err.message);
    }
  };



  useEffect(() => {
    fetchEmployees();
  }, []);



  useEffect(() => {
    fetchProject();
  }, [projectId]);

  // ------------------------------------------
  // POST Assign Members
  // ------------------------------------------



  const handleAssign = async () => {
    if (selectedEmployees.length === 0) {
      return alert("Select employees");
    }

    try {
      setLoading(true);

      await api.post(`/api/projects/${projectId}/assign`, {
        employeeIds: selectedEmployees,
      });

      setSelectedEmployees([]);
      setDropdownOpen(false);
      setShowAddModal(false);

      fetchProject();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  // ------------------------------------------
  // DELETE Member
  // ------------------------------------------
  const handleRemove = async (employeeId: string) => {
    if (!confirm(`Remove ${employeeId}   from project?`)) return;

    try {
      setActionLoadingId(employeeId);
      setError(null);

      const url = `${MAIN}/api/projects/${projectId}/assign/${employeeId}`;

      await api.delete(url);

      // If admin removed → clear admin role
      if (project?.projectAdminId === employeeId) {
        await api.patch(`${MAIN}/api/projects/${projectId}`, {
          projectAdminId: null,
        });
      }

      fetchProject();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMakeAdmin = async (employeeId: string) => {
    if (!confirm(`Make ${employeeId} Project Admin?`)) return;

    try {
      setActionLoadingId(employeeId);
      setError(null);

      const url = `${MAIN}/projects/${projectId}/admin?userId=${employeeId}`;

      await api.post(url);

      fetchProject();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ------------------------------------------
  // REMOVE Project Admin Only
  // ------------------------------------------
  const handleRemoveAdmin = async () => {
    if (!confirm("Remove Project Admin?")) return;

    try {
      setActionLoadingId("admin");
      setError(null);

      const url = `${MAIN}/projects/${projectId}/admin`;

      await api.delete(url);

      fetchProject();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ------------------------------------------
  // SEARCH FILTER
  // ------------------------------------------
  const filtered = members.filter((m) => {
    const t = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(t) ||
      m.employeeId.toLowerCase().includes(t) ||
      m.designation?.toLowerCase().includes(t)
    );
  });

  // ------------------------------------------
  // UI
  // ------------------------------------------

  return (

    // <div className="bg-white rounded-xl border border-gray-200 p-6">

    <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit  self-start">
      <h2 className="text-xl font-semibold mb-4">Member</h2>

      {/* Top Controls */}
      <div className="flex justify-between mb-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Project Members
        </button>

        <div className="flex gap-3">
          <input
            type="search"
            placeholder="Search"
            className="border px-3 py-2 rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={fetchProject}
            className="bg-gray-100 px-3 py-2 rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-5">Loading…</div>}

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded mb-3">{error}</div>
      )}

      {!loading && (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-blue-50 text-left ">
              <th className="px-4 py-3 ">Name</th>
              <th className="px-4 py-3">User Role</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((m) => (
              <tr key={m.employeeId} className="border-b">
                <td className="px-4 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {m.profileUrl ? (
                      <img
                        src={m.profileUrl}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-gray-500">
                      {m.designation ?? m.department}
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-4 py-4">
                  {/* <div className="flex items-center gap-2 text-sm"> */}
                  <input
                    type="radio"
                    checked={project?.projectAdminId === m.employeeId}
                    onChange={() => handleMakeAdmin(m.employeeId)}
                  />
                  <span className="ml-1">Project Admin</span>

                  {project?.projectAdminId === m.employeeId && (
                    <button
                      onClick={() => handleRemoveAdmin()}
                      disabled={actionLoadingId}
                      className="ml-3 px-3 py-1 border rounded text-sm bg-white"
                    >
                      {actionLoadingId ? "Removing..." : "Remove Admin"}
                    </button>
                  )}
                </td>

                {/* Remove */}
                <td className="px-4 py-4">
                  <button
                    onClick={() => handleRemove(m.employeeId)}
                    disabled={actionLoadingId === m.employeeId}
                    className="text-red-600"
                  >
                    {actionLoadingId === m.employeeId ? "Removing…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-gray-500">
                  No members found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          {/* <div className="bg-white p-6 rounded w-full max-w-md"> */}
          <div className="bg-white p-6 rounded w-full max-w-md relative">
            <h3 className="text-lg font-semibold mb-4">Add Project Members</h3>







            <div className="relative w-full">
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="border px-3 py-2 rounded cursor-pointer bg-white"
              >
                {selectedEmployees.length === 0
                  ? "Select Project Members"
                  : `${selectedEmployees.length} members selected`}
              </div>

              {dropdownOpen && (
                <div className="absolute left-0 mt-1 w-full max-h-60 overflow-auto border bg-white rounded shadow-lg z-[9999]">
                  {employees.length === 0 && (
                    <div className="p-3 text-gray-500 text-sm">
                      No employees found
                    </div>
                  )}

                  {employees.map((emp) => {
                    const checked = selectedEmployees.includes(emp.employeeId);

                    return (
                      <div
                        key={emp.employeeId}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          if (checked) {
                            setSelectedEmployees((prev) =>
                              prev.filter((id) => id !== emp.employeeId)
                            );
                          } else {
                            setSelectedEmployees((prev) => [
                              ...prev,
                              emp.employeeId,
                            ]);
                          }
                        }}
                      >
                        <input type="checkbox" checked={checked} readOnly />

                        <span>
                          {emp.name} ({emp.employeeId})
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Members Chips */}
            {selectedEmployees.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedEmployees.map((id) => {
                  const emp = employees.find((e) => e.employeeId === id);

                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                    >
                      {emp?.name ?? id}

                      <button
                        className="ml-1 text-red-500"
                        onClick={() =>
                          setSelectedEmployees((prev) =>
                            prev.filter((x) => x !== id)
                          )
                        }
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}




            <div className="text-xs text-gray-500 mt-1">
              Example: EMP-015, EMP-010
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleAssign}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




