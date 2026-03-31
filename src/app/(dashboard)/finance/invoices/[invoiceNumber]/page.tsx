"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Company = {
  companyName: string;
  website: string;
  officePhone: string;
  taxName: string;
  gstVatNo: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  shippingAddress: string;
  companyLogoUrl: string;
  country: string | null;
};

type Client = {
  clientId: string;
  name: string;
  profilePictureUrl: string;
  email: string;
  mobile: string;
  companyName: string;
  address: string;
  country: string;
  company: Company;
};

type Project = {
  projectName: string;
  projectCode: string;
  startDate: string;
  deadline: string;
  budget: number;
  currency: string;
};

type Invoice = {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  currency: string;
  client: Client;
  project: Project;
  projectBudget: number;
  status: string;
  amount: number;
  tax: number;
  discount: number;
  total: number;
  amountInWords: string;
  notes: string;
  fileUrls: string[];
  paidAmount: number;
  unpaidAmount: number;
  adjustment: number;
  createdAt: string;
};

export default function InvoiceDetail() {
  const router = useRouter();
  const { invoiceNumber } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchInvoice() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/api/invoices/${invoiceNumber}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch invoice: ${res.statusText}`);
      }

      const data = await res.json();
      setInvoice(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong while fetching the invoice.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (invoiceNumber) {
      fetchInvoice();
    }
  }, [invoiceNumber]);

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "paid") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
    } else if (statusLower === "pending" || statusLower === "unpaid") {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    } else if (statusLower === "overdue") {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
    } else if (statusLower === "draft") {
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
    }
    return <Badge variant="outline">{status || "Unknown"}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-gray-600">Loading invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-red-500">Error: {error || "Invoice not found"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push("/finance/invoices")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Invoices
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Invoice {invoice.invoiceNumber}</h1>
          <p className="text-gray-600 mt-1">Details for invoice {invoice.invoiceNumber}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" title="Download Invoice">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Send Invoice">
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Invoice Number</p>
                <p className="font-medium">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Invoice Date</p>
                <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                {getStatusBadge(invoice.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">{invoice.currency} {invoice.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tax</p>
                <p className="font-medium">{invoice.currency} {invoice.tax.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Discount</p>
                <p className="font-medium">{invoice.currency} {invoice.discount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Adjustment</p>
                <p className="font-medium">{invoice.currency} {invoice.adjustment.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-bold">{invoice.currency} {invoice.total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount in Words</p>
                <p className="font-medium">{invoice.amountInWords}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="font-medium">{invoice.notes || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Files</p>
                {invoice.fileUrls.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {invoice.fileUrls.map((url, index) => (
                      <li key={index}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          File {index + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-medium">No files attached</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                {invoice.client?.company?.companyLogoUrl ? (
                  <Image
                    src={invoice.client?.company.companyLogoUrl}
                    alt={invoice.client?.company.companyName || "Company"}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-600">
                      {invoice.client?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium">{invoice.client?.name}</p>
                  <p className="text-sm text-gray-500">{invoice.client?.company.companyName}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{invoice.client?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="font-medium">{invoice.client?.mobile}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{invoice.client?.address}, {invoice.client?.country}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tax No</p>
                  <p className="font-medium">{invoice.client?.company.gstVatNo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Project Name</p>
                  <p className="font-medium">{invoice.project.projectName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Project Code</p>
                  <p className="font-medium">{invoice.project.projectCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{formatDate(invoice.project.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p className="font-medium">{formatDate(invoice.project.deadline)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="font-medium">{invoice.project.currency} {invoice.project.budget.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}