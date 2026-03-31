"use client";
import { setAuthToken, postAPI } from "../../api/apiHelper";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { setStorage } from "../../../lib/storage/storege";
import { User, Lock } from "lucide-react";
import axios from "axios";

export default function LoginPage() {
  const [role] = useState<"employee" | "admin">("employee");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const resp = await axios.post(
        `${process.env.NEXT_PUBLIC_MAIN}/auth/login`,
        {
          employeeId,
          password,
        }
      );
      const data = resp.data;

      setAuthToken(data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("employeeId", data.employeeId);
      localStorage.setItem("role", data.role);

      setStorage(data.accessToken);

      if (data.role === "ROLE_ADMIN") router.push("/dashboard");
      else router.push("/employees/employee");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during login"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-4">
      <Card className="w-full max-w-md backdrop-blur-lg bg-white/20 border-white/30 shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-500">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-wide drop-shadow-sm">
              SKAVO ERP
            </h1>
            <p className="text-white/80 text-sm">
              Sign in to continue to your dashboard
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 text-red-100 border border-red-400/40 px-4 py-2 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-white/90 text-sm font-medium">
                {role === "employee" ? "Employee ID" : "Admin ID"}
              </label>

              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-white/70" />
                <Input
                  type="text"
                  placeholder="Enter your ID"
                  className="pl-10 bg-white/30 border-white/40 text-white placeholder:text-white/60 rounded-xl focus:ring-2 focus:ring-white/60"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-white/90 text-sm font-medium">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-white/70" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10 bg-white/30 border-white/40 text-white placeholder:text-white/60 rounded-xl focus:ring-2 focus:ring-white/60"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-white/90 text-sm hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 text-lg rounded-2xl bg-white text-indigo-600 hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <p className="text-center text-xs text-white/70">
            © {new Date().getFullYear()} SKAVO — All Rights Reserved
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
