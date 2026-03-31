"use client";

import { use, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function ViewAppreciation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/appreciations/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setData);
  }, [id]);

  if (!data) return <p className="p-10">Loading...</p>;

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{data.awardTitle}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p>
            <strong>Employee:</strong> {data.givenToEmployeeName}
          </p>
          <p>
            <strong>ID:</strong> {data.givenToEmployeeId}
          </p>
          <p>
            <strong>Date:</strong> {data.date}
          </p>
          <p>
            <strong>Summary:</strong> {data.summary}
          </p>

          {data.photoUrl && (
            <Image
              src={data.photoUrl}
              alt="Employee photo"
              width={300}
              height={300}
              className="rounded-lg"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
