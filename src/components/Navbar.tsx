"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "./NotificationBell";

const NAV_ITEMS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/employees/employee": "Dashboard",
  "/leads/admin/get": "Leads",
  "/employees/leads/admin/get": "Leads",
  "/deals/get": "Deals",
  "/deals/stages": "Kanban",
  "/clients": "Client",
  "/work/project": "Project",
  "/employees/work/project": "Project",
  "/work/tasks": "Task",
  "/employees/work/tasks": "Task",
  "/work/timesheet": "Timesheet",
  "/employees/work/timesheet": "Timesheet",
  "/work/roadmap": "Project Roadmap",
  "/employees/work/roadmap": "Project Roadmap",
  "/hr/attendence": "Attendance",
  "/employees/hr/attendence": "Attendance",
  "/hr/employee": "Employee",
  "/hr/leave/admin": "Leave",
  "/employees/hr/leave/admin": "Leave",
  "/hr/holiday": "Holiday",
  "/employees/hr/holiday": "Holiday",
  "/hr/designation": "Designation",
  "/hr/department": "Department",
  "/hr/appreciation": "Appreciation",
  "/employees/hr/appreciation": "Appreciation",
  "/finance/invoices": "Invoices",
  "/finance/credit-notes": "Credit Notes",
  "/messages": "Messages",
  "/employees/messages": "Messages",
  "/settings": "Settings",
  "/settings/company-settings": "Company-settings",
  "/settings/profile-settings": "Profile-settings",
  "/employees/settings/profile-settings": "Profile-settings",
};

interface EmployeeProfile {
  profilePictureUrl?: string;
  name?: string;
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pl", label: "Polski" }, // Polish
  { code: "ru", label: "Русский" }, // Russian
  { code: "lt", label: "Lietuvių" }, // Lithuanian
  { code: "de", label: "Deutsch" }, // German
  { code: "nl", label: "Nederlands" }, // Dutch
];

export const CommonNavbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = NAV_ITEMS[pathname] || "Page";

  const BASE_URL = process.env.NEXT_PUBLIC_MAIN || "";

  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  /* =========================
     Fetch employee profile
  ========================== */
  useEffect(() => {
    const fetchEmployee = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const res = await fetch(`${BASE_URL}/employee/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setEmployee(data);
      } catch (err) {
        console.error("Failed to fetch employee", err);
      }
    };

    fetchEmployee();
  }, [BASE_URL]);

  /* =========================
     Language change (Google Translate)
  ========================== */
  const handleLanguageChange = (lang: string) => {
    const select = document.querySelector(
      ".goog-te-combo",
    ) as HTMLSelectElement;

    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
    }

    setLangOpen(false);
  };

  /* =========================
     Logout
  ========================== */
  const handleLogout = () => {
    if (!confirm("Are you sure you want to logout?")) return;

    localStorage.clear();
    router.push("/login");
  };

  /* =========================
     Outside click close
  ========================== */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
        setLangOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
      <div className="flex h-14 items-center justify-between">
        {/* ================= LEFT ================= */}
        <div className="flex items-center">
          <div className="flex items-center justify-center bg-[#15173a] h-14 w-64">
            <span className="text-white text-2xl font-bold">Qurilo</span>
          </div>

          <div className="pl-6">
            <h2 className="text-lg font-medium text-gray-800">{pageTitle}</h2>
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-3 pr-6 relative" ref={menuRef}>
          {/* Bell */}
          <NotificationBell />

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100"
            >
              🌐 Language
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 bg-white border shadow rounded-md w-36 z-50">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLanguageChange(l.code)}
                    className="block w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Avatar */}
          <div
            onClick={() => setOpenMenu(!openMenu)}
            className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-gray-100 cursor-pointer"
          >
            <img
              src={employee?.profilePictureUrl || "/avatar.png"}
              alt="avatar"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Logout Dropdown */}
          {openMenu && (
            <div className="absolute top-12 right-0 bg-white shadow rounded-md px-4 py-2 w-32 border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-black"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
