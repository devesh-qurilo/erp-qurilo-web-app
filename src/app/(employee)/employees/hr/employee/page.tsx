
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Employee {
  employeeId: string;
  name: string;
  email: string;
  departmentName: string | null;
  designationName: string | null;
  role: string;
  skills: string[];
  active: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_MAIN;

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  // pagination
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(0);

  // invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);


  /* ================= FETCH EMPLOYEES ================= */
  useEffect(() => {
    const fetchEmployees = async () => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${BASE_URL}/employee?page=0&size=20000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEmployees(data.content);
      setLoading(false);
    };
    fetchEmployees();
  }, []);

  /* ================= INVITE API ================= */
  const sendInvite = async () => {
    if (!inviteEmail) {
      alert('Email is required');
      return;
    }

    setInviteLoading(true);
    try {
      const token = localStorage.getItem('accessToken');

      const res = await fetch(`${BASE_URL}/employee/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: inviteEmail,
          message: inviteMessage,
        }),
      });

      if (!res.ok) throw new Error('Failed to send invite');

      setInviteOpen(false);
      setInviteEmail('');
      setInviteMessage('');
      alert('Invitation sent successfully');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  /* ================= FILTER LOGIC ================= */
  const filtered = employees.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      status === 'all' ||
      (status === 'active' && e.active) ||
      (status === 'inactive' && !e.active);

    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const data = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <div className="p-6">Loading...</div>;


  const deleteEmployee = async (id: string) => {
    // if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${BASE_URL}/employee/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      setEmployees((prev) => prev.filter((e) => e.employeeId !== id));
    } catch {
      alert('Failed to delete employee');
    }
  };


  return (
    <div className="p-6 space-y-6">

      {/* ================= FILTER ================= */}
      <div className="bg-white rounded-lg border p-4 flex gap-4">
        <input
          placeholder="Search employee..."
          className="border px-3 py-2 rounded w-64"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />

        <select
          className="border px-3 py-2 rounded"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Employees</h1>

        <div className="flex gap-3">
          <Link
            href="/hr/employee/new"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + Add Employee
          </Link>

          <button
            onClick={() => setInviteOpen(true)}
            className="border px-4 py-2 rounded"
          >
            + Invite Employee
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Employee ID</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Designation</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((e) => (
              <tr key={e.employeeId} className="border-t">
                <td className="p-3">{e.employeeId}</td>
                <td className="p-3">{e.name}</td>
                <td className="p-3">{e.email}</td>
                <td className="p-3">{e.departmentName || '—'}</td>
                <td className="p-3">{e.designationName || '—'}</td>
                <td className="p-3">{e.role}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs rounded ${e.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {e.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === e.employeeId ? null : e.employeeId
                      )
                    }
                    className="px-2 py-1 rounded hover:bg-gray-100"
                  >
                    ⋮
                  </button>

                  {openMenuId === e.employeeId && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border rounded-lg shadow-lg z-50">
                      <Link
                        href={`/hr/employee/${e.employeeId}`}
                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => setOpenMenuId(null)}
                      >
                        View
                      </Link>

                      <Link
                        href={`/hr/employee/${e.employeeId}/edit`}
                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => {

                          setOpenMenuId(null);
                          deleteEmployee(e.employeeId);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= INVITE MODAL ================= */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-xl p-6 relative">
            <button
              onClick={() => setInviteOpen(false)}
              className="absolute right-4 top-4 text-gray-400 text-xl"
            >
              ×
            </button>

            <h2 className="text-xl font-semibold mb-3">Invite Employee</h2>

            <div className="border rounded p-3 text-sm text-gray-600 mb-4">
              Employees will receive an email to log in and update their profile through the self-service portal.
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email *</label>
                <input
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  className="w-full border rounded px-3 py-2 mt-1"
                  rows={4}
                  placeholder="Add a message (optional)"
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                />
              </div>

              <div className="flex justify-center mt-6">
                <button
                  disabled={inviteLoading}
                  onClick={sendInvite}
                  className="bg-blue-600 text-white px-8 py-2 rounded-lg"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
