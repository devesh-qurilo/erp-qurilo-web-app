"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Stage } from "@/types/stages";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


type Employee = {
  employeeId: string;
  name: string;
};

type Lead = {
  id: number;
  name: string;
  email?: string | null;
  companyName?: string | null;
};

export default function CreateDealPage() {
  const router = useRouter();
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

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // NEW: categories state + modal flag
  const [categories, setCategories] = useState<string[]>(["General", "Corporate", "Retail"]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const API_BASE = `${process.env.NEXT_PUBLIC_MAIN}`;

  // Fetch employees, stages and leads
  useEffect(() => {
    const fetchEmployeesStagesLeads = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No access token found. Please log in.");
          return;
        }

        // Fetch employees
        const empRes = await fetch("/api/hr/employee", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!empRes.ok) throw new Error("Failed to fetch employees");
        const empData = await empRes.json();
        setEmployees(empData.content || []);

        // Fetch stages
        const stageRes = await fetch("/api/deals/stages", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // if (!stageRes.ok) throw new Error("Failed to fetch deal stages");


        if (!stageRes.ok) {
          const text = await stageRes.text();
          console.error("Stages API error:", stageRes.status, text);
          throw new Error(`Failed to fetch deal stages (${stageRes.status})`);
        }



        const stageData: Stage[] = await stageRes.json();
        setStages(stageData);
        if (stageData.length > 0) {
          setFormData((prev) => ({ ...prev, dealStage: stageData[0].name }));
        }

        // Fetch leads from provided base URL
        const leadsRes = await fetch(`${API_BASE}/leads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!leadsRes.ok) {
          // do not fail the whole form if leads endpoint fails — set empty leads and continue
          console.warn("Failed to fetch leads for dropdown");
          setLeads([]);
        } else {
          const leadsData = await leadsRes.json();
          // Expecting array as you provided; map to Lead[]
          setLeads(Array.isArray(leadsData) ? leadsData : []);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setStagesLoading(false);
      }
    };

    fetchEmployeesStagesLeads();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWatcherChange = (employeeId: string, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.dealWatchers || [];
      const updated = checked ? [...current, employeeId] : current.filter((id) => id !== employeeId);
      return { ...prev, dealWatchers: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found. Please log in.");
        setLoading(false);
        return;
      }

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

      const res = await fetch("/api/deals/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create deal");

      setSuccess("Deal created successfully!");
      // keep same behavior: redirect to deals listing after success
      setTimeout(() => router.push("/deals/get"), 1000);
    } catch (err) {
      console.error(err);
      setError("Failed to create deal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // if (stagesLoading) {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen text-lg font-semibold">
  //       Loading form...
  //     </div>
  //   );
  // }



  if (stagesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-4xl space-y-6">

          {/* Header */}
          <div className="flex justify-between items-center">
            <Skeleton width={220} height={30} />
            <Skeleton width={30} height={30} />
          </div>

          {/* Form Card */}
          <div className="bg-white border rounded-2xl p-6 space-y-6">

            {/* Title */}
            <Skeleton width={150} height={20} />

            {/* Grid Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton width={100} height={12} />
                  <Skeleton height={35} />
                </div>
              ))}
            </div>

            {/* Watchers Section */}
            <div className="space-y-2">
              <Skeleton width={150} height={15} />
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} height={15} />
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-4">
              <Skeleton width={100} height={35} />
              <Skeleton width={100} height={35} />
            </div>

          </div>
        </div>
      </div>
    );
  }



  // ---------- CATEGORY MODAL HELPERS (NEW) ----------
  const openCategoryModal = () => {
    setNewCategoryInput("");
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setNewCategoryInput("");
  };

  const saveCategory = () => {
    const name = newCategoryInput.trim();
    if (!name) return;
    // avoid duplicates
    if (!categories.includes(name)) {
      setCategories((prev) => [...prev, name]);
      setFormData((prev) => ({ ...prev, dealCategory: name })); // set selected category to new one
    } else {
      // if exists, just select it
      setFormData((prev) => ({ ...prev, dealCategory: name }));
    }
    closeCategoryModal();
  };

  const deleteCategory = (name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    setCategories((prev) => prev.filter((c) => c !== name));
    // if the deleted category was selected, clear selection
    setFormData((prev) => (prev.dealCategory === name ? { ...prev, dealCategory: "" } : prev));
  };
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
      {/* Outer centered container to mimic a modal page */}
      <div className="w-full max-w-4xl">
        {/* Header similar to modal top */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Add Deal Information</h1>
          <button
            onClick={() => router.back()}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main rounded card */}
        <form onSubmit={handleSubmit} className="bg-white border rounded-2xl shadow-sm">
          {/* inner rounded panel */}
          <div className="rounded-lg border mx-6 my-6 p-6">
            <h3 className="text-base font-medium mb-4">Deal Details</h3>

            {/* 3-column layout like image */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">




              {/* Deal Name */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Deal Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="--"
                />
              </div>





              {/* Lead Contact (POPULATED FROM /leads) */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Lead Contact *</label>
                <select
                  name="leadId"
                  value={formData.leadId}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  <option value="">{/* default empty like screenshot */}--</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={String(lead.id)}>
                      {lead.name || `#${lead.id}`}{lead.companyName ? ` — ${lead.companyName}` : ""}
                    </option>
                  ))}
                </select>
              </div>



              {/* Pipeline */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Pipeline *</label>
                <select
                  name="pipeline"
                  value={formData.pipeline}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md bg-white"
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

              {/* Deal Stages */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Deal Stages *</label>
                <select
                  name="dealStage"
                  value={formData.dealStage}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deal Category with small Add button */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-2">Deal Category</label>
                  <select
                    name="dealCategory"
                    value={formData.dealCategory}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md bg-white"
                  >
                    <option value="">--</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                {/* REPLACED: alert -> modal opener */}
                <button
                  type="button"
                  className="px-3 mt-6 py-2 bg-gray-200 rounded-md text-sm"
                  onClick={openCategoryModal}
                >
                  Add
                </button>
              </div>

              {/* Deal Agent */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Deal Agent </label>
                <select
                  name="dealAgent"
                  value={formData.dealAgent}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  <option value="">--</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deal Value with USD prefix */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Deal Value</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border bg-gray-100 text-sm">USD $</span>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-r-md"
                    placeholder=""
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Close Date */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Close Date *</label>
                <input
                  type="date"
                  name="expectedCloseDate"
                  value={formData.expectedCloseDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              {/* Deal Watcher */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Deal Watcher</label>
                <select
                  name="dealWatchers"
                  value={formData.dealWatchers[0] ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dealWatchers: e.target.value ? [e.target.value] : [] }))
                  }
                  className="w-full p-2 border rounded-md bg-white"
                >
                  <option value="">--</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Watchers multi-select area (kept below, like screenshot secondary section) */}
          <div className="mx-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Deal Watchers</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {employees.map((emp) => (
                <label key={emp.employeeId} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.dealWatchers.includes(emp.employeeId)}
                    onChange={(e) => handleWatcherChange(emp.employeeId, e.target.checked)}
                  />
                  <span className="text-xs">{emp.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer buttons (Cancel + Update) */}
          <div className="px-6 pb-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border rounded-full text-blue-600 hover:bg-blue-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-full text-white ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>

        {/* messages */}
        <div className="mt-4 text-center">
          {error && <div className="text-sm text-red-600 font-medium">{error}</div>}
          {success && <div className="text-sm text-green-600 font-medium">{success}</div>}
        </div>
      </div>

      {/* ================= CATEGORY MODAL (matches screenshot) ================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/30">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg border border-slate-200">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h4 className="font-medium">Deal Category</h4>
              <button onClick={closeCategoryModal} className="text-slate-500">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-blue-50 text-left">
                    <th className="p-3 text-sm">#</th>
                    <th className="p-3 text-sm">Category Name</th>
                    <th className="p-3 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 && (
                    <tr className="border-t">
                      <td className="p-3 text-sm" colSpan={3}>No categories</td>
                    </tr>
                  )}
                  {categories.map((c, i) => (
                    <tr key={c} className="border-t">
                      <td className="p-3 text-sm">{i + 1}</td>
                      <td
                        className="p-3 text-sm cursor-pointer"
                        onClick={() => {
                          // pick category on click and close modal
                          setFormData((prev) => ({ ...prev, dealCategory: c }));
                          setShowCategoryModal(false);
                        }}
                      >
                        {c}
                      </td>
                      <td className="p-3 text-sm text-center">
                        <button onClick={() => deleteCategory(c)} className="text-red-600">🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4">
                <label className="text-sm block mb-1">Deal Category Name *</label>
                <input
                  className="w-full px-3 py-2 rounded-md border border-slate-200"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="--"
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button onClick={closeCategoryModal} className="px-4 py-2 border rounded-md">Cancel</button>
                <button onClick={saveCategory} className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ====================================================================== */}
    </div>
  );
}
