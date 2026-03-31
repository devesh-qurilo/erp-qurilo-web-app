"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";

export default function InvoiceUploadModal({
    open,
    onClose,
    invoice,
    refresh
}) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    if (!invoice) return null;

    const upload = async () => {
        if (!file) return alert("Choose a file");

        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);

            await fetch(`/api/invoices/${invoice.invoiceNumber}/files`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: fd,
            });

            onClose();
            refresh();
        } catch (e) {
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={`Upload file for ${invoice.invoiceNumber}`}>

            <input
                type="file"
                className="border p-2 rounded w-full"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={upload} disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload"}
                </Button>
            </div>

        </Modal>
    );
}
