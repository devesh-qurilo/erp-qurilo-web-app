"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

type ImportButtonProps = {
  api: string;
  label?: string;
  onSuccess?: () => void;
};

const BASE = `${process.env.NEXT_PUBLIC_MAIN}`;

export default function ImportButton({
  api,
  label = "Import",
  onSuccess,
}: ImportButtonProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImport = async (file: File) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BASE}${api}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Import failed");
      }

      alert("Import successful");

      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err?.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        ref={fileRef}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          handleImport(file);
        }}
      />

      <Button
        variant="outline"
        disabled={loading}
        onClick={() => fileRef.current?.click()}
        // className="flex items-center gap-2"
          className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-voilet-600 hover:to-indigo-700 text-white border-none"

      >
        <Upload className="w-4 h-4" />
        {loading ? "Importing..." : label}
      </Button>
    </>
  );
}