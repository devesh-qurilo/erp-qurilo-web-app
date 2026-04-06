"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ClipboardList,
  Clock,
  Map,
  Building,
  CalendarCheck,
  CalendarX,
  CalendarDays,
  Award,
  MessageSquare,
  Notebook,
} from "lucide-react";
import AttendanceCalendar from "@/app/(dashboard)/hr/attendence/components/AttendanceCalendar";

export function EAppSidebar() {
  // track which groups are open; keys correspond to group labels
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    leads: false,
    client: false,
    work: false,
    hr: false,
    finance: false,
    settings: false,
  });

  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const Chevron = ({ open }: { open: boolean }) => (
    <span className="ml-2  text-sidebar-foreground/60">{open ? "▾" : ">"}</span>
  );

  useEffect(() => {
    setOpenGroups({
      leads: pathname.startsWith("/employees/leads"),
      client: false,
      work: pathname.startsWith("/employees/work"),
      hr: pathname.startsWith("/employees/hr"),
      finance: false,
      settings: pathname.startsWith("/employees/settings"),
    });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#15173a]  text-white">
      <Sidebar className="#211C52">
        <SidebarHeader>
          <div className="flex items-center justify-center  px-1 ">
            <h1 className="text-2xl font-bold text-sidebar-primary">Qurilo</h1>
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-[#15173a] text-white">
          {/* Dashboard */}
          <SidebarGroup className=" text-white">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  {/* <Link href="/employees/employee"> */}

                  <Link
                    href="/employees/employee"
                    className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                      isActive("/employees/employee")
                        ? "bg-white text-black font-semibold"
                        : "text-white"
                    }`}
                  >
                    <LayoutDashboard className="size-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* <SidebarMenu> */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              {/* <Link href="/employees/leads/admin/get"> */}

              <Link
                href="/employees/leads/admin/get"
                className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                  isActive("/employees/leads/admin/get")
                    ? "bg-white text-black font-semibold"
                    : "text-white"
                }`}
              >
                <Users className="size-5" />
                <span>Leads</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Work (collapsible) */}
          <SidebarGroup>
            <div
              role="button"
              className="flex items-center justify-between w-full cursor-pointer px-3"
              onClick={() => toggleGroup("work")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleGroup("work");
              }}
              tabIndex={0}
              aria-expanded={!!openGroups.work}
            >
              <SidebarGroupLabel className=" text-white">
                Work
              </SidebarGroupLabel>
              <Chevron open={!!openGroups.work} />
            </div>

            {openGroups.work ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/employees/work/project"> */}

                    <Link
                      href="/employees/work/project"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                        isActive("/employees/work/project")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                      }`}
                    >
                      <ClipboardList className="size-5" />
                      <span>Project</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/employees/work/tasks"> */}

                    <Link
                      href="/employees/work/tasks"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                        isActive("/employees/work/tasks")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                      }`}
                    >
                      <ClipboardList className="size-5" />
                      <span>Task</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/employees/work/timesheet"> */}

                    <Link
                      href="/employees/work/timesheet"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                        isActive("/employees/work/timesheet")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                      }`}
                    >
                      <Clock className="size-5" />
                      <span>Timesheet</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/employees/work/roadmap"> */}
                    <Link
                      href="/employees/work/roadmap"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                        isActive("/employees/work/roadmap")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                      }`}
                    >
                      <Map className="size-5" />
                      <span>Project Roadmap</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : null}
          </SidebarGroup>

          {/* HR (collapsible) */}
          <SidebarGroup>
            <div
              role="button"
              className="flex items-center justify-between w-full cursor-pointer px-3"
              onClick={() => toggleGroup("hr")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleGroup("hr");
              }}
              tabIndex={0}
              aria-expanded={!!openGroups.hr}
            >
              <SidebarGroupLabel className=" text-white">HR</SidebarGroupLabel>
              <Chevron open={!!openGroups.hr} />
            </div>

            {openGroups.hr ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/employees/hr/attendence"> */}

                    <Link
                      href="/employees/hr/attendence"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                        isActive("/employees/hr/attendence")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                      }`}
                    >
                      <Notebook className="size-5" />
                      <span>Attendance</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/employees/hr/leave/admin"> */}

                    <Link
                      href="/employees/hr/leave/admin"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                        isActive("/employees/hr/leave/admin")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                      }`}
                    >
                      <CalendarX className="size-5" />
                      <span>Leave</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/employees/hr/holiday"> */}

                    <Link
                      href="/employees/hr/holiday"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                        isActive("/employees/hr/holiday")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                      }`}
                    >
                      <CalendarDays className="size-5" />
                      <span>Holiday</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/employees/hr/appreciation"> */}
                    <Link
                      href="/employees/hr/appreciation"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                        isActive("/employees/hr/appreciation")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                      }`}
                    >
                      <Award className="size-5" />
                      <span>Appreciation</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : null}
          </SidebarGroup>

          {/* Finance (collapsible) */}

          {/* Messages */}
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  {/* <Link href="/employees/messages"> */}

                  <Link
                    href="/employees/messages"
                    className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                      isActive("/employees/messages")
                        ? "bg-white text-black font-semibold"
                        : "text-white"
                    }`}
                  >
                    <MessageSquare className="size-5" />
                    <span>Message</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              {/* <Link href="/employees/settings/profile-settings"> */}
              <Link
                href="/employees/settings/profile-settings"
                className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                  isActive("/employees/settings/profile-settings")
                    ? "bg-white text-black font-semibold"
                    : "text-white"
                }`}
              >
                <CalendarX className="size-5" />
                <span>Profile Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarContent>

        <SidebarFooter className="bg-[#15173a] text-white">
          <div className="p-4 text-xs text-white text-sidebar-foreground/60 text-center border-t border-sidebar-border">
            © 2025 Qurilo
          </div>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
