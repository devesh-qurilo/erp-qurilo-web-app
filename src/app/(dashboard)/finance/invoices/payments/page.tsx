"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Download, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

type PaymentGateway = {
  id: number;
  name: string;
  createdAt: string;
};

type InvoiceSummary = {
  id: number;
  invoiceNumber: string;
  total: number;
  status: string;
};

type Payment = {
  id: number;
  projectId: string;
  project: Project;
  clientId: string;
  client: Client;
  currency: string;
  amount: number;
  transactionId: string;
  paymentGateway: PaymentGateway;
  receiptFileUrl: string | null;
  status: string;
  note: string;
  paymentDate: string;
  invoice: InvoiceSummary;
};

function InvoicePaymentsListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceNumber = searchParams.get("invoiceNumber");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchPayments() {
    if (!invoiceNumber) {
      setError("No invoice number provided");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/api/invoices/${invoiceNumber}/payments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch payments: ${res.statusText}`);
      }

      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong while fetching payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, [invoiceNumber]);

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "completed") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
    } else if (statusLower === "pending") {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    } else if (statusLower === "failed") {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
    }
    return <Badge variant="outline">{status || "Unknown"}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = (fileUrl: string | null) => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-gray-600">Loading payments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/finance/invoices/${invoiceNumber}`)}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Invoice
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Payments for Invoice{invoiceNumber}</h1>
        <p className="text-gray-600 mt-1">Track payments associated with invoice {invoiceNumber}</p>
      </div>

      <div className="border rounded-lg bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  No payments found for this invoice
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-gray-50">
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell className="font-semibold">
                    {payment.currency} {payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>{payment.transactionId || "N/A"}</TableCell>
                  <TableCell>{payment.paymentGateway.name || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {payment.client?.company?.companyLogoUrl ? (
                        <Image
                          src={payment.client.company.companyLogoUrl}
                          alt={payment.client.company.companyName || "Company"}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-gray-600">
                            {payment.client?.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{payment.client?.name || "N/A"}</p>
                        <p className="text-xs text-gray-500">
                          {payment.client?.company?.companyName || ""}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{payment.note || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {payment.receiptFileUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Download Receipt"
                          onClick={() => handleDownload(payment.receiptFileUrl)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function InvoicePaymentsList() {
  return (
    <Suspense>
      <InvoicePaymentsListInner />
    </Suspense>
  );
}