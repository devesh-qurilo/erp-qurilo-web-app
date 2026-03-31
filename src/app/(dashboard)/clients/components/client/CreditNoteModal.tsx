
"use client";

import React, { useMemo, useState } from "react";
import { X, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE_URL = process.env.NEXT_PUBLIC_MAIN!;

export default function CreditNoteModal({
  open,
  onClose,
  invoice,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  invoice: any;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);



  const [form, setForm] = useState({
    creditNoteNumber: `CN-${invoice?.invoiceNumber ?? ""}`,
    creditNoteDate: "",
    currency: invoice?.currency ?? "USD",
    adjustment: 0,
    adjustmentType: "subtract",
    taxPercent: 10,
    note: "",
    file: null as File | null,
  });

  const invoiceAmount = Number(
    invoice?.unpaidAmount ?? invoice?.total ?? 0
  );

  const taxAmount = useMemo(
    () => (form.adjustment * form.taxPercent) / 100,
    [form.adjustment, form.taxPercent]
  );

  const finalAmount = useMemo(() => {
    const base =
      form.adjustmentType === "subtract"
        ? invoiceAmount - form.adjustment
        : invoiceAmount + form.adjustment;

    return Math.max(0, base + taxAmount);
  }, [invoiceAmount, form.adjustment, form.adjustmentType, taxAmount]);

  if (!open) return null;


  const handleSave = async () => {
    const invoiceNumber =
      invoice?.invoiceNumber ?? invoice?.id;

    if (!invoiceNumber) {
      alert("Invoice number missing");
      return;
    }

    if (!form.creditNoteNumber?.trim()) {
      alert("Credit note number is required");
      return;
    }

    if (!form.creditNoteDate) {
      alert("Credit note date is required");
      return;
    }

    const fd = new FormData();
    fd.append(
      "creditNote",
      JSON.stringify({
        creditNoteNumber: form.creditNoteNumber,   // ✅ USER FILLED
        creditNoteDate: form.creditNoteDate,       // ✅ USER FILLED
        currency: form.currency,
        adjustment: Number(form.adjustment),
        adjustmentPositive: form.adjustmentType === "add",
        tax: Number(taxAmount),                    // ✅ TAX AMOUNT
        amount: Number(finalAmount),               // ✅ FINAL AMOUNT
        notes: form.note ?? "",
      })
    );

    if (form.file) {
      fd.append("file", form.file);
    }

    setLoading(true);
    try {
      console.log("SUBMIT Credit Note:", invoiceNumber)

      const res = await fetch(
        `${BASE_URL}/api/invoices/${invoiceNumber}/credit-notes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: fd,
        }
      );

      const text = await res.text();
      let data: any = text;
      try {
        data = JSON.parse(text);
      } catch { }

      if (!res.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          "Credit note creation failed"
        );
      }

      onCreated();   // 🔥 CREDIT NOTE TABLE REFRESH
      onClose();
    } catch (err: any) {
      console.error("CREATE CREDIT NOTE ERROR:", err);
      alert(err.message || "Failed to create credit note");
    } finally {
      setLoading(false);
    }
  };

  console.log("RENDER CreditNoteModal", invoice?.client.clientId
  );


  return (
    // <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* <div className="relative z-10 w-full max-w-3xl bg-white rounded-lg shadow-lg"> */}
      {/* <div className="relative z-10 w-full max-w-3xl bg-white rounded-lg shadow-lg max-h-[90vh] flex flex-col"> */}
<div className="relative z-10 w-[83%] h-full bg-white shadow-xl flex flex-col overflow-y-auto p-6 text-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            Credit Note Details
          </h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* <div className="p-6 space-y-6"> */}
        <div className="p-6 space-y-6 overflow-y-auto ">


          {/* HEADER FIELDS */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600">
                Credit Note#
              </label>
              <input
                className="w-full mt-1 border rounded px-3 py-2"
                placeholder="Enter credit note number"
                value={form.creditNoteNumber}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    creditNoteNumber: e.target.value,
                  }))
                }
              />

            </div>

            <div>
              <label className="text-sm text-gray-600">
                Credit Note Date *
              </label>
              <input
                type="date"
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.creditNoteDate}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    creditNoteDate: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">
                Currency
              </label>
              <input
                disabled
                className="w-full mt-1 border rounded px-3 py-2"
                value={`${form.currency} $`}
              />
            </div>
          </div>

          {/* CLIENT / PROJECT */}
          <div className="grid grid-cols-2 gap-6 border-t pt-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">
                Client
              </div>
              <div className="font-medium">
                {invoice?.client?.name ?? "—"}
              </div>
              <div className="text-xs text-gray-500">
                {invoice?.client?.company?.companyName ?? ""}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">
                Project
              </div>
              <div className="font-medium">
                {invoice?.project?.projectName ?? "—"}
              </div>
            </div>
          </div>

          {/* AMOUNT SECTION */}
          <div className="border rounded-lg p-4 grid grid-cols-4 gap-4 items-center">
            <div>
              <div className="text-xs text-gray-500">
                Invoice Amount
              </div>
              <div className="font-semibold">
                ${invoiceAmount.toFixed(2)}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">
                Adjustment
              </div>
              <input
                type="number"
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.adjustment}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    adjustment: Number(e.target.value),
                  }))
                }
              />

              <div className="flex items-center gap-2 mt-2 text-xs">
                <span>Subtract</span>
                <input
                  type="checkbox"
                  checked={form.adjustmentType === "add"}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      adjustmentType: e.target.checked
                        ? "add"
                        : "subtract",
                    }))
                  }
                />
                <span>Add</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Tax %</div>
              <input
                type="number"
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.taxPercent}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    taxPercent: Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="bg-gray-100 h-full rounded flex flex-col justify-center items-center">
              <div className="text-xs text-gray-500">Amount</div>
              <div className="font-bold text-lg">
                {finalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* NOTE */}
          <div>
            <label className="text-sm text-gray-600">
              Note for the recipient
            </label>
            <textarea
              rows={3}
              className="w-full mt-1 border rounded px-3 py-2"
              value={form.note}
              onChange={(e) =>
                setForm((p) => ({ ...p, note: e.target.value }))
              }
            />
          </div>

          {/* FILE UPLOAD */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Add File
            </label>
            <div
              className="border-2 border-dashed rounded-md h-28 flex flex-col items-center justify-center cursor-pointer"
              onClick={() =>
                document.getElementById("credit-file")?.click()
              }
            >
              <CloudUpload className="h-6 w-6 text-gray-400" />
              <span className="text-sm text-gray-500">
                {form.file ? form.file.name : "Choose a file"}
              </span>
            </div>
            <input
              id="credit-file"
              type="file"
              hidden
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  file: e.target.files?.[0] ?? null,
                }))
              }
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={loading} onClick={handleSave}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
