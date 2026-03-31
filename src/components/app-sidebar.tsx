"use client";
import React, { useEffect, useState } from "react";
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
} from "lucide-react";

export function AppSidebar() {
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
      leads: pathname.startsWith("/leads") || pathname.startsWith("/deals"),
      client: pathname.startsWith("/clients"),
      work: pathname.startsWith("/work"),
      hr: pathname.startsWith("/hr"),
      finance: pathname.startsWith("/finance"),
      settings: pathname.startsWith("/settings"),
    });
  }, [pathname]);

  // hhhh
  return (
    <div className="min-h-screen bg-[#15173a]  text-white">
      <Sidebar className="#211C52">
        <SidebarHeader>
          <div className="flex items-center justify-center  px-1 py-6">
            {/* <h1 className="text-2xl font-bold text-sidebar-primary">Skavo</h1> */}
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-[#15173a] text-white">
          {/* Dashboard */}
          <SidebarGroup className=" text-white">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  {/* <Link href="/dashboard">
                    <LayoutDashboard className="size-5" />
                    <span>Dashboard</span>
                  </Link> */}

                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/dashboard")
                        ? "bg-white text-black font-semibold"
                        : "text-white"
                      }`}

                  >
                    <span>Dashboard</span>

                  </Link>


                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* Leads (collapsible) */}
          <SidebarGroup>
            <div
              role="button"
              className="flex items-center justify-between w-full cursor-pointer px-3"
              onClick={() => toggleGroup("leads")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleGroup("leads");
              }}
              tabIndex={0}
              aria-expanded={!!openGroups.leads}
            >
              <SidebarGroupLabel className=" text-white">
                Leads
              </SidebarGroupLabel>
              <Chevron open={!!openGroups.leads} />
            </div>

            {openGroups.leads ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/leads/admin/get">
                      <Users className="size-5" /> */}


                    <Link
                      href="/leads/admin/get"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/leads")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                        }`}
                    ><Users className="size-5" />

                      <span>Leads</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/deals/get"> */}


                    <Link
                      href="/deals/get"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/deals")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                        }`}
                    >

                      <Briefcase className="size-5" />
                      <span>Deals</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : null}
          </SidebarGroup>

          {/* Client (kept as label but made collapsible if needed) */}
          <SidebarGroup>
            <div
              role="button"
              className="flex items-center justify-between w-full cursor-pointer px-3"
              onClick={() => toggleGroup("client")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleGroup("client");
              }}
              tabIndex={0}
              aria-expanded={!!openGroups.client}
            >
              <SidebarGroupLabel className=" text-white">
                Client
              </SidebarGroupLabel>
              <Chevron open={!!openGroups.client} />
            </div>

            {openGroups.client ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/clients"> */}

                    <Link
                      href="/clients"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/clients")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                        }`}
                    >


                      <Building className="size-5" />
                      <span>Client</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : null}
          </SidebarGroup>

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
                    {/* <Link href="/work/project"> */}


                    <Link
                      href="/work/project"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/work/project")
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
                    {/* <Link href="/work/tasks"> */}

                    <Link
                      href="/work/tasks"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/work/tasks")
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
                    {/* <Link href="/work/timesheet"> */}


                    <Link
                      href="/work/timesheet"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/work/timesheet")
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
                    {/* <Link href="/work/roadmap"> */}

                    <Link
                      href="/work/roadmap"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/work/roadmap")
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
                    {/* <Link href="/hr/employee"> */}

                    <Link
                      href="/hr/employee"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/hr/employee")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                        }`}
                    >

                      <Users className="size-5" />
                      <span>Employee</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/hr/attendence"> */}

                    <Link
                      href="/hr/attendence"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/hr/attendence")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                        }`}
                    >

                      <Award className="size-5" />
                      <span>Attandance</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/hr/leave/admin"> */}

                    <Link
                      href="/hr/leave/admin"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/hr/leave/admin")
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
                    {/* <Link href="/hr/holiday"> */}


                    <Link
                      href="/hr/holiday"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/hr/holiday")
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
                    {/* <Link href="/hr/designation"> */}

                    <Link
                      href="/hr/designation"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/hr/designation")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                        }`}
                    >

                      <Briefcase className="size-5" />
                      <span>Designation</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/hr/department"> */}

                    <Link
                      href="/hr/department"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/hr/department")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                        }`}
                    >

                      <Briefcase className="size-5" />
                      <span>Departments</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/hr/appreciation"> */}

                    <Link
                      href="/hr/appreciation"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/hr/appreciation")
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
          <SidebarGroup>
            <div
              role="button"
              className="flex items-center justify-between w-full cursor-pointer px-3"
              onClick={() => toggleGroup("finance")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleGroup("finance");
              }}
              tabIndex={0}
              aria-expanded={!!openGroups.finance}
            >
              <SidebarGroupLabel className=" text-white">
                Finance
              </SidebarGroupLabel>
              <Chevron open={!!openGroups.finance} />
            </div>

            {openGroups.finance ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/finance/invoices"> */}

                    <Link
                      href="/finance/invoices"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/finance/invoices")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                        }`}
                    >


                      <CalendarCheck className="size-5" />
                      <span>Invoices</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/finance/credit-notes"> */}

                    <Link
                      href="/finance/credit-notes"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/finance/credit-notes")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                        }`}
                    >

                      <CalendarX className="size-5" />
                      <span>Credit Notes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : null}
          </SidebarGroup>

          {/* Messages */}
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  {/* <Link href="/messages"> */}

                  <Link
                    href="/messages"
                    className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/messages")
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

          {/* Settings (collapsible) */}
          <SidebarGroup>
            <div
              role="button"
              className="flex items-center justify-between w-full cursor-pointer px-3"
              onClick={() => toggleGroup("settings")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") toggleGroup("settings");
              }}
              tabIndex={0}
              aria-expanded={!!openGroups.settings}
            >
              <SidebarGroupLabel className=" text-white">
                Settings
              </SidebarGroupLabel>
              <Chevron open={!!openGroups.settings} />
            </div>

            {openGroups.settings ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/settings/company-settings"> */}

                    <Link
                      href="/settings/company-settings"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/settings/company-settings")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                        }`}
                    >

                      <CalendarCheck className="size-5" />
                      <span>Company Settings </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    {/* <Link href="/settings/profile-settings"> */}

                    <Link
                      href="/settings/profile-settings"
                      className={`flex items-center gap-2 px-2 py-1 rounded-md ${isActive("/settings/profile-settings")
                          ? "bg-white text-black font-semibold"
                          : "text-white"
                        }`}
                    >

                      <CalendarX className="size-5" />
                      <span>Profile Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : null}
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="bg-[#15173a] text-white">
          <div className="p-4 text-xs text-white text-sidebar-foreground/60 text-center border-t border-sidebar-border">
            © 2025 Skavo
          </div>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
