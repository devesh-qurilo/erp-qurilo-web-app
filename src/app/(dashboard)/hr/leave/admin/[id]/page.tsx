"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useAdminLeaveDetailQuery } from "../api";

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function LeaveDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { data: leave, isLoading, error } = useAdminLeaveDetailQuery(id);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !leave) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="flex h-64 items-center justify-center">
          <p className="text-red-500">{error?.message || "Leave not found."}</p>
        </div>
        <Link
          href="/hr/leave/admin"
          className="mt-4 block text-center text-blue-600 hover:underline"
        >
          Back to Leave List
        </Link>
      </div>
    );
  }

  const getDisplayDates = () => {
    if (leave.singleDate) return formatDate(leave.singleDate);
    if (leave.startDate && leave.endDate)
      return `${formatDate(leave.startDate)} to ${formatDate(leave.endDate)}`;
    return "N/A";
  };

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
    <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Leave Details</h1>
        <Link
          href="/hr/leave/admin"
          className="rounded-md bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
        >
          Back to List
        </Link>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">
              Employee
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {leave.employeeName}
            </p>
            <p className="text-sm text-gray-500">{leave.employeeId}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">
              Leave Type
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {leave.leaveType}
            </p>
            <p className="text-sm text-gray-500">{leave.durationType}</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-500">
            Dates
          </label>
          <p className="text-lg text-gray-900">{getDisplayDates()}</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-500">
            Reason
          </label>
          <p className="text-gray-900">{leave.reason || "N/A"}</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-500">
            Status
          </label>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusClass(
              leave.status,
            )}`}
          >
            {leave.status}
          </span>
        </div>

        {leave.status === "REJECTED" && leave.rejectionReason && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">
              Rejection Reason
            </label>
            <p className="text-red-600">{leave.rejectionReason}</p>
            {leave.rejectedAt && (
              <p className="mt-1 text-xs text-gray-500">
                Rejected at: {new Date(leave.rejectedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {leave.status === "APPROVED" && (
          <div>
            {leave.approvedByName && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">
                  Approved By
                </label>
                <p className="text-green-600">{leave.approvedByName}</p>
              </div>
            )}
            {leave.approvedAt && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-500">
                  Approved At
                </label>
                <p className="text-xs text-gray-500">
                  {new Date(leave.approvedAt).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-500">
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
            <label className="mb-2 block text-sm font-medium text-gray-500">
              Documents
            </label>
            <ul className="space-y-1">
              {leave.documentUrls.map((url, index) => (
                <li key={index}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Document {index + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 text-xs text-gray-500 md:grid-cols-2">
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
