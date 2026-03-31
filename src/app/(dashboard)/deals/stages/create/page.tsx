"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddLostStagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found. Please log in.");
        return;
      }

      // Send only one field in RAW JSON body
      const res = await fetch("/api/deals/stages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Failed to create stage");

      setSuccess("Stage 'Lost' added successfully!");
      setTimeout(() => router.push("/deals/stages"), 1500);
    } catch (err) {
      console.error(err);
      setError("Failed to create stage. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Lost Stage</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 border rounded-2xl shadow-sm"
      >
        {error && (
          <div className="mb-4 text-red-600 text-sm font-semibold">{error}</div>
        )}
        {success && (
          <div className="mb-4 text-green-600 text-sm font-semibold">
            {success}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stage Name
          </label>
          <input
            type="text"
            value="Lost"
            disabled
            className="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Adding..." : "Add Stage"}
        </button>
      </form>
    </div>
  );
}
