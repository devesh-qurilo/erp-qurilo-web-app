"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "./Modal";
import Card from "./Card";

const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`;

export default function InvoiceCreateModal({
  open,
  onClose,
  invoices = [],
  refresh,
    activeInvoice   // add this

}) {
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  const [form, setForm] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    currency: "USD",
    projectName: "",
    projectId: "",
    clientId: "",
    amount: 0,
    tax: 10,
    discount: 0,
    amountInWords: "",
    notes: "",
  });

  /* =========================
      FETCH PROJECTS
  ========================= */
  useEffect(() => {
    if (!open) return;

    fetch(`${BASE_URL}/api/projects`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    })
      .then((r) => r.json())
      .then((d) => setProjects(Array.isArray(d) ? d : []))
      .catch(() => setProjects([]));
  }, [open]);



/* =========================
    PREFILL DUPLICATE INVOICE
========================= */
useEffect(() => {
  if (!activeInvoice) return;

  setForm({
    invoiceNumber: "", // clear number for duplicate
    invoiceDate: activeInvoice.invoiceDate || "",
    currency: activeInvoice.currency || "USD",
    projectName: activeInvoice.project?.projectName || "",
    projectId: activeInvoice.project?.projectId || "",
    clientId: activeInvoice.client?.clientId || "",
    amount: activeInvoice.total || 0,
    tax: activeInvoice.tax || 0,
    discount: activeInvoice.discount || 0,
    amountInWords: activeInvoice.amountInWords || "",
    notes: activeInvoice.notes || "",
  });
}, [activeInvoice]);



  /* =========================
      PROJECT LIST (UI SAME)
  ========================= */
  const projectList = useMemo(() => {
    return ["Select Project", ...projects.map((p) => p.name)];
  }, [projects]);

  /* =========================
      CLIENT LIST (UI SAME)
  ========================= */
  const clientList = useMemo(() => {
    const map = new Map();
    invoices.forEach((inv) => {
      if (inv.client?.clientId && inv.client?.name) {
        map.set(inv.client.clientId, inv.client.name);
      }
    });

    return [
      { id: "", name: "Select Client" },
      ...Array.from(map, ([id, name]) => ({ id, name })),
    ];
  }, [invoices]);

  /* =========================
      SELECTED PROJECT
  ========================= */
  const selectedProject = useMemo(() => {
    return projects.find((p) => p.name === form.projectName);
  }, [projects, form.projectName]);

  /* =========================
      CALCULATIONS (SAME AS ORIGINAL)
  ========================= */
  // const subtotal = Number(form.amount || 0);

  // const discountAmount =
    
  //   (subtotal * Number(form.discount || 0)) / 100;

  // const taxAmount = ((subtotal - discountAmount) * Number(form.tax || 0)) / 100;

  // const totalAmount = subtotal - discountAmount + taxAmount;



/* =========================
    CALCULATIONS (FIXED)
========================= */

const subtotal = Number(form.amount || 0);

// ✅ normalize values
const discountPercent = Number(form.discount || 0) < 1 ? 0 : Number(form.discount);
const taxPercent = Number(form.tax || 0) < 1 ? 0 : Number(form.tax);

const discountAmount = (subtotal * discountPercent) / 100;

const taxAmount = ((subtotal - discountAmount) * taxPercent) / 100;

const totalAmount = subtotal - discountAmount + taxAmount;



  /* =========================
      SAVE INVOICE
  ========================= */
  const saveInvoice = async () => {
    if (!form.projectId || !form.clientId) {
      alert("Project aur Client required hai");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        invoiceNumber: form.invoiceNumber,
        invoiceDate: form.invoiceDate,
        currency: form.currency,
        projectId: Number(form.projectId), // ✅ numeric
        clientId: form.clientId,
        amount: Number(form.amount),
        tax: Number(form.tax),
        discount: Number(form.discount),
        amountInWords: form.amountInWords,
        notes: form.notes,
      };

      const res = await fetch(`${BASE_URL}/api/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Create failed");

      onClose();
      refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Create Invoice" onClose={onClose}>
      <div className="space-y-6">
        {/* =========================
            INVOICE DETAILS
        ========================= */}
        <Card>
          <h4 className="text-sm font-medium mb-4">Invoice Details</h4>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4">
              <label className="text-sm text-gray-600 block mb-1">
                Invoice Number *
              </label>
              <input
                className="border rounded w-full h-10 px-3"
                value={form.invoiceNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, invoiceNumber: e.target.value }))
                }
              />
            </div>

            <div className="col-span-4">
              <label className="text-sm text-gray-600 block mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                className="border rounded w-full h-10 px-2"
                value={form.invoiceDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, invoiceDate: e.target.value }))
                }
              />
            </div>

            <div className="col-span-4">
              <label className="text-sm text-gray-600 block mb-1">
                Currency *
              </label>
              <select
                className="border rounded w-full h-10 px-2"
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="AUD">AUD</option>
                <option value="CAD">CAD</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
        </Card>

        {/* =========================
            PROJECT DETAILS
        ========================= */}
        <Card>
          <h4 className="text-sm font-medium mb-4">Project Details</h4>

          <div className="grid grid-cols-12 gap-3">
            {/* PROJECT */}
            <div className="col-span-4">
              <label className="text-sm text-gray-600 block mb-1">
                Project *
              </label>
              {/* <select
                className="border rounded w-full h-10 px-2"
                value={form.projectName}
                onChange={(e) => {
                  const name = e.target.value;
                  const project = projects.find((p) => p.name === name);

                  setForm((f) => ({
                    ...f,
                    projectName: name,
                    projectId: project?.id || "",
                    clientId: project?.clientId || "",
                  }));
                }}
              >
                {projectList.map((p) => (
                  <option key={p}>{p}</option>
                  
                ))}
              </select> */}


