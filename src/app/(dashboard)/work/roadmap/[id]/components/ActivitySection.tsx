


"use client";

import { useEffect, useState } from "react";

/* ================= TYPES ================= */
type ActivityItem = {
  id: number;
  projectId: number;
  actorEmployeeId: string;
  action: string;
  metadata?: string | null;
  createdAt: string;
};

const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`;

/* ================= HELPERS ================= */
function formatDateParts(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString("en-US", { day: "2-digit" }),
    month: d.toLocaleDateString("en-US", { month: "short" }),
    time: d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function getActionText(action: string) {
  switch (action) {
    case "PROJECT_FILE_UPLOADED":
      return "New file uploaded to the project.";
    case "FILE_DELETED":
      return "File deleted from the project.";
    case "PROJECT_NOTE_CREATED":
      return "New note added to the project.";
    case "PROJECT_NOTE_UPDATED":
      return "Project note updated.";
    case "TASK_CREATED":
      return "New task created.";
    case "TASK_UPDATED":
      return "Task updated.";
    case "TASK_DELETED":
      return "Task deleted.";
    case "TASK_STATUS_CHANGED":
      return "Task status changed.";
    case "TASK_FILE_UPLOADED":
      return "File uploaded to a task.";
    case "TIMELOG_CREATED":
      return "Time logged on the project.";
    case "TIMELOG_UPDATED":
      return "Time log updated.";
    case "TIMELOG_DELETED":
      return "Time log deleted.";
    case "PROJECT_ASSIGNED_EMPLOYEES_ADDED":
      return "Employee assigned to the project.";
    case "DISCUSSION_ROOM_CREATED":
      return "Discussion room created.";
    case "DISCUSSION_MESSAGE_DELETED":
      return "Discussion message deleted.";
    case "PROJECT_CREATED":
      return "Project created.";
    default:
      return action.replaceAll("_", " ").toLowerCase();
  }
}

/* ================= COMPONENT ================= */
export default function ActivitySection({
  projectId,
}: {
  projectId: number;
}) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const load = async () => {
      try {
        setLoading(true);

        // ✅ TOKEN FETCH (same as other sections)
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("authToken") ||
          "";

        const res = await fetch(
          `${BASE_URL}/projects/${projectId}/activity`,
          {
            cache: "no-store",
            // headers: {
            //   "Content-Type": "application/json",
            //   Authorization: token ? `Bearer ${token}` : "",
            // },

             headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          }
        );

        // ✅ SAFE PARSE
        const text = await res.text();
        const data = text ? JSON.parse(text) : [];

        setActivities(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load activity", e);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId]);

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Activity</h3>

      <div className="border rounded-md overflow-hidden">
        {loading && (
          <div className="p-6 text-center text-gray-400">
            Loading activity…
          </div>
        )}

        {!loading && activities.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No activity found
          </div>
        )}

        {!loading &&
          activities.map((item) => {
            const { day, month, time } = formatDateParts(item.createdAt);

            return (
              <div
                key={item.id}
                className="flex gap-4 p-4 border-b last:border-b-0"
              >
                {/* DATE BOX */}
                <div className="w-14 border rounded-md text-center overflow-hidden">
                  <div className="text-xs text-gray-500 border-b py-1">
                    {month}
                  </div>
                  <div className="text-lg font-semibold py-2">
                    {day}
                  </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1">
                  <div className="text-sm text-gray-800">
                    {getActionText(item.action)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {time}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
