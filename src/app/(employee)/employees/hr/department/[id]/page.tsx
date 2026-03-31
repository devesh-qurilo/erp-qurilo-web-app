"use client";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Department } from "@/types/departments";
import { CreateDepartmentForm } from "../_components/department-form";

const fetcher = async (url: string) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (!token) throw new Error("Access token not found");
  const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/admin/departments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function DepartmentIdPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  // All departments for parent dropdown
  const { data: all, mutate } = useSWR<Department[]>(
    "/api/hr/department",
    fetcher
  );

  // Current department (for editing)
  const { data: current, isLoading } = useSWR<Department>(
    `/api/hr/department/${id}`,
    fetcher
  );

  return (
    <main className="container mx-auto max-w-3xl p-4 md:p-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/hr/department")}
        className="mb-2"
      >
        ← Back to departments
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-pretty">
            {current ? "Edit Department" : "Loading..."}
          </CardTitle>

          <CardDescription>
            {isLoading
              ? "Loading department..."
              : current
                ? `Editing: ${current.departmentName}`
                : "Department not found"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {current && (
            <CreateDepartmentForm
              parents={all ?? []}
              initialName={current.departmentName} // ⭐ AUTO-FILL NAME
              initialParentId={current.parentDepartmentId ?? null} // ⭐ AUTO-FILL PARENT
              editId={current.id} // ⭐ EDIT MODE ENABLED
              onSuccess={async () => {
                await mutate();
                router.push("/hr/department");
              }}
            />
          )}

          <Separator />

          {!isLoading && current && (
            <div className="text-sm text-muted-foreground">
              Created at: {current.createAt}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
