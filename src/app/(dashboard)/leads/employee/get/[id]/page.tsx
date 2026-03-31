"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

interface EmployeeMeta {
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  profileUrl?: string;
}

interface LeadDetail {
  id: number;
  name: string;
  email: string;
  clientCategory: string;
  leadSource: string;
  leadOwner: string;
  addedBy: string;
  companyName: string;
  mobileNumber: string;
  city: string;
  country: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createDeal: boolean;
  autoConvertToClient: boolean;
  leadOwnerMeta?: EmployeeMeta;
  addedByMeta?: EmployeeMeta;
  notes?: any[];
  deals?: any[];
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeadDetail = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No access token found. Please log in.");
          return;
        }

        const res = await fetch(`/api/leads/employee/get/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch lead details");
        const data = await res.json();
        setLead(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLeadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg font-semibold">
        Loading lead details...
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6 text-red-500 text-center">
        Error: {error || "Lead not found"}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{lead.name}</h1>
      <p className="text-gray-600 mb-6">{lead.email}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-4 border rounded-xl bg-white shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Lead Details</h2>
          <div className="space-y-1 text-sm text-gray-700">
            <p>
              <span className="font-medium">Company:</span> {lead.companyName}
            </p>
            <p>
              <span className="font-medium">Category:</span>{" "}
              {lead.clientCategory}
            </p>
            <p>
              <span className="font-medium">Source:</span> {lead.leadSource}
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  lead.status === "OPEN"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {lead.status}
              </span>
            </p>
            <p>
              <span className="font-medium">City:</span> {lead.city},{" "}
              {lead.country}
            </p>
            <p>
              <span className="font-medium">Mobile:</span>{" "}
              {lead.mobileNumber || "—"}
            </p>
            <p>
              <span className="font-medium">Created:</span>{" "}
              {new Date(lead.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-4 border rounded-xl bg-white shadow-sm">
          <h2 className="font-semibold text-lg mb-2">Owner & Added By</h2>

          <div className="flex items-center gap-3 mb-3">
            {lead.leadOwnerMeta?.profileUrl ? (
              <Image
                src={lead.leadOwnerMeta.profileUrl}
                alt={lead.leadOwnerMeta.name}
                width={50}
                height={50}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-[50px] h-[50px] bg-gray-200 rounded-full" />
            )}
            <div>
              <p className="font-medium">{lead.leadOwnerMeta?.name}</p>
              <p className="text-xs text-gray-500">
                {lead.leadOwnerMeta?.designation} —{" "}
                {lead.leadOwnerMeta?.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lead.addedByMeta?.profileUrl ? (
              <Image
                src={lead.addedByMeta.profileUrl}
                alt={lead.addedByMeta.name}
                width={50}
                height={50}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-[50px] h-[50px] bg-gray-200 rounded-full" />
            )}
            <div>
              <p className="font-medium">{lead.addedByMeta?.name}</p>
              <p className="text-xs text-gray-500">
                {lead.addedByMeta?.designation} —{" "}
                {lead.addedByMeta?.department}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 border rounded-xl bg-white shadow-sm">
        <h2 className="font-semibold text-lg mb-2">Additional Info</h2>
        <p>
          <span className="font-medium">Create Deal:</span>{" "}
          {lead.createDeal ? "Yes" : "No"}
        </p>
        <p>
          <span className="font-medium">Auto Convert to Client:</span>{" "}
          {lead.autoConvertToClient ? "Yes" : "No"}
        </p>
      </div>
    </div>
  );
}
