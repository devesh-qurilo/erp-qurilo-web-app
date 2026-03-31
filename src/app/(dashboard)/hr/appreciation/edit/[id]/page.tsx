"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";



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

  // if (loading || !data) return <p className="p-10">Loading...</p>;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const form = new FormData(e.target);

    //console.log("kkkkk", form);

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

  // return (
  //   <div className="container mx-auto p-8 max-w-xl">
  //     <h2 className="text-2xl font-bold mb-6">Edit Appreciation</h2>

  //     <form onSubmit={handleSubmit} className="space-y-4">
  //       <Input name="awardId" defaultValue={data.awardId} required />
  //       <Input
  //         name="givenToEmployeeId"
  //         defaultValue={data.givenToEmployeeId}
  //         required
  //       />
  //       <Input type="date" name="date" defaultValue={data.date} required />
  //       <Textarea name="summary" defaultValue={data.summary} required />

  //       <Input type="file" name="photoFile" accept="image/*" />

  //       <Button type="submit">Save Changes</Button>
  //     </form>
  //   </div>
  // );






return (
  <div className="container mx-auto p-8 max-w-xl">
    {/* TITLE */}
    {loading ? (
      <Skeleton width={220} height={30} className="mb-6" />
    ) : (
      <h2 className="text-2xl font-bold mb-6">Edit Appreciation</h2>
    )}

    {/* FORM */}
    <form onSubmit={handleSubmit} className="space-y-4">
      {loading ? (
        <>
          {/* INPUT SKELETONS */}
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={80} />
          <Skeleton height={40} />

          {/* BUTTON */}
          <Skeleton width={120} height={40} />
        </>
      ) : (
        <>
          <Input name="awardId" defaultValue={data.awardId} required />

          <Input
            name="givenToEmployeeId"
            defaultValue={data.givenToEmployeeId}
            required
          />

          <Input
            type="date"
            name="date"
            defaultValue={data.date}
            required
          />

          <Textarea name="summary" defaultValue={data.summary} required />

          <Input type="file" name="photoFile" accept="image/*" />

          <Button type="submit">Save Changes</Button>
        </>
      )}
    </form>
  </div>
);


}
