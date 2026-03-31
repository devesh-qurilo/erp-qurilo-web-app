"use client";

import { useEffect, useState } from "react";
import { Loader2, Award, Users, CalendarDays, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface AwardType {
  id: number;
  title: string;
}

interface Employee {
  employeeId: string;
  name: string;
}

export default function AppreciationForm() {
  const [awards, setAwards] = useState<AwardType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [awardId, setAwardId] = useState("");
  const [givenToEmployeeId, setGivenToEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [summary, setSummary] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter()

  useEffect(() => {
    const fetchAwards = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const res = await fetch("/api/hr/awards", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch awards");
        const data: AwardType[] = await res.json();
        setAwards(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAwards();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch employees");
        const data = await res.json();
        setEmployees(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) return alert("Please select a photo");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("awardId", awardId);
      formData.append("givenToEmployeeId", givenToEmployeeId);
      formData.append("date", date);
      formData.append("summary", summary);
      formData.append("photoFile", photoFile);

      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No token found");

      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/employee/appreciations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit");

      setAwardId("");
      setGivenToEmployeeId("");
      setDate("");
      setSummary("");
      setPhotoFile(null);

      alert("Appreciation added successfully!");
      router.push("/hr/appreciation");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error submitting appreciation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <Card className="shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Add Appreciation
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Award */}
            <div>
              <Label className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-muted-foreground" />
                Select Award
              </Label>
              <select
                value={awardId}
                onChange={(e) => setAwardId(e.target.value)}
                required
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">-- Choose Award --</option>
                {awards.map((award) => (
                  <option key={award.id} value={award.id}>
                    {award.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee */}
            <div>
              <Label className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                Select Employee
              </Label>
              <select
                value={givenToEmployeeId}
                onChange={(e) => setGivenToEmployeeId(e.target.value)}
                required
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <Label className="flex items-center gap-2 mb-1">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Summary */}
            <div>
              <Label className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Summary
              </Label>
              <Textarea
                placeholder="Write a short appreciation message..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
                rows={3}
              />
            </div>

            {/* Photo */}
            <div>
              <Label className="flex items-center gap-2 mb-1">
                <Upload className="w-4 h-4 text-muted-foreground" />
                Upload Photo
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Appreciation"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
