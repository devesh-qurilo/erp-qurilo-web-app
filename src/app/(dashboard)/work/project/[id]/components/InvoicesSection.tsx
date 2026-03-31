
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import InvoiceFilters from "@/app/(dashboard)/finance/invoices/components/InvoiceFilters";
import InvoiceTable from "@/app/(dashboard)/finance/invoices/components/InvoiceTable";

import InvoiceCreateModal from "@/app/(dashboard)/finance/invoices/components/InvoiceCreateModal";
import InvoiceViewModal from "@/app/(dashboard)/finance/invoices/components/InvoiceViewModal";
import InvoiceEditModal from "@/app/(dashboard)/finance/invoices/components/InvoiceEditModal";
import InvoiceUploadModal from "@/app/(dashboard)/finance/invoices/components/InvoiceUploadModal";
import InvoicePaymentModal from "@/app/(dashboard)/finance/invoices/components/InvoicePaymentModal";
import InvoiceReceiptModal from "@/app/(dashboard)/finance/invoices/components/InvoiceReceiptModal";
import InvoiceViewReceiptModal from "@/app/(dashboard)/finance/invoices/components/InvoiceViewReceiptModal";
import AddPaymentModal from "@/app/(dashboard)/finance/invoices/components/AddPaymentModal";
import ViewPaymentsModal from "@/app/(dashboard)/finance/invoices/components/ViewPaymentsModal";
import CreateCreditNoteDrawer from "@/app/(dashboard)/finance/invoices/components/CreateCreditNoteDrawer";
import ViewCreditNotesDrawer from "@/app/(dashboard)/finance/invoices/components/ViewCreditNotesDrawer";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";


const BASE_URL = `${process.env.NEXT_PUBLIC_MAIN}`;

export default function InvoicesSection({
  projectId, project
}: {
  projectId: number;
    // project : string;
}) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  const [showAddModal ,setShowAddModal] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | number | null>(null);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState<string | null>(null);




  // 🔍 filters (project auto-fixed)
  const [filters, setFilters] = useState({
    search: "",
    project: "All",
    client: "All",
    status: "All",
    startDate: "",
    endDate: "",
  });

  // 🔘 modal states
  const [modal, setModal] = useState({
    view: false,
    edit: false,
    upload: false,
    payment: false,
    create: false,
    receipt: false,
    viewReceipt: false,
    viewPayment: false,
    viewCredit: false,
    createCredit: false,
  });

  const [activeInvoice, setActiveInvoice] = useState<any>(null);



  
const handleOpenAddPayment = (invoice: any) => {
  setSelectedProjectId(invoice?.project?.id || projectId);
  setSelectedClientId(invoice?.client?.clientId);
  setSelectedInvoiceNumber(invoice?.invoiceNumber);

  setShowAddModal(true);
};


  // 📡 Fetch invoices for this project only
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // console.log("nbg",projectId)
      const res = await fetch(
        `${BASE_URL}/api/invoices/project/${project.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const data = await res.json();

      //  console.log("nbg",res)
      setInvoices(Array.isArray(data) ? data : data.invoices ?? []);

    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchInvoices();
  }, [projectId]);


console.log(invoices)
  return (
    <div className="mt-6">
      {/* HEADER */}
      {/* <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Invoices</h3>

        <Button onClick={() => setModal((m) => ({ ...m, create: true }))}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div> */}



{loading ? (
  <div className="flex items-center justify-between mb-4">
    <Skeleton width={120} height={25} />
    <Skeleton width={150} height={35} />
  </div>
) : (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-medium">Invoices</h3>

    <Button onClick={() => setModal((m) => ({ ...m, create: true }))}>
      <Plus className="mr-2 h-4 w-4" />
      Create Invoice
    </Button>
  </div>
)}






      {/* FILTERS */}
      {/* <InvoiceFilters
        filters={filters}
        setFilters={setFilters}
        invoices={invoices}
      /> */}



{loading ? (
  <div className="mb-4 flex gap-4">
    <Skeleton width={200} height={35} />
    <Skeleton width={150} height={35} />
    <Skeleton width={150} height={35} />
    <Skeleton width={120} height={35} />
  </div>
) : (
  <InvoiceFilters
    filters={filters}
    setFilters={setFilters}
    invoices={invoices}
  />
)}



      {/* TABLE */}
      <InvoiceTable
        invoices={invoices}
        loading={loading}
        filters={filters}
        setActiveInvoice={setActiveInvoice}
        setModal={setModal}
        onAddPayment={handleOpenAddPayment}

      />

      {/* MODALS */}
      <InvoiceCreateModal
        open={modal.create}
        onClose={() => setModal((m) => ({ ...m, create: false }))}
        refresh={fetchInvoices}
        invoices={invoices}
      />

      <InvoiceViewModal
        open={modal.view}
        onClose={() => setModal((m) => ({ ...m, view: false }))}
        invoice={activeInvoice}
        setModal={setModal}
        refresh={fetchInvoices}
      />

      <InvoiceEditModal
        open={modal.edit}
        onClose={() => setModal((m) => ({ ...m, edit: false }))}
        invoice={activeInvoice}
        
        refresh={fetchInvoices}
      />

      <InvoiceUploadModal
        open={modal.upload}
        onClose={() => setModal((m) => ({ ...m, upload: false }))}
        invoice={activeInvoice}
        refresh={fetchInvoices}
      />

      {/* <InvoicePaymentModal
        open={modal.payment}
        onClose={() => setModal((m) => ({ ...m, payment: false }))}
        invoice={activeInvoice}
        refresh={fetchInvoices}
      /> */}

      <InvoiceReceiptModal
        open={modal.receipt}
        onClose={() => setModal((m) => ({ ...m, receipt: false }))}
        invoice={activeInvoice}
        refresh={fetchInvoices}
      />

      <InvoiceViewReceiptModal
        open={modal.viewReceipt}
        onClose={() => setModal((m) => ({ ...m, viewReceipt: false }))}
        invoice={activeInvoice}
      />

     


  






<AddPaymentModal
  open={modal.payment}
  onClose={() => setModal((m) => ({ ...m, payment: false }))}
  projectId={activeInvoice?.project?.projectCode}
  clientId={activeInvoice?.client?.clientId}
  invoiceNumber={activeInvoice?.invoiceNumber}
    onSaved={fetchInvoices}

/>


      <ViewPaymentsModal
        open={modal.viewPayment}
        onClose={() => setModal((m) => ({ ...m, viewPayment: false }))}
        invoiceNumber={activeInvoice?.invoiceNumber}
      />

      <CreateCreditNoteDrawer
        open={modal.createCredit}
        onClose={() => setModal((m) => ({ ...m, createCredit: false }))}
        invoiceNumber={activeInvoice?.invoiceNumber}
        onCreated={fetchInvoices}
      />

      <ViewCreditNotesDrawer
        open={modal.viewCredit}
        onClose={() => setModal((m) => ({ ...m, viewCredit: false }))}
        invoiceNumber={activeInvoice?.invoiceNumber}
      />
    </div>
  );
}
