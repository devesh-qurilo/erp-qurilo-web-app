// app/hr/leave/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Leave {
  id: number;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  durationType: string;
  startDate: string | null;
  endDate: string | null;
  singleDate: string | null;
  reason: string;
  status: string;
  rejectionReason: string | null;
  approvedByName: string | null;
  isPaid: boolean;
  approvedAt: string | null;
  rejectedAt: string | null;
  documentUrls: string[];
  createdAt: string;
  updatedAt: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_MAIN;

export default function LeaveDetail() {
  const params = useParams();
  const id = params.id as string;
  const [leave, setLeave] = useState<Leave | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeave = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No access token found.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${BASE_URL}/employee/api/leaves/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch leave details.");
        }

        const data = await res.json();
        setLeave(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLeave();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !leave) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">{error || "Leave not found."}</p>
        </div>
        <Link
          href="/hr/leaves"
          className="block text-center mt-4 text-blue-600 hover:underline"
        >
          Back to Leaves List
        </Link>
      </div>
    );
  }

  // Get display dates
  const getDisplayDates = () => {
    if (leave.singleDate) {
      return leave.singleDate;
    }
    if (leave.startDate && leave.endDate) {
      return `${leave.startDate} to ${leave.endDate}`;
    }
    return "N/A";
  };

  // Get status color class
  const getStatusClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Leave Details</h1>
        <Link
          href="/employees/hr/leave/admin"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Back to List
        </Link>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Employee
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {leave.employeeName}
            </p>
            <p className="text-sm text-gray-500">{leave.employeeId}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Leave Type
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {leave.leaveType}
            </p>
            <p className="text-sm text-gray-500">{leave.durationType}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Dates
          </label>
          <p className="text-lg text-gray-900">{getDisplayDates()}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Reason
          </label>
          <p className="text-gray-900">{leave.reason}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Status
          </label>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(
              leave.status,
            )}`}
          >
            {leave.status}
          </span>
        </div>

        {leave.status === "REJECTED" && leave.rejectionReason && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Rejection Reason
            </label>
            <p className="text-red-600">{leave.rejectionReason}</p>
            {leave.rejectedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Rejected at: {new Date(leave.rejectedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {leave.status === "APPROVED" && (
          <div>
            {leave.approvedByName && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Approved By
                </label>
                <p className="text-green-600">{leave.approvedByName}</p>
              </div>
            )}
            {leave.approvedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Approved At
                </label>
                <p className="text-xs text-gray-500">
                  {new Date(leave.approvedAt).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Paid
              </label>
              <p className={leave.isPaid ? "text-green-600" : "text-red-600"}>
                {leave.isPaid ? "Yes" : "No"}
              </p>
            </div>
          </div>
        )}

        {leave.documentUrls.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Documents
            </label>
            <ul className="space-y-1">
              {leave.documentUrls.map((url, index) => (
                <li key={index}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Document {index + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <label>Created At</label>
            <p>{new Date(leave.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <label>Updated At</label>
            <p>{new Date(leave.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
