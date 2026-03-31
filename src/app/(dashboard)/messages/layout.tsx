"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatRoomsList from "./_components/ChatRoomsList";

type Employee = {
  employeeId: string;
  name: string;
  email?: string | null;
  profilePictureUrl?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  designationId?: number | null;
  designationName?: string | null;
  role?: string | null;
  mobile?: string | null;
  about?: string | null;
  active?: boolean;
  createdAt?: string | null;
};

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`;
  const API_PATH = "/employee/all";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);

      // Use the same key your ChatRoomsList expects: 'accessToken' in localStorage.
      // Also fallback to cookie 'token' if present.
      const localToken =
        typeof window !== "undefined"
          ? window.localStorage.getItem("accessToken")
          : null;
      const cookieToken = getCookie("token");
      const token = localToken || cookieToken || null;

      const headers: HeadersInit = {
        Accept: "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      try {
        const res = await fetch(`${BASE_URL}${API_PATH}`, {
          method: "GET",
          headers,
          // enable if your backend uses cookies for auth
          // credentials: "include",
          signal: controller.signal,
        });

        // If unauthorized -> clear token and redirect to login
        if (res.status === 401) {
          // clear any stale token that might cause repeated 401s
          try {
            if (typeof window !== "undefined") {
              window.localStorage.removeItem("accessToken");
              window.localStorage.removeItem("token");
            }
          } catch (e) {
            // ignore
          }

          const msg =
            "Unauthorized: You need to be logged in to fetch employees. (401)";
          setEmployees([]);
          setError(msg);
          setLoading(false);

          // Redirect to login page so user can re-authenticate
          // (preserves UX rather than leaving them stuck).
          // If you want a confirm or modal instead, remove this push.
          router.push("/login");
          return;
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          setEmployees([]);
          setError(
            `Failed to load employees: ${res.status} ${res.statusText}${
              text ? ` — ${text}` : ""
            }`
          );
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (Array.isArray(data)) {
          setEmployees(data);
        } else if (data && Array.isArray((data as any).content)) {
          setEmployees((data as any).content);
        } else {
          setEmployees([]);
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.warn(
              "[MessagesLayout] Unexpected employee API shape:",
              data
            );
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setEmployees([]);
        setError(err?.message || "Failed to fetch employees");
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("[MessagesLayout] fetch exception:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();

    return () => {
      controller.abort();
    };
    // NOTE: we intentionally do not include router in dependency array to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen md:h-[calc(100vh-0rem)] flex flex-col md:flex-row">
      <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-card">
        {/* Header: compact rounded search box (matches provided image) */}
        <div className="p-4 border-b border-border">
          <div className="w-full">
            <label htmlFor="chat-search" className="sr-only">
              Search a contact
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z"
                />
              </svg>

              <input
                id="chat-search"
                type="text"
                placeholder="Search a contact"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-gray-200 px-10 py-2 text-sm bg-white placeholder:text-gray-400 focus:outline-none focus:ring-0"
                aria-label="Search a contact"
              />
            </div>
          </div>
        </div>

        <div className="h-[calc(100vh-4rem)] md:h-screen overflow-y-auto">
          {/* Pass employees, loading, error and search into ChatRoomsList */}
          <ChatRoomsList
            employees={employees.map((e) => ({
              employeeId: e.employeeId,
              name: e.name,
              email: e.email ?? null,
              profilePictureUrl: e.profilePictureUrl ?? null,
              designationName: e.designationName ?? null,
              departmentName: e.departmentName ?? null,
            }))}
            loading={loading}
            error={error}
            search={search}
          />
        </div>
      </aside>

      <main className="flex-1 min-w-0 bg-background">{children}</main>
    </div>
  );
}
