
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

  // ------------------------------------------
  // GET Project Members
  // ------------------------------------------
  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/projects/${projectId}`;
      const full = `${MAIN}/api/projects/${projectId}`;
   //   console.log("GET:", full);

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

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  // ------------------------------------------
  // POST Assign Members
  // ------------------------------------------
  const handleAssign = async () => {
    const raw = newMemberInput.trim();
    if (!raw) return alert("Enter employee IDs");

    const employeeIds = raw.split(",").map((x) => x.trim());

    try {
      setLoading(true);
      setError(null);

      const url = `${MAIN}/api/projects/${projectId}/assign`;
   //   console.log("kikikiki", employeeIds);
      await api.post(url, { employeeIds });

      setShowAddModal(false);
      setNewMemberInput("");
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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Member</h2>

      {/* Top Controls */}
      <div className="flex justify-between mb-4">
       

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
            <tr className="bg-blue-50 text-gray-700 text-left">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">User Role</th>
              {/* <th className="px-4 py-3">Action</th> */}
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
                {/* <td className="px-4 py-4">
                 
                  <span className="ml-1">Project Admin</span>

                </td> */}



<td className="px-4 py-4">
  {project?.projectAdminId === m.employeeId ? (
    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
      Admin
    </span>
  ) : (
    <span className="ml-1">--</span>
  )}
</td>




                {/* Remove */}
                {/* <td className="px-4 py-4">
                  <button
                    onClick={() => handleRemove(m.employeeId)}
                    disabled={actionLoadingId === m.employeeId}
                    className="text-red-600"
                  >
                    {actionLoadingId === m.employeeId ? "Removing…" : "Delete"}
                  </button>
                </td> */}
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
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Project Members</h3>

            <input
              className="border px-3 py-2 w-full rounded"
              placeholder="EMP-015, EMP-010"
              value={newMemberInput}
              onChange={(e) => setNewMemberInput(e.target.value)}
            />

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