<select
  className="border rounded w-full h-10 px-2"
  value={form.projectId}
  onChange={(e) => {
    const id = e.target.value;
    const project = projects.find((p) => String(p.id) === id);

    setForm((f) => ({
      ...f,
      projectId: id,
      projectName: project?.name || "",
      clientId: project?.clientId || "",
    }));
  }}
>
  <option value="">Select Project</option>

  {projects.map((p) => (
    <option key={p.id} value={p.id}>
      {p.name}
    </option>
  ))}
</select>


            </div>

            {/* CLIENT */}
            <div className="col-span-4">
              <label className="text-sm text-gray-600 block mb-1">
                Client *
              </label>
              <select
                className="border rounded w-full h-10 px-2"
                value={form.clientId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientId: e.target.value }))
                }
              >
                {clientList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* BUDGET */}
            <div className="col-span-4">
              <label className="text-sm text-gray-600 block mb-1">
                Project Budget *
              </label>
              <input
                readOnly
                className="border rounded w-full h-10 px-3"
                value={
                  selectedProject?.budget
                    ? selectedProject.budget.toLocaleString()
                    : ""
                }
              />
            </div>
          </div>

          {/* =========================
              AMOUNT / TAX / TOTAL
          ========================= */}
          <div className="mt-4 border rounded flex overflow-hidden">
            <div className="flex-1 p-3">
              <label className="text-sm text-gray-600 block mb-1">Amount</label>
              <input
                type="number"
                className="border rounded h-10 w-40 px-2"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: Number(e.target.value) }))
                }
              />
            </div>

            <div className="w-56 p-3 border-l">
              <label className="text-sm text-gray-600 block mb-1">
                Tax (%)
              </label>
              {/* <input
                type="number"
                className="border rounded h-10 w-full px-2"
                value={form.tax}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tax: Number(e.target.value) }))
                }
              /> */}


<input
  type="number"
  className="border rounded h-10 w-full px-2"
  value={form.tax}
  onChange={(e) => {
    let value = Number(e.target.value);

    if (value < 1) value = 0; // ✅ enforce rule

    setForm((f) => ({ ...f, tax: value }));
  }}
/>


            </div>

            <div className="w-40 bg-gray-100 p-3 flex flex-col items-center justify-center">
              <div className="text-sm text-gray-500">Total</div>
              <div className="font-bold text-lg">{totalAmount.toFixed(2)}</div>
            </div>
          </div>

          {/* =========================
              SUBTOTAL TABLE (RESTORED)
          ========================= */}
          <div className="mt-4 flex justify-end">
            <div className="w-80 border rounded">
              <div className="grid grid-cols-3 p-2 border-b">
                <div />
                <div className="text-right">Subtotal</div>
                <div className="text-right">{subtotal.toFixed(2)}</div>
              </div>

              <div className="grid grid-cols-3 p-2 border-b">
                <div>Discount</div>
                {/* <input
                  type="number"
                  className="border rounded px-2 h-8"
                  value={form.discount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discount: Number(e.target.value),
                    }))
                  }
                /> */}


<input
  type="number"
  className="border rounded px-2 h-8"
  value={form.discount}
  onChange={(e) => {
    let value = Number(e.target.value);

    if (value < 1) value = 0; // ✅ enforce rule

    setForm((f) => ({
      ...f,
      discount: value,
    }));
  }}
/>


                <div className="text-right">{discountAmount.toFixed(2)}</div>
              </div>

              <div className="grid grid-cols-3 p-2 bg-gray-100">
                <div />
                <div className="text-right font-medium">Total</div>
                <div className="text-right font-bold">
                  {totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* =========================
            AMOUNT IN WORDS + NOTES
        ========================= */}
        <Card>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <label className="text-sm text-gray-600 block mb-1">
                Amount in Words
              </label>
              <input
                className="border rounded w-full h-10 px-3"
                value={form.amountInWords}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    amountInWords: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-span-6">
              <label className="text-sm text-gray-600 block mb-1">Notes</label>
              <textarea
                className="border rounded w-full h-28 p-3"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
        </Card>

        {/* =========================
            ACTIONS
        ========================= */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={saveInvoice} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
