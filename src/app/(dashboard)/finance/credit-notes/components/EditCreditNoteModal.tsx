// src/components/credit-notes/EditCreditNoteModal.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Company = {
  companyName?: string;
  companyLogoUrl?: string | null;
};

type Client = {
  clientId?: string;
  name?: string;
  email?: string;
  company?: Company | null;
  profilePictureUrl?: string | null;
};

type Project = {
  projectName?: string | null;
};

export type CreditNoteShape = {
  id: number;
  creditNoteNumber?: string;
  creditNoteDate?: string | null;
  currency?: string | null;
  adjustment?: number | null;
  adjustmentPositive?: boolean;
  amount?: number | null;
  tax?: number | null;
  notes?: string | null;
  fileUrl?: string | null;
  client?: Client | null;
  project?: Project | null;
  totalAmount?: number | null;
  invoiceNumber?: string | null;
};

export default function EditCreditNoteModal({
  open,
  creditNote,
  onClose,
  onUpdate,
}: {
  open: boolean;
  creditNote?: CreditNoteShape | null;
  onClose: () => void;
  onUpdate?: (updated: CreditNoteShape) => void;
}) {
  // Local editable state initialised from creditNote prop
  const [creditNoteNumber, setCreditNoteNumber] = useState<string>("");
  const [creditNoteDate, setCreditNoteDate] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
  const [adjustment, setAdjustment] = useState<number>(0);
  const [adjustAdd, setAdjustAdd] = useState<boolean>(true);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (!creditNote) return;
    setCreditNoteNumber(creditNote.creditNoteNumber ?? "");
    setCreditNoteDate(creditNote.creditNoteDate ?? "");
    setCurrency(creditNote.currency ?? "USD");
    // invoice amount: prefer amount then totalAmount
    setInvoiceAmount(Number(creditNote.amount ?? creditNote.totalAmount ?? 0));
    setAdjustment(Number(creditNote.adjustment ?? 0));
    setAdjustAdd(creditNote.adjustmentPositive ?? true);
    setTaxPercent(Number((creditNote as any).tax ?? 0));
    setNotes(creditNote.notes ?? "");
  }, [creditNote, open]);

  // Derived computed amount
  const computedNet = useMemo(() => {
    const base = invoiceAmount;
    const adjusted = adjustAdd ? base + adjustment : base - adjustment;
    const tax = (taxPercent / 100) * adjusted;
    const total = adjusted + tax;
    return {
      adjusted,
      tax,
      total,
    };
  }, [invoiceAmount, adjustment, adjustAdd, taxPercent]);

  if (!open || !creditNote) return null;

  // simple close wrapper
  const handleClose = () => {
    onClose();
  };

  const handleUpdate = () => {
    const updated: CreditNoteShape = {
      ...creditNote,
      creditNoteNumber,
      creditNoteDate: creditNoteDate || creditNote.creditNoteDate,
      currency,
      amount: invoiceAmount,
      adjustment,
      adjustmentPositive: adjustAdd,
      tax: taxPercent,
      notes,
      totalAmount: computedNet.total,
    };

    // Return updated object to parent (parent can call API)
    onUpdate?.(updated);
    onClose();
  };

  // Common currency options — keep editable if you want more/less
  const currencyOptions = [
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
    { value: "USD", label: "USD - usan Rupee" },
    { value: "AED", label: "AED - UAE Dirham" },
    { value: "AUD", label: "AUD - Australian Dollar" },
  ];

  return (
    // <div className="fixed inset-0 z-60 flex items-start justify-center pt-10">
<div className="fixed inset-0 z-[10060] flex justify-end">

      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={handleClose}
        aria-hidden
      />

      <div
        // ensure modal content receives pointer events and is above overlay
    //  className="relative z-70 w-[900px] max-w-full bg-white rounded-lg border shadow-lg pointer-events-auto
    //          max-h-[85vh] flex flex-col"

className="relative z-70 w-[83%] h-full bg-white shadow-xl pointer-events-auto flex flex-col overflow-y-auto"

     
   // className="relative z-70 w-[900px] max-w-full bg-white rounded-lg border shadow-lg pointer-events-auto"
      >
        {/* header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Edit Credit Note</h3>
          <button
            onClick={handleClose}
            className="p-2 rounded hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* content */}
        {/* <div className="p-6"> */}
        <div className="p-6 overflow-y-auto flex-1">

          {/* Top row: credit note #, date, currency */}
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4">
              <label className="block text-sm text-slate-600 mb-2">Credit Note#</label>
              <div className="bg-slate-100 rounded px-3 py-2 text-sm text-slate-700">{creditNoteNumber}</div>
            </div>

            <div className="col-span-4">
              <label className="block text-sm text-slate-600 mb-2">Credit Note Date</label>
              <input
                type="date"
                value={creditNoteDate ?? ""}
                onChange={(e) => setCreditNoteDate(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="col-span-4">
              <label className="block text-sm text-slate-600 mb-2">Currency</label>

              {/* Wrapper with high z-index so dropdown content cannot be covered by image/thumbnail */}
              <div className="relative z-80">
                {/* Replaced text input with Select dropdown (keeps rest identical) */}
                <Select value={currency} onValueChange={(v) => setCurrency(v)}>
                  <SelectTrigger className="w-full h-9 pointer-events-auto" aria-label="Select currency">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>

                  {/* ensure content has high z-index */}
                  <SelectContent className="z-90">
                    {currencyOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Client / Project row */}
          <div className="mt-6 border-t pt-4 grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <div className="text-sm text-slate-600 mb-2">Client</div>
              <div className="flex items-center gap-3">
                {creditNote.client?.profilePictureUrl ? (
                  <Image
                    src={creditNote.client.profilePictureUrl}
                    alt={creditNote.client.name || "client"}
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                ) : creditNote.client?.company?.companyLogoUrl ? (
                  <Image
                    src={creditNote.client.company.companyLogoUrl}
                    alt={creditNote.client.name || "client"}
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    {creditNote.client?.name ? creditNote.client.name.charAt(0).toUpperCase() : "C"}
                  </div>
                )}

                <div>
                  <div className="font-medium text-sm">{creditNote.client?.name || "--"}</div>
                  <div className="text-xs text-slate-400">{creditNote.client?.company?.companyName ?? ""}</div>
                </div>
              </div>
            </div>

            <div className="col-span-6">
              <div className="text-sm text-slate-600 mb-2">Project</div>
              <div className="text-sm text-slate-800">{creditNote.project?.projectName ?? "--"}</div>
            </div>
          </div>

          {/* Invoice / Adjustment / Tax row */}
          <div className="mt-6 border-t pt-4 rounded-md">
            <div className="flex">
              {/* left: invoice amount box */}
              <div className="flex-1 p-4">
                <div className="text-sm text-slate-600">Invoice Amount</div>
                <div className="mt-2 text-xl font-semibold">
                  {currency}{" "}
                  {invoiceAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              {/* middle: adjustment and tax */}
              <div className="flex-1 border-l border-r p-4">
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <div className="text-sm text-slate-600">Adjustment</div>
                    <input
                      type="number"
                      step="0.01"
                      value={adjustment}
                      onChange={(e) => setAdjustment(Number(e.target.value))}
                      className="w-full border rounded px-3 py-2 text-sm mt-1"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex flex-col items-start">
                    <div className="text-sm text-slate-600">Mode</div>
                    <div className="mt-1 flex items-center gap-3">
                      <label className={`text-sm ${!adjustAdd ? "font-medium" : "text-slate-500"}`}>Subtract</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={adjustAdd}
                          onChange={() => setAdjustAdd((s) => !s)}
                        />
                        <div className="w-10 h-5 bg-slate-200 rounded-full peer-checked:bg-slate-800 peer-checked:after:translate-x-5 after:content-[''] after:block after:w-4 after:h-4 after:bg-white after:rounded-full after:translate-x-1 after:transition-all" />
                      </label>
                      <label className={`text-sm ${adjustAdd ? "font-medium" : "text-slate-500"}`}>Add</label>
                    </div>
                  </div>

                  <div className="col-span-2 mt-3">
                    <div className="text-sm text-slate-600">Tax (%)</div>
                    <input
                      type="number"
                      step="0.01"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(Number(e.target.value))}
                      className="w-24 border rounded px-3 py-2 text-sm mt-1"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* right: computed amount */}
              <div className="w-48 bg-slate-50 p-4 flex flex-col items-center justify-center">
                <div className="text-sm text-slate-600">Amount</div>
                <div className="mt-2 text-lg font-semibold">
                  {currency}{" "}
                  {computedNet.total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mt-6">
            <label className="block text-sm text-slate-600 mb-2">Note for the recipient </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="--"
            />
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-center gap-4 p-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdate}>Update</Button>
        </div>
      </div>
    </div>
  );
}
