
"use client";

import { useEffect, useMemo, useState } from "react";

type Project = {
  id: number;
  companyFiles?: { taskId?: number | null }[];
};

type HoursResponse = {
  totalMinutes: number;
  totalHours: number;
};

export default function EmployeeStats({ employeeId }: { employeeId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [hours, setHours] = useState<HoursResponse | null>(null);
  const [loading, setLoading] = useState(true);
 const employeeIdd = employeeId.employeeId;
  useEffect(() => {
    if (!employeeId) return;

    const loadStats = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");

        const [projectsRes, hoursRes] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_MAIN}/api/projects/employee/${employeeIdd}`,
            { 
                 headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,     
                    },

                }

          ),
          fetch(
            `${process.env.NEXT_PUBLIC_MAIN}/timesheets/employee/${employeeIdd}/hours`,
            {  headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,     
                    },

                }
          ),
        ]);

        if (!projectsRes.ok || !hoursRes.ok)
          throw new Error("Failed to load employee stats");

        const projectsData = await projectsRes.json();
        const hoursData = await hoursRes.json();

        setProjects(projectsData || []);
        setHours(hoursData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [employeeId]);

  /* ---------- Calculations ---------- */

  const totalProjects = projects.length;

  const totalTasks = useMemo(() => {
    const taskSet = new Set<number>();
    projects.forEach((p) =>
      p.companyFiles?.forEach((f) => {
        if (f.taskId) taskSet.add(f.taskId);
      })
    );
    return taskSet.size;
  }, [projects]);

  const totalHours = hours?.totalHours ?? 0;

  if (loading) {
    return (
      <div className="mt-4 text-sm text-muted-foreground">
        Loading employee stats…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
      {[
        { label: "Projects", value: totalProjects },
        { label: "Tasks", value: totalTasks },
        { label: "Hours Logged", value: totalHours },
      ].map((item) => (
        <div key={item.label} className="border rounded-lg p-4 bg-white">
          <p className="text-sm text-gray-500">{item.label}</p>
          <p className="text-xl font-semibold text-blue-600">
            {typeof item.value === "number"
              ? item.value.toString().padStart(2, "0")
              : item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
