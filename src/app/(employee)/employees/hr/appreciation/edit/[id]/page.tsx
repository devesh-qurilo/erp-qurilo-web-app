"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { use } from "react";

export default function EditAppreciation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/appreciations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      });
  }, [id]);

  if (loading || !data) return <p className="p-10">Loading...</p>;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const form = new FormData(e.target);


    const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/admin/appreciations/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form, // formData
    });

    if (res.ok) {
      alert("Updated successfully");
      window.location.href = `/hr/appreciation/${id}`;
    } else {
      alert("Update failed");
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-xl">
      <h2 className="text-2xl font-bold mb-6">Edit Appreciation</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="awardId" defaultValue={data.awardId} required />
        <Input
          name="givenToEmployeeId"
          defaultValue={data.givenToEmployeeId}
          required
        />
        <Input type="date" name="date" defaultValue={data.date} required />
        <Textarea name="summary" defaultValue={data.summary} required />

        <Input type="file" name="photoFile" accept="image/*" />

        <Button type="submit">Save Changes</Button>
      </form>
    </div>
  );
}
