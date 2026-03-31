
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

import OverviewSection from "./components/OverviewSection";
import InvoicesSection from "./components/InvoicesSection";
import PaymentsSection from "./components/PaymentsSection";
import FilesSection from "./components/FilesSection";
import NotesSection from "./components/NotesSection";
import ActivitySection from "./components/ActivitySection";
import DiscussionSection from "./components/DiscussionSection";

const MAIN = process.env.NEXT_PUBLIC_MAIN || "";

type TabKey =
  | "overview"
  // | "invoices"
  // | "payments"
  | "files"
  | "notes"
  | "activity"
  | "discussion";

export default function ProjectDetailsPage() {
  const params = useParams() as { id: string };
  const projectId = params?.id;

  const [project, setProject] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // ---------------- FETCH PROJECT ----------------
  useEffect(() => {
    if (!projectId) return;

    const token = localStorage.getItem("accessToken") || "";

    const fetchAll = async () => {
      try {
        const [pRes, mRes] = await Promise.all([
          axios.get(`${MAIN}/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${MAIN}/projects/${projectId}/metrics`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setProject(Array.isArray(pRes.data) ? pRes.data[0] : pRes.data);
        setMetrics(mRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [projectId]);

  if (loading) {
    return <div className="p-8 text-center">Loading project...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-red-500">Project not found</div>;
  }

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* HEADER */}
        <h1 className="text-3xl font-semibold text-gray-800 mb-4">
          {project.name}
        </h1>

        {/* TABS */}
        <div className="bg-white rounded-t-xl border">
          <nav className="flex gap-6 px-6 h-14 items-center">
            {[
              { key: "overview", label: "Overview" },
              // { key: "invoices", label: "Invoices" },
              // { key: "payments", label: "Payments" },
              { key: "files", label: "Files" },
              { key: "notes", label: "Notes" },
              { key: "activity", label: "Activity" },
              { key: "discussion", label: "Discussion" },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabKey)}
                  className={`relative text-sm font-medium py-3 ${isActive ? "text-blue-600" : "text-gray-600"
                    }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute -bottom-3 left-0 w-full h-0.5 bg-blue-500 rounded" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* TAB CONTENT */}
        <div className="bg-white rounded-b-xl border border-t-0 p-6">
          {activeTab === "overview" && (
            <OverviewSection project={project} metrics={metrics} />
          )}

          {activeTab === "files" && (
            <FilesSection projectId={project.id} />
          )}
          {activeTab === "notes" && (
            <NotesSection projectId={project.id} />
          )}
          {activeTab === "activity" && (
            <ActivitySection projectId={project.id} />
          )}
          {activeTab === "discussion" && (
            <DiscussionSection projectId={project.id} />
          )}
        </div>
      </div>
    </div>
  );
}
