"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Lead {
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
  leadOwnerMeta?: {
    employeeId: string;
    name: string;
    designation: string;
    department: string;
    profileUrl?: string;
  };
  addedByMeta?: {
    employeeId: string;
    name: string;
    designation: string;
    department: string;
    profileUrl?: string;
  };
}

export default function EmployeeLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No access token found. Please log in.");
          return;
        }
        const res = await fetch("/api/leads/employee/get", {
            headers: { Authorization: `Bearer ${token}` },
          });
        if (!res.ok) throw new Error("Failed to fetch leads");
        const data = await res.json();
        setLeads(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg font-semibold">
        Loading leads...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Employee Leads</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="p-4 border rounded-2xl shadow-sm hover:shadow-md transition bg-white"
          >
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
                <h2 className="text-lg font-semibold">{lead.name}</h2>
                <p className="text-sm text-gray-600">{lead.email}</p>
              </div>
            </div>

            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <span className="font-medium">Company:</span>{" "}
                {lead.companyName || "—"}
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
                <span className="font-medium">Lead Owner:</span>{" "}
                {lead.leadOwnerMeta?.name || lead.leadOwner}
              </p>
              <p>
                <span className="font-medium">Added By:</span>{" "}
                {lead.addedByMeta?.name || lead.addedBy}
              </p>
              <Link href={`/leads/employee/get/${lead.id}`} className="text-blue-600 underline">
  View Details
</Link>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
