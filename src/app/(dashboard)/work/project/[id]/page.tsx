"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";

import OverviewSection from "./components/OverviewSection";
import InvoicesSection from "./components/InvoicesSection";
import PaymentsSection from "./components/PaymentsSection";
import FilesSection from "./components/FilesSection";
import NotesSection from "./components/NotesSection";
import ActivitySection from "./components/ActivitySection";
import DiscussionSection from "./components/DiscussionSection";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { fetchProjectById, fetchProjectMetrics } from "../api";
import { useProjectDetailStore } from "./store";

type TabKey =
  | "overview"
  | "invoices"
  | "payments"
  | "files"
  | "notes"
  | "activity"
  | "discussion";

export default function ProjectDetailsPage() {
  const params = useParams() as { id: string };
  const projectId = params?.id;
  const {
    project,
    metrics,
    loading,
    activeTab,
    setProject,
    setMetrics,
    setLoading,
    setActiveTab,
    resetProjectDetailState,
  } = useProjectDetailStore(
    useShallow((state) => ({
      project: state.project,
      metrics: state.metrics,
      loading: state.loading,
      activeTab: state.activeTab,
      setProject: state.setProject,
      setMetrics: state.setMetrics,
      setLoading: state.setLoading,
      setActiveTab: state.setActiveTab,
      resetProjectDetailState: state.resetProjectDetailState,
    })),
  );

  useEffect(() => {
    if (!projectId) return;

    let mounted = true;
    const token = localStorage.getItem("accessToken") || "";

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [projectResponse, metricsResponse] = await Promise.all([
          fetchProjectById(token, projectId),
          fetchProjectMetrics(token, projectId),
        ]);

        if (!mounted) return;

        setProject(Array.isArray(projectResponse) ? projectResponse[0] : projectResponse);
        setMetrics(metricsResponse);
      } catch (error) {
        console.error("Failed to load project details", error);
        if (!mounted) return;
        setProject(null);
        setMetrics(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAll();

    return () => {
      mounted = false;
      resetProjectDetailState();
    };
  }, [projectId, resetProjectDetailState, setLoading, setMetrics, setProject]);

  const clientId = project?.client?.clientId;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <Skeleton width={250} height={30} />
        ) : (
          <h1 className="text-3xl font-semibold text-gray-800 mb-4">
            {project?.name ?? "Project"}
          </h1>
        )}

        {loading ? (
          <div className="bg-white p-4 rounded-t-xl border flex gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} width={80} height={20} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-t-xl border">
            <nav className="flex gap-6 px-6 h-14 items-center">
              {[
                { key: "overview", label: "Overview" },
                { key: "invoices", label: "Invoices" },
                { key: "payments", label: "Payments" },
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
                    className={`relative text-sm font-medium py-3 ${
                      isActive ? "text-blue-600" : "text-gray-600"
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
        )}

        <div className="bg-white rounded-b-xl border border-t-0 p-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton height={30} />
              <Skeleton height={30} />
              <Skeleton height={200} />
              <Skeleton height={200} />
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <OverviewSection project={project} metrics={metrics} />
              )}
              {activeTab === "invoices" && (
                <InvoicesSection projectId={project.id} project={project} />
              )}
              {activeTab === "payments" && (
                <PaymentsSection projectId={project.id} client2={clientId} />
              )}
              {activeTab === "files" && <FilesSection projectId={project.id} />}
              {activeTab === "notes" && <NotesSection projectId={project.id} />}
              {activeTab === "activity" && (
                <ActivitySection projectId={project.id} />
              )}
              {activeTab === "discussion" && (
                <DiscussionSection projectId={project.id} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
