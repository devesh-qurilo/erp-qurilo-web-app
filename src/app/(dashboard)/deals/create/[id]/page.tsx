"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useDealDetailQuery,
  useDealEmployeesQuery,
  useStagesQuery,
  useUpdateDealMutation,
} from "../../api";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";




export default function EditDealPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params?.id as string;

  const [formData, setFormData] = useState({
    title: "",
    leadId: "",
    pipeline: "",
    dealStage: "",
    dealCategory: "",
    dealAgent: "",
    dealWatchers: [] as string[],
    value: "",
    expectedCloseDate: "",
    dealContact: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: employees = [], isLoading: employeesLoading, error: employeesError } = useDealEmployeesQuery();
  const { data: stages = [], isLoading: stagesLoading, error: stagesError } = useStagesQuery();
  const { data: deal, isLoading: dealLoading, error: dealError } = useDealDetailQuery(dealId, { enabled: Boolean(dealId) });
  const updateDealMutation = useUpdateDealMutation({
    onSuccess: async () => {
      setSuccess("Deal updated successfully!");
      setTimeout(() => router.push("/deals/get"), 1000);
    },
  });
  const loading = updateDealMutation.isPending;
  const initialLoading = employeesLoading || stagesLoading || dealLoading;

  useEffect(() => {
    const combinedError = employeesError || stagesError || dealError;
    if (combinedError) {
      setError(combinedError.message || "Failed to load deal data. Please try again later.");
    }
  }, [dealError, employeesError, stagesError]);

  useEffect(() => {
    if (!deal) return;
    setFormData({
      title: deal.title || "",
      leadId: deal.leadId ? String(deal.leadId) : "",
      pipeline: deal.pipeline || "",
      dealStage: deal.dealStage || (stages[0]?.name ?? ""),
      dealCategory: deal.dealCategory || "",
      dealAgent: deal.dealAgent || "",
      dealWatchers: deal.dealWatchers || [],
      value: deal.value ? String(deal.value) : "",
      expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.split("T")[0] : "",
      dealContact: deal.dealContact || "",
    });
  }, [deal, stages]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWatcherChange = (employeeId: string, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.dealWatchers || [];
      const updated = checked
        ? [...current, employeeId]
        : current.filter((id) => id !== employeeId);
      return { ...prev, dealWatchers: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      !formData.title ||
      !formData.pipeline ||
      !formData.dealStage ||
      !formData.dealCategory ||
      !formData.dealAgent ||
      !formData.value ||
      !formData.expectedCloseDate
    ) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      const payload = {
        title: formData.title,
        leadId: formData.leadId ? Number(formData.leadId) : undefined,
        pipeline: formData.pipeline,
        dealStage: formData.dealStage,
        dealCategory: formData.dealCategory,
        dealAgent: formData.dealAgent,
        dealWatchers: formData.dealWatchers,
        value: parseFloat(formData.value),
        expectedCloseDate: formData.expectedCloseDate,
        dealContact: formData.dealContact,
      };

      await updateDealMutation.mutateAsync({ id: dealId, payload });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update deal. Please try again.");
    }
  };

  // if (initialLoading) {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen text-lg font-semibold">
  //       Loading deal details...
  //     </div>
  //   );
  // }



if (initialLoading) {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Title */}
      <Skeleton width={200} height={30} />

      {/* Form Card */}
      <div className="bg-white p-6 border rounded-2xl space-y-6">

        {/* Grid Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton width={120} height={12} />
              <Skeleton height={35} />
            </div>
          ))}
        </div>

        {/* Watchers */}
        <div className="space-y-2">
          <Skeleton width={150} height={15} />
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} height={15} />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <Skeleton width={120} height={40} />
          <Skeleton width={80} height={40} />
        </div>

      </div>
    </div>
  );
}




  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Deal </h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 border rounded-2xl shadow-sm">
        {error && <div className="mb-4 text-red-600 text-sm font-semibold">{error}</div>}
        {success && <div className="mb-4 text-green-600 text-sm font-semibold">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lead ID</label>
            <input
              type="number"
              name="leadId"
              value={formData.leadId}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline *</label>
            <input
              type="text"
              name="pipeline"
              value={formData.pipeline}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
            />
          </div> */}

<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline *</label>
  <select
    name="pipeline"
    value={formData.pipeline}
    onChange={handleInputChange}
    required
    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-600 bg-white"
  >
    <option value="">--</option>
    <option value="Default Pipeline">Default Pipeline</option>
    <option value="Sales Pipeline">Sales Pipeline</option>
    <option value="Enterprise Pipeline">Enterprise Pipeline</option>
    <option value="Client Success Pipeline">Client Success Pipeline</option>
    <option value="Finance Pipeline">Finance Pipeline</option>
    <option value="Marketing Pipeline">Marketing Pipeline</option>
  </select>
</div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal Stage *</label>
            <select
              name="dealStage"
              value={formData.dealStage}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.name}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal Category *</label>
            <input
              type="text"
              name="dealCategory"
              value={formData.dealCategory}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal Agent *</label>
            <select
              name="dealAgent"
              value={formData.dealAgent}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select Deal Agent</option>
              {employees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.name} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value ($) *</label>
            <input
              type="number"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
               Close Date *
            </label>
            <input
              type="date"
              name="expectedCloseDate"
              value={formData.expectedCloseDate}
              onChange={handleInputChange}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal Contact</label>
            <input
              type="text"
              name="dealContact"
              value={formData.dealContact}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Watchers */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Deal Watchers</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {employees.map((emp) => (
              <label key={emp.employeeId} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.dealWatchers.includes(emp.employeeId)}
                  onChange={(e) => handleWatcherChange(emp.employeeId, e.target.checked)}
                />
                {emp.name} ({emp.employeeId})
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Updating..." : "Update Deal"}
          </button>
          <Link href="/deals/get" className="px-4 py-2 text-blue-600 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
