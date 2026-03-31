"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";


interface InvoiceFormData {
  invoiceNumber: string;
  invoiceDate: string;
  currency: string;
  projectId: string;
  clientId: string;
  amount: number;
  tax: number;
  discount: number;
  amountInWords: string;
  notes: string;
}

export default function CreateInvoice() {
  const router = useRouter();
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: "",
    invoiceDate: "",
    currency: "USD",
    projectId: "",
    clientId: "",
    amount: 0,
    tax: 0,
    discount: 0,
    amountInWords: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" || name === "tax" || name === "discount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (typeof window === "undefined") {
        throw new Error("Client-side environment required");
      }

      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create invoice");
      }

      const newInvoice = await res.json();
      toast("Event has been created.")
      router.push("/finance/invoices");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while creating the invoice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                placeholder="e.g., INV-2025-009"
                required
              />
            </div>
            <div>
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                name="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                placeholder="e.g., USD"
                required
              />
            </div>
            <div>
              <Label htmlFor="projectId">Project ID</Label>
              <Input
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleInputChange}
                placeholder="e.g., 3"
                required
              />
            </div>
            <div>
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                placeholder="e.g., CLI010"
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="e.g., 1000.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="tax">Tax (%)</Label>
              <Input
                id="tax"
                name="tax"
                type="number"
                step="0.01"
                value={formData.tax}
                onChange={handleInputChange}
                placeholder="e.g., 18.0"
              />
            </div>
            <div>
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                name="discount"
                type="number"
                step="0.01"
                value={formData.discount}
                onChange={handleInputChange}
                placeholder="e.g., 10.0"
              />
            </div>
            <div>
              <Label htmlFor="amountInWords">Amount in Words</Label>
              <Input
                id="amountInWords"
                name="amountInWords"
                value={formData.amountInWords}
                onChange={handleInputChange}
                placeholder="e.g., One thousand dollars"
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="e.g., Payment due in 30 days"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/finance/invoices")}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}