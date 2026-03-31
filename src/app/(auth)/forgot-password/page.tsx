"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Mail, ShieldQuestion, AlertTriangle, CheckCircle2, User2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_MAIN}/auth/forgot-password`,
        { employeeId, email },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
          },
        }
      );

      if (res.data?.status === "success") {
        setSuccess("OTP sent to your email 🎉");
        setTimeout(() => {
          router.push(`/verify-otp?employeeId=${encodeURIComponent(employeeId)}`);
        }, 1500);
      }

      if (res.data?.status === "error") {
        setMessage(res.data?.message);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-4">
      <Card className="w-full max-w-md backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-500">
        <CardContent className="p-8 space-y-6">

          {/* Header */}
          <div className="text-center space-y-3">
            <ShieldQuestion className="mx-auto h-10 w-10 text-white" />
            <h2 className="text-2xl font-bold text-white">Forgot Password?</h2>
            <p className="text-white/70 text-sm">
              Enter your Employee ID and Email — we’ll send you an OTP to reset your password.
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 text-red-100 bg-red-500/30 border border-red-400/40 px-3 py-2 rounded-xl text-sm">
              <AlertTriangle className="h-4 w-4" />
              {message || error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-100 bg-green-500/30 border border-green-400/40 px-3 py-2 rounded-xl text-sm">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="relative">
              <User2 className="absolute left-3 top-3 h-5 w-5 text-white/70" />
              <Input
                placeholder="Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                className="pl-10 bg-white/30 border-white/40 text-white placeholder:text-white/60 rounded-xl"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-white/70" />
              <Input
                type="email"
                placeholder="Registered Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-white/30 border-white/40 text-white placeholder:text-white/60 rounded-xl"
              />
            </div>

            <Button
              disabled={loading}
              className="w-full py-6 text-lg rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg hover:shadow-2xl"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>

          {/* Back to login */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-white/90 hover:underline"
            >
              ← Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
