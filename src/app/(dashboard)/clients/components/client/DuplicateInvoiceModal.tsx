"use client";

import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DuplicateInvoiceModal({
  open,
  invoice,
  projects = [],
  clients = [],
  onClose,
  onSave,
}: {
  open: boolean;
  invoice: any;
  projects: any[];
  clients: any[];
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    currency: invoice?.currency ?? "USD",
    projectId: invoice?.project?.projectId ?? "",
    clientId: invoice?.client?.clientId ?? "",
    amount: invoice?.amount ?? invoice?.total ?? 0,
    taxPercent: invoice?.tax ?? 10,
    discountValue: invoice?.discount ?? 0,
    discountIsPercent: true,
    notes: invoice?.notes ?? "",
    amountInWords: "",
  });

  const subtotal = Number(form.amount || 0);

  const discountAmount = form.discountIsPercent
    ? (subtotal * Number(form.discountValue || 0)) / 100
    : Number(form.discountValue || 0);

  const taxAmount =
    ((subtotal - discountAmount) * Number(form.taxPercent || 0)) / 100;

  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  if (!open) return null;

  return (
    // <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-6">
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* <div className="relative z-10 w-full max-w-4xl bg-white rounded-lg shadow-lg"> */}
      <div className="relative z-10 w-full max-w-3xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold">Duplicate Invoice </h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Invoice Details */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Invoice Details</h4>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600">
                  Invoice Number *
                </label>
                <input
                  className="w-full mt-1 border rounded px-3 py-2"
                  placeholder="INV#"
                  value={form.invoiceNumber}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      invoiceNumber: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Invoice Date *</label>
                <input
                  type="date"
                  className="w-full mt-1 border rounded px-3 py-2"
                  value={form.invoiceDate}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      invoiceDate: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Currency *</label>
                <select
                  className="w-full mt-1 border rounded px-3 py-2"
                  value={form.currency}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, currency: e.target.value }))
                  }
                >
                  {/* <option value="USD">USD $</option>
                  <option value="INR">INR ₹</option>
                  <option value="EUR">EUR €</option> */}



                  <option value="USD">USD $ (US Dollar)</option>
                  <option value="EUR">EUR € (Euro)</option>
                  <option value="GBP">GBP £ (British Pound)</option>
                  <option value="CHF">CHF ₣ (Swiss Franc)</option>
                  <option value="SEK">SEK kr</option>
                  <option value="NOK">NOK kr</option>
                  <option value="DKK">DKK kr</option>
                  <option value="PLN">PLN zł</option>
                  <option value="CZK">CZK Kč</option>
                  <option value="HUF">HUF Ft</option>
                  <option value="RON">RON lei</option>


                </select>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-3">Project Details</h4>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm text-gray-600">Project *</label>
                <select
                  className="w-full mt-1 border rounded px-3 py-2"
                  value={form.projectId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, projectId: e.target.value }))
                  }
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option
                      key={p.id ?? p.projectId}
                      value={p.id ?? p.projectId}
                    >
                      {p.projectName ?? p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">Client *</label>
                <select
                  className="w-full mt-1 border rounded px-3 py-2"
                  value={form.clientId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, clientId: e.target.value }))
                  }
                >
                  <option value="">Select Client</option>
                  {clients.map((c) => (
                    <option key={c.clientId ?? c.id} value={c.clientId ?? c.id}>
                      {c.name ?? c.company?.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Project Budget *
                </label>
                <div className="flex items-center mt-1">
                  <span className="px-2 py-2 bg-gray-100 border rounded-l">
                    $
                  </span>
                  <input
                    disabled
                    className="w-full border rounded-r px-3 py-2 bg-gray-50"
                    placeholder="$ 30,000"
                  />
                </div>
              </div>
            </div>

            {/* Amount Row */}
            <div className="grid grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-sm text-gray-600">Amount</label>
                <div className="flex items-center mt-1">
                  <span className="px-2 py-2 bg-gray-100 border rounded-l">
                    $
                  </span>
                  <input
                    type="number"
                    className="w-full border rounded-r px-3 py-2"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        amount: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Tax</label>
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

              <div className="bg-gray-200 rounded p-3 text-right font-semibold">
                {total.toFixed(2)}
              </div>
            </div>

            {/* Totals */}
            <div className="mt-4 border-t pt-3 text-sm">
              <div className="flex justify-end gap-6">
                <div className="text-right">
                  <div className="text-gray-500">Sub Total</div>
                  <div>{subtotal.toFixed(2)}</div>
                </div>

                <div className="text-right">
                  <div className="text-gray-500">Discount</div>
                  <div>{discountAmount.toFixed(2)}</div>
                </div>

                <div className="text-right">
                  <div className="text-gray-500">Tax</div>
                  <div>{taxAmount.toFixed(2)}</div>
                </div>

                <div className="text-right font-semibold">
                  <div>Total</div>
                  <div>{total.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm text-gray-600">
              Note / Description for the recipient *
            </label>
            <textarea
              rows={3}
              className="w-full mt-1 border rounded px-3 py-2"
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                onSave({
                  ...form,
                  total,
                })
              }
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
