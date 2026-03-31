
"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const BASE_URL =  `${process.env.NEXT_PUBLIC_MAIN}`;

export default function InvoiceReceiptModal({ open, onClose, invoice }) {
  if (!invoice) return null;

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    invoiceId: invoice.invoiceNumber || "",
    issueDate: "",
    currency: "USD",

    sellerCompanyName: "",
    sellerCompanyAddress: "",
    sellerCompanyCode: "",
    sellerCompanyTaxNumber: "",
    sellerCompanyEmail: "",
    sellerCompanyPhoneNumber: "",
    sellerCompanyBankName: "",
    sellerCompanyBankAccountNumber: "",

    buyerCompanyName: "",
    buyerCompanyAddress: "",
    buyerCompanyCode: "",
    buyerCompanyTaxNumber: "",
    buyerCleintName: "",
    buyerCompanyEmail: "",
    buyerCompanyPhoneNumber: "",
    buyerCompanyBankName: "",
    buyerCompanyBankAccountNumber: "",

    productName: "",
    quantity: 1,
    priceWithOutTax: 0,
    tax: 0,
    description: "",
  });

  function update(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {


    try {
      setSaving(true);

      const res = await fetch(`${BASE_URL}/api/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`

        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to create invoice");

      await res.json();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while saving invoice");
    } finally {
      setSaving(false);
    }
  }
  

  return (
    <Modal open={open} onClose={onClose} title="Create Receipt">
      <div className="space-y-6">

        {/* Invoice Details */}
        <section className="rounded-lg border p-4">
          <h3 className="font-medium mb-4">Invoice Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <div className="flex mt-1">
                <span className="px-3 flex items-center border border-r-0 rounded-l-md bg-muted text-sm">
                  INV#
                </span>
                <Input
                  className="rounded-l-none"
                  value={form.invoiceId}
                  onChange={(e) => update("invoiceId", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">
                Issue Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                className="mt-1"
                value={form.issueDate}
                onChange={(e) => update("issueDate", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Currency <span className="text-red-500">*</span>
              </label>
              <Select
                value={form.currency}
                onValueChange={(v) => update("currency", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD $</SelectItem>
                  <SelectItem value="USD">USD ₹</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Seller Details */}
        <section className="rounded-lg border p-4">
          <h3 className="font-medium mb-4">Seller Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Company Name" onChange={(v) => update("sellerCompanyName", v)} />
            <InputField label="Email Id" onChange={(v) => update("sellerCompanyEmail", v)} />
            <InputField label="Contact No." onChange={(v) => update("sellerCompanyPhoneNumber", v)} />
            <InputField label="Company Code" onChange={(v) => update("sellerCompanyCode", v)} />
            <InputField label="Tax No." onChange={(v) => update("sellerCompanyTaxNumber", v)} />
            <TextareaField label="Company Address" onChange={(v) => update("sellerCompanyAddress", v)} />
            <InputField label="Bank Account No." onChange={(v) => update("sellerCompanyBankAccountNumber", v)} />
            <InputField label="Name of the Bank" onChange={(v) => update("sellerCompanyBankName", v)} />
          </div>
        </section>

        {/* Buyer Details */}
        <section className="rounded-lg border p-4">
          <h3 className="font-medium mb-4">Buyer Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Client Name" onChange={(v) => update("buyerCleintName", v)} />
            <InputField label="Company Name" onChange={(v) => update("buyerCompanyName", v)} />
            <InputField label="Email Id" onChange={(v) => update("buyerCompanyEmail", v)} />
            <InputField label="Contact No." onChange={(v) => update("buyerCompanyPhoneNumber", v)} />
            <InputField label="Company Code" onChange={(v) => update("buyerCompanyCode", v)} />
            <InputField label="Tax No." onChange={(v) => update("buyerCompanyTaxNumber", v)} />
            <TextareaField
              label="Company Address"
              colSpan={3}
              onChange={(v) => update("buyerCompanyAddress", v)}
            />
            <InputField label="Bank Account No." onChange={(v) => update("buyerCompanyBankAccountNumber", v)} />
            <InputField label="Name of the Bank" onChange={(v) => update("buyerCompanyBankName", v)} />
          </div>
        </section>

        {/* Project Details */}
        <section className="rounded-lg border p-4">
          <h3 className="font-medium mb-4">Project Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <InputField label="Product Name" onChange={(v) => update("productName", v)} />
            
            {/* <InputField  label="Product Name" type="number"
              defaultValue={1}
              onChange={(e) => update("quantity", Number(e.target.value))} /> */}
              <div>
                <h3 className="font-medium mb-1">Quantity 
                     <span className="text-red-500">*</span>
                </h3>
                 <Input
              type="number"
              defaultValue={1}
              onChange={(e) => update("quantity", Number(e.target.value))}
            />
              </div>
           
          <div>
            <h3 className="font-medium mb-1">Price Without Tax
                     <span className="text-red-500">*</span>
                </h3>
 <Input
              type="number"
              defaultValue={1}
              onChange={(e) => update("quantity", Number(e.target.value))}
            />
          </div>

<div>
    <h3 className="font-medium mb-1">Tax 
                     <span className="text-red-500">*</span>
                </h3>
    <Input
              type="number"
              onChange={(e) => update("tax", Number(e.target.value))}
            /></div>
          
            
          </div>

            <div>
                 <h3 className="mt-4">
            Note / Description for the recipient
          </h3>
                <Textarea
            className="mt-4"
            placeholder="Note / Description for the recipient"
            onChange={(e) => update("description", e.target.value)}
          />
            </div>
         
        </section>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Helpers (UI SAME) ---------- */

function InputField({ label, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label} <span className="text-red-500">*</span>
      </label>
      <Input className="mt-1" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TextareaField({ label, onChange, colSpan = 2 }) {
  return (
    <div className={`md:col-span-${colSpan}`}>
      <label className="text-sm font-medium">
        {label} <span className="text-red-500">*</span>
      </label>
      <Textarea className="mt-1" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
