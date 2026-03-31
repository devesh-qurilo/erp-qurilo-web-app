"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { createPortal } from "react-dom";
import { useRef } from "react";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// interface Employee {
//   employeeId: string;
//   name: string;
//   email: string;
//   departmentName: string | null;
//   designationName: string | null;
//   role: string;
//   skills: string[];
//   active: boolean;
// }



interface Employee {
  employeeId: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;

  designationName: string | null;

  reportingToName: string | null;

  role: string;
  active: boolean;

  probationEndDate: string | null;
  noticePeriodStartDate: string | null;
  noticePeriodEndDate: string | null;
}



const BASE_URL = process.env.NEXT_PUBLIC_MAIN;

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  // filter drawer
  const [filterOpen, setFilterOpen] = useState(false);

  // image-style filters
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");



  // pagination
  // const PAGE_SIZE = 5;
  // const [page, setPage] = useState(0);

  // invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  /* ================= FETCH EMPLOYEES ================= */
  useEffect(() => {
    const fetchEmployees = async () => {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${BASE_URL}/employee?page=0&size=20000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEmployees(data.content);
      setLoading(false);
    };
    fetchEmployees();
  }, []);




  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenuId]);




  const today = new Date();

  const isOnProbation = (e: Employee) => {
    if (!e.probationEndDate) return false;
    return today <= new Date(e.probationEndDate);
  };

  const isOnNotice = (e: Employee) => {
    if (!e.noticePeriodStartDate || !e.noticePeriodEndDate) return false;

    const start = new Date(e.noticePeriodStartDate);
    const end = new Date(e.noticePeriodEndDate);

    return today >= start && today <= end;
  };




  // dropdown options (table data se)
  const roleOptions = Array.from(
    new Set(employees.map(e => e.role).filter(Boolean))
  );

  const departmentOptions = Array.from(
    new Set(employees.map(e => e.departmentName).filter(Boolean))
  );




  /* ================= INVITE API ================= */
  const sendInvite = async () => {
    if (!inviteEmail) {
      alert("Email is required");
      return;
    }

    setInviteLoading(true);
    try {
      const token = localStorage.getItem("accessToken");

      const res = await fetch(`${BASE_URL}/employee/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: inviteEmail,
          message: inviteMessage,
        }),
      });

      if (!res.ok) throw new Error("Failed to send invite");

      setInviteOpen(false);
      setInviteEmail("");
      setInviteMessage("");
      alert("Invitation sent successfully");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  /* ================= FILTER LOGIC ================= */
  // const filtered = employees.filter((e) => {
  //   const matchSearch =
  //     e.name.toLowerCase().includes(search.toLowerCase()) ||
  //     e.email.toLowerCase().includes(search.toLowerCase()) ||
  //     e.employeeId.toLowerCase().includes(search.toLowerCase());

  //   const matchStatus =
  //     status === "all" ||
  //     (status === "active" && e.active) ||
  //     (status === "inactive" && !e.active);

  //   return matchSearch && matchStatus;
  // });

  const filtered = employees.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && e.active) ||
      (filterStatus === "inactive" && !e.active);

    const matchDepartment =
      filterDepartment === "all" ||
      e.departmentName === filterDepartment;

    const matchRole =
      filterRole === "all" ||
      e.role === filterRole;

    return matchSearch && matchStatus && matchDepartment && matchRole;
  });





  // const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  // const data = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const data = filtered;

  // console.log("Rendered with data:", data);

  // if (loading) return <div className="p-6">Loading...</div>;

  const deleteEmployee = async (id: string) => {
    // if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      //("gggggggkkkk")
      const token = localStorage.getItem("accessToken");
      await fetch(`${BASE_URL}/employee/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setEmployees((prev) => prev.filter((e) => e.employeeId !== id));
    } catch {
      alert("Failed to delete employee");
    }
  };


  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ROLE_EMPLOYEE":
        return "Employee";
      case "ROLE_ADMIN":
        return "Admin";
      default:
        return role;
    }
  };






  const handleRoleChange = async (employeeId: string, newRole: string) => {
    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${BASE_URL}/employee/${employeeId}/role`,
        {
          method: "PATCH", // agar backend PATCH expect karta hai
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      // ✅ UI instant update
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.employeeId === employeeId
            ? { ...emp, role: newRole }
            : emp
        )
      );

      alert("Role updated successfully");
    } catch (error) {
      console.error(error);
      alert("Error updating role");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* ================= FILTER ================= */}
      <div className="bg-white rounded-lg border p-4 flex gap-4">


 {loading ? (
    <>
      <Skeleton width={250} height={40} />
      <Skeleton width={150} height={40} />
      <Skeleton width={120} height={40} />
    </>
  ) : (
    <>


        <input
          placeholder="Search employee... "
          className="border px-3 py-2 rounded w-64"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            // setPage(0);
          }}
        />

        <select
          className="border px-3 py-2 rounded"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            // setPage(0);
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>


        {/* FILTER BUTTON */}
        <button
          onClick={() => setFilterOpen(true)}
          className="border px-4 py-2 rounded flex items-right gap-2 ml-auto"
        >
          🔍 Filters

        </button>
        </>
  )}
    
    
      </div>






      {/* ================= ACTIONS ================= */}
      <div className="flex justify-between items-center">
        {/* <h1 className="text-xl font-semibold">Employees</h1> */}

        {loading ? (
  <Skeleton width={150} height={25} />
) : (
  <h1 className="text-xl font-semibold">Employees</h1>
)}




{loading ? (
  <div className="flex gap-3">
    <Skeleton width={140} height={40} />
    <Skeleton width={140} height={40} />
  </div>
) : (


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
    
    
)}   
    
      </div>

      {/* ================= TABLE ================= */}

      {/* <div className="bg-white border rounded-lg overflow-x-auto"> */}
      <div className="bg-white border rounded-lg relative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Employee ID </th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                {/* <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Designation</th> */}


                <th className="p-3 text-left">Reporting To</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>





            {/* <tbody>
              {data.map((e) => ( */}

              <tbody>
  {loading
    ? Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-t">
          <td className="p-3"><Skeleton width={80} /></td>

          <td className="p-3">
            <div className="flex items-center gap-3">
              <Skeleton circle width={36} height={36} />
              <div>
                <Skeleton width={120} />
                <Skeleton width={80} />
              </div>
            </div>
          </td>

          <td className="p-3"><Skeleton width={150} /></td>
          <td className="p-3"><Skeleton width={100} /></td>

          <td className="p-3">
            <Skeleton width={100} height={30} />
          </td>

          <td className="p-3">
            <Skeleton width={70} height={20} />
          </td>

          <td className="p-3">
            <Skeleton width={30} height={30} />
          </td>
        </tr>
      ))
    : data.map((e) => (
        // 🔥 YOUR EXISTING ROW (NO CHANGE)



                <tr key={e.employeeId} className="border-t">
                  <td className="p-3">{e.employeeId}</td>
                  {/* <td className="p-3">{e.name}</td> */}

                  {/* 
<td className="p-3">
  <div className="flex items-start gap-3">
    
    {/* Avatar */}
                  {/* <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
      {e.name?.charAt(0)}
    </div> */}

                  {/* Name + Designation + Status Badge */}
                  {/* <div>
      <div className="font-medium">{e.name}</div>

      {/* Designation */}
                  {/* {e.designationName && (
        <div className="text-xs text-gray-500">
          {e.designationName}
        </div>
      )} */}

                  {/* Probation / Notice Badge (Example Logic) */}
                  {/* {e.active && (
        <div className="mt-1">
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-700">
            On Probation
          </span>
        </div>
      )}
    </div>
  </div>
</td>  */}





                  <td className="p-3">
                    <div className="flex items-start gap-3">

                      {/* Profile Picture */}
                      {e.profilePictureUrl ? (
                        <img
                          src={e.profilePictureUrl}
                          alt={e.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                          {e.name?.charAt(0)}
                        </div>
                      )}

                      <div>
                        <div className="font-medium">{e.name}</div>

                        {/* Designation */}
                        {e.designationName && (
                          <div className="text-xs text-gray-500">
                            {e.designationName}
                          </div>
                        )}

                        {/* BADGES */}
                        <div className="mt-1 flex gap-2">

                          {isOnProbation(e) && (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-700">
                              On Probation
                            </span>
                          )}

                          {isOnNotice(e) && (
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-orange-100 text-orange-700">
                              On Notice Period
                            </span>
                          )}

                        </div>
                      </div>
                    </div>
                  </td>




                  <td className="p-3">{e.email}</td>
                  {/* <td className="p-3">{e.departmentName || "—"}</td>
                <td className="p-3">{e.designationName || "—"}</td> */}
                  <td className="p-3">{e.reportingToName || "—"}</td>

                  <td className="p-3">
                    <select
                      value={e.role}
                      onChange={(event) => handleRoleChange(e.employeeId, event.target.value)}
                      className="border rounded-md px-2 py-1"
                    >
                      <option value="ROLE_EMPLOYEE">Employee</option>
                      <option value="ROLE_ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${e.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                        }`}
                    >
                      {e.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 relative">
                    {/* <button
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === e.employeeId ? null : e.employeeId
                      )
                    }
                    className="px-2 py-1 rounded hover:bg-gray-100"
                  >
                    ⋮
                  </button> */}




                    <button
                      onClick={(event) => {
                        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

                        if (openMenuId === e.employeeId) {
                          setOpenMenuId(null);
                          setMenuPosition(null);
                          return;
                        }

                        const menuWidth = 160;
                        const menuHeight = 120;

                        let left = rect.right - menuWidth;
                        let top = rect.bottom + 6;

                        // prevent right overflow
                        if (left + menuWidth > window.innerWidth) {
                          left = window.innerWidth - menuWidth - 10;
                        }

                        // prevent bottom overflow
                        if (top + menuHeight > window.innerHeight) {
                          top = rect.top - menuHeight - 6;
                        }

                        setOpenMenuId(e.employeeId);
                        setMenuPosition({ top, left });
                      }}
                      className="px-2 py-1 rounded hover:bg-gray-100"
                    >
                      ⋮
                    </button>


                    {openMenuId === e.employeeId &&
                      menuPosition &&
                      createPortal(
                        <div
                          ref={menuRef}
                          className="fixed w-40 bg-white border rounded-xl shadow-2xl z-[99999] py-1"
                          style={{
                            top: menuPosition.top,
                            left: menuPosition.left,
                          }}
                        >
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
                            onClick={() => setOpenMenuId(null)}
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
                        </div>,
                        document.body
                      )}




                  </td>
                </tr>
              ))}
            </tbody>
         
         
         
         
         
          </table>





        </div>






      </div>




      {/* ================= FILTER DRAWER ================= */}
      {filterOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="bg-white w-full max-w-sm h-full p-6 relative">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setFilterOpen(false)}
                className="text-xl text-gray-400"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">

              {/* Reporting To (future ready – disabled) */}
              <div>
                <label className="text-sm font-medium">Reporting to</label>
                <select
                  disabled
                  className="w-full border rounded px-3 py-2 mt-1 bg-gray-100"
                >
                  <option>All</option>
                </select>
              </div>

              {/* Role */}
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">All</option>
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="text-sm font-medium">Department</label>
                <select
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  <option value="all">All</option>
                  {departmentOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Clear */}
              <div className="pt-6 flex justify-end">
                <button
                  onClick={() => {
                    setFilterRole("all");
                    setFilterDepartment("all");
                    setFilterStatus("all");
                  }}
                  className="border px-6 py-2 rounded text-blue-600"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



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
              Employees will receive an email to log in and update their profile
              through the self-service portal.
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
                  {inviteLoading ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
