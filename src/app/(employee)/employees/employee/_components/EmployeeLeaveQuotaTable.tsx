"use client";

import React, { useEffect, useState } from "react";

type LeaveQuota = {
  id: number;
  leaveType: "CASUAL" | "SICK" | "EARNED";
  totalLeaves: number;
  monthlyLimit: number;
  totalTaken: number;
  remainingLeaves: number;
  overUtilized: number;
};

const BASE_URL =  `${process.env.NEXT_PUBLIC_MAIN}`;

export default function EmployeeLeaveQuotaTable() {
  const [data, setData] = useState<LeaveQuota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveQuota = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const res = await fetch(
          `${BASE_URL}/employee/leave-quota/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch leave quota");

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveQuota();
  }, []);

  const getColorDot = (type: string) => {
    switch (type) {
      case "CASUAL":
        return "bg-blue-500";
      case "SICK":
        return "bg-red-500";
      case "EARNED":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  const formatType = (type: string) =>
    type.charAt(0) + type.slice(1).toLowerCase();

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500">Loading leave quota...</div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="px-4 py-3 font-medium text-sm border-b">
        Leaves Quota
      </div>

      <table className="w-full text-sm">
        <thead className="bg-blue-50 text-gray-700">
          <tr>
            <th className="text-left px-4 py-3 font-medium">
              Leave type
            </th>
            <th className="text-center px-4 py-3 font-medium">
              No. of Leaves
            </th>
            <th className="text-center px-4 py-3 font-medium">
              Monthly Limit
            </th>
            <th className="text-center px-4 py-3 font-medium">
              Total Leaves Taken
            </th>
            <th className="text-center px-4 py-3 font-medium">
              Remaining Leaves
            </th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="border-t last:border-b"
            >
              <td className="px-4 py-3 flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${getColorDot(
                    item.leaveType
                  )}`}
                />
                {formatType(item.leaveType)}
              </td>

              <td className="text-center px-4 py-3">
                {item.totalLeaves.toString().padStart(2, "0")}
              </td>

              <td className="text-center px-4 py-3">
                {item.monthlyLimit ?? "--"}
              </td>

              <td className="text-center px-4 py-3">
                {item.totalTaken ?? "--"}
              </td>

              <td className="text-center px-4 py-3">
                {item.remainingLeaves ?? "--"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
