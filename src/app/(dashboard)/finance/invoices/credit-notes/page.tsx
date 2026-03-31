"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Eye, Download, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

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

type CreditNote = {
  id: number;
  creditNoteNumber: string;
  creditNoteDate: string;
  currency: string;
  adjustment: number;
  adjustmentPositive: boolean;
  tax: number;
  amount: number;
  notes: string;
  fileUrl: string;
  client: Client;
  project: Project;
  totalAmount: number;
  createdAt: string;
};

function InvoiceCreditNotesListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceNumber = searchParams.get("invoiceNumber");
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchCreditNotes() {
    if (!invoiceNumber) {
      setError("No invoice number provided");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAIN}/api/invoices/${invoiceNumber}/credit-notes`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch credit notes: ${res.statusText}`);
      }

      const data = await res.json();
      setCreditNotes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong while fetching credit notes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCreditNotes();
  }, [invoiceNumber]);

  const getAdjustmentBadge = (positive: boolean) => {
    if (positive) {
      return <Badge className="bg-green-100 text-green-800">Credit</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">Debit</Badge>;
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

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, "_blank");
  };

  // if (loading) {
  //   return (
  //     <div className="container mx-auto p-6">
  //       <p className="text-center text-gray-600">Loading credit notes...</p>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-center text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/finance/invoices/${invoiceNumber}`)}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Invoice
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">
          Credit Notes for Invoice {invoiceNumber}
        </h1>
        <p className="text-gray-600 mt-1">
          Manage credit notes associated with invoice {invoiceNumber}
        </p>
    
    
    
    
      </div> */}




<div className="mb-6">
  {loading ? (
    <>
      <Skeleton width={150} height={30} />
      <Skeleton width={300} height={35} className="mt-2" />
      <Skeleton width={250} height={20} className="mt-2" />
    </>
  ) : (
    <>
      <Button
        variant="ghost"
        onClick={() => router.push(`/finance/invoices/${invoiceNumber}`)}
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Invoice
      </Button>

      <h1 className="text-3xl font-bold text-gray-900">
        Credit Notes for Invoice {invoiceNumber}
      </h1>

      <p className="text-gray-600 mt-1">
        Manage credit notes associated with invoice {invoiceNumber}
      </p>
    </>
  )}
</div>



      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creditNotes.length === 0 ? (
          <p className="text-center text-gray-500 col-span-full">
            No credit notes found for this invoice
          </p>
        ) : (
          creditNotes.map((cn) => (
            <div
              key={cn.id}
              className="bg-white border rounded-lg shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-semibold">{cn.creditNoteNumber}</h2>
                  {getAdjustmentBadge(cn.adjustmentPositive)}
                </div>

                <p className="text-sm text-gray-500 mb-1">
                  Project: {cn.project?.projectName || "N/A"} ({cn.project?.projectCode || "N/A"})
                </p>

                <div className="flex items-center gap-3 mb-2">
                  {cn.client?.company?.companyLogoUrl ? (
                    <Image
                      src={cn.client.company.companyLogoUrl}
                      alt={cn.client.company.companyName || "Company"}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-600">
                        {cn.client?.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{cn.client?.name || "N/A"}</p>
                    <p className="text-xs text-gray-500">
                      {cn.client?.company?.companyName || ""}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  Credit Note Date: {formatDate(cn.creditNoteDate)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Total Amount: {cn.currency} {cn.totalAmount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  Adjustment: {cn.currency} {cn.adjustmentPositive ? "+" : "-"}
                  {cn.adjustment.toFixed(2)}
                </p>
              </div>


            </div>
          ))
        )}
      </div> */}



<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

  {loading ? (
    Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="bg-white border rounded-lg p-4 space-y-3">
        
        {/* TITLE + BADGE */}
        <div className="flex justify-between">
          <Skeleton width={120} />
          <Skeleton width={60} height={25} />
        </div>

        {/* PROJECT */}
        <Skeleton width="80%" />

        {/* CLIENT */}
        <div className="flex items-center gap-3">
          <Skeleton circle width={32} height={32} />
          <div>
            <Skeleton width={100} />
            <Skeleton width={80} height={10} />
          </div>
        </div>

        {/* DATES + AMOUNT */}
        <Skeleton width="70%" />
        <Skeleton width="60%" />
        <Skeleton width="50%" />
      </div>
    ))
  ) : creditNotes.length === 0 ? (
    <p className="text-center text-gray-500 col-span-full">
      No credit notes found for this invoice
    </p>
  ) : (
    creditNotes.map((cn) => (
      <div
        key={cn.id}
        className="bg-white border rounded-lg shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition"
      >
        <div>
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-semibold">{cn.creditNoteNumber}</h2>
            {getAdjustmentBadge(cn.adjustmentPositive)}
          </div>

          <p className="text-sm text-gray-500 mb-1">
            Project: {cn.project?.projectName || "N/A"} ({cn.project?.projectCode || "N/A"})
          </p>

          <div className="flex items-center gap-3 mb-2">
            {cn.client?.company?.companyLogoUrl ? (
              <Image
                src={cn.client.company.companyLogoUrl}
                alt={cn.client.company.companyName || "Company"}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-600">
                  {cn.client?.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            )}

            <div>
              <p className="font-medium text-sm">{cn.client?.name || "N/A"}</p>
              <p className="text-xs text-gray-500">
                {cn.client?.company?.companyName || ""}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Credit Note Date: {formatDate(cn.creditNoteDate)}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Total Amount: {cn.currency} {cn.totalAmount.toFixed(2)}
          </p>

          <p className="text-sm text-gray-500">
            Adjustment: {cn.currency} {cn.adjustmentPositive ? "+" : "-"}
            {cn.adjustment.toFixed(2)}
          </p>
        </div>
      </div>
    ))
  )}
</div>



    </div>
  );
}

export default function InvoiceCreditNotesList() {
  return (
    <Suspense>
      <InvoiceCreditNotesListInner />
    </Suspense>
  );
}
