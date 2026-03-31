"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { postAPI } from "@/app/api/apiHelper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, KeyRound, CheckCircle2, AlertTriangle } from "lucide-react";

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employeeId") || "";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"otp" | "reset">("otp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const verifyOtp = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await postAPI("/auth/verify-otp", { employeeId, otp });
      if (res.data?.status === "success") setStep("reset");
    } catch (err: any) {
      setError(err?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await postAPI("/auth/reset-password", {
        employeeId,
        newPassword,
      });

      if (res.data?.status === "success") {
        setSuccess("Password reset successfully 🎉");
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-4">
      <Card className="w-full max-w-md backdrop-blur-xl bg-white/20 border border-white/30 shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-500">
        <CardContent className="p-8 space-y-6">

          {/* Header */}
          <div className="text-center space-y-2">
            {step === "otp" ? (
              <ShieldCheck className="mx-auto h-10 w-10 text-white" />
            ) : (
              <KeyRound className="mx-auto h-10 w-10 text-white" />
            )}
            <h2 className="text-2xl font-bold text-white">
              {step === "otp" ? "Verify OTP" : "Reset Password"}
            </h2>
            <p className="text-white/70 text-sm">
              {step === "otp"
                ? "Enter the OTP sent to your registered email / phone"
                : "Create a strong new password"}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 text-red-100 bg-red-500/30 border border-red-400/40 px-3 py-2 rounded-xl text-sm">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-100 bg-green-500/30 border border-green-400/40 px-3 py-2 rounded-xl text-sm">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </div>
          )}

          {/* OTP STEP */}
          {step === "otp" ? (
            <div className="space-y-4">
              <Input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="bg-white/30 border-white/40 text-white placeholder:text-white/60 rounded-xl"
              />

              <Button
                onClick={verifyOtp}
                disabled={loading}
                className="w-full py-6 text-lg rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg hover:shadow-2xl"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          ) : (
            /* RESET PASSWORD STEP */
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white/30 border-white/40 text-white placeholder:text-white/60 rounded-xl"
              />

              <Button
                onClick={resetPassword}
                disabled={loading}
                className="w-full py-6 text-lg rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg hover:shadow-2xl"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

