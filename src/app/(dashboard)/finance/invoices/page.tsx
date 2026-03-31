"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import InvoiceFilters from "./components/InvoiceFilters";
import InvoiceTable from "./components/InvoiceTable";

import InvoiceCreateModal from "./components/InvoiceCreateModal";
import InvoiceViewModal from "./components/InvoiceViewModal";
import InvoiceEditModal from "./components/InvoiceEditModal";
import InvoiceUploadModal from "./components/InvoiceUploadModal";
import InvoicePaymentModal from "./components/InvoicePaymentModal";
import InvoiceReceiptModal from "./components/InvoiceReceiptModal";
import InvoiceViewReceiptModal from "./components/InvoiceViewReceiptModal";
import AddPaymentModal from "./components/AddPaymentModal";
import ViewPaymentsModal from "./components/ViewPaymentsModal";
import CreateCreditNoteDrawer from "./components/CreateCreditNoteDrawer";
import ViewCreditNotesDrawer from "./components/ViewCreditNotesDrawer";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";



const BASE_URL = process.env.NEXT_PUBLIC_MAIN ;
export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [filters, setFilters] = useState({
    search: "",
    project: "All",
    client: "All",
    status: "All",
    startDate: "",
    endDate: "",
  });

  // modal states
  const [modal, setModal] = useState({
    view: false,
    edit: false,
    upload: false,
    payment: false,
    create: false,
    receipt: false,
    viewReceipt: false,   // NEW
    viewPayment: false,
    viewCredit: false,
    createCredit: false
  });

  // which invoice is selected for actions
  const [activeInvoice, setActiveInvoice] = useState(null);

  // fetch invoices
  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/invoices`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      const data = await res.json();

      setInvoices(Array.isArray(data) ? data : data.invoices ?? []);
    } catch (e) {
      console.error("Invoice fetch failed", e);
    } finally {
      setLoading(false);
    }
  };
  //console.log("devesh", activeInvoice?.invoiceNumber, invoices)

  useEffect(() => {
    fetchInvoices();
  }, []);

  // const handleOpenAdd = () => {
  //   setShowAddModal(true);
  // };

  return (
 
    
    <div className="py-6 px-4">
      {/* HEADER */}


{/* <InvoiceFilters filters={filters} setFilters={setFilters} invoices={invoices} /> */}


{loading ? (
  <div className="flex gap-4 mb-4">
    <Skeleton width={200} height={40} />
    <Skeleton width={200} height={40} />
    <Skeleton width={150} height={40} />
  </div>
) : (
  <InvoiceFilters filters={filters} setFilters={setFilters} invoices={invoices} />
)}


      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* <Button onClick={() => setModal(m => ({ ...m, create: true }))}>
            <Plus className=" h-4 w-4" /> Create Invoice 
          </Button> */}



{loading ? (
  <Skeleton width={160} height={40} />
) : (
  <Button onClick={() => setModal(m => ({ ...m, create: true }))}>
    <Plus className="h-4 w-4" /> Create Invoice
  </Button>
)}


          {/* <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-gray-600">Manage and track all invoices</p>
          </div> */}
        </div>
      </div>
      

      {/* FILTERS */}
      
      {/* <InvoiceFilters filters={filters} setFilters={setFilters} invoices={invoices} /> */}
     

      {/* TABLE */}
      <InvoiceTable
        invoices={invoices}
        loading={loading}
        filters={filters}
        setActiveInvoice={setActiveInvoice}
        setModal={setModal}
      />

      {/* MODALS */}
      <InvoiceCreateModal
        open={modal.create}
        onClose={() => setModal(m => ({ ...m, create: false }))}
        refresh={fetchInvoices}
        invoices={invoices}
      />

      <InvoiceViewModal
        open={modal.view}
        onClose={() => setModal(m => ({ ...m, view: false }))}
        invoice={activeInvoice}
        setModal={setModal}
        refresh={fetchInvoices}
      />

      <InvoiceEditModal
        open={modal.edit}
        onClose={() => setModal(m => ({ ...m, edit: false }))}
        invoice={activeInvoice}
        refresh={fetchInvoices}
      />

      <InvoiceUploadModal
        open={modal.upload}
        onClose={() => setModal(m => ({ ...m, upload: false }))}
        invoice={activeInvoice}
        refresh={fetchInvoices}
      />

      {/* <InvoicePaymentModal
        open={modal.payment}
        onClose={() => setModal(m => ({ ...m, payment: false }))}
        invoice={activeInvoice}
        refresh={fetchInvoices}
      /> */}

      <InvoiceReceiptModal
        open={modal.receipt}
        onClose={() => setModal(m => ({ ...m, receipt: false }))}
        invoice={activeInvoice}
        refresh={fetchInvoices}
      />

      <InvoiceViewReceiptModal
        open={modal.viewReceipt}
        onClose={() => setModal(m => ({ ...m, viewReceipt: false }))}
        invoice={activeInvoice}
      />


      <AddPaymentModal
        open={modal.payment}
        onClose={() => setModal(m => ({ ...m, payment: false }))}
          projectId={activeInvoice?.project?.projectCode}

        clientId={activeInvoice?.client?.clientId}
          invoiceNumber={activeInvoice?.invoiceNumber}

        onSaved={fetchInvoices}
      />
      
      <ViewPaymentsModal
        open={modal.viewPayment}
        onClose={() => setModal(m => ({ ...m, viewPayment: false }))}
        invoiceNumber={activeInvoice?.invoiceNumber}
      />

      <CreateCreditNoteDrawer
        open={modal.createCredit}
        onClose={() => setModal(m => ({ ...m, createCredit: false }))}
        invoiceNumber={activeInvoice?.invoiceNumber}
        onCreated={fetchInvoices}
      />

      <ViewCreditNotesDrawer
        open={modal.viewCredit}
        onClose={() => setModal(m => ({ ...m, viewCredit: false }))}
        invoiceNumber={activeInvoice?.invoiceNumber}
      />

    </div>
   
  );
}
