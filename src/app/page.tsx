import Link from "next/link";
import { ShieldCheck, User } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-4">
      <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-3xl shadow-2xl w-full max-w-md p-10 text-center animate-in fade-in zoom-in-95 duration-500">

        {/* Title */}
        <h1 className="text-3xl font-bold text-white drop-shadow-sm mb-2">
          Welcome Back 👋
        </h1>
        <p className="text-white/80 text-sm mb-8">
          Choose how you want to login
        </p>

        {/* Divider */}
        <div className="flex items-center justify-center mb-8">
          <div className="h-px w-1/4 bg-white/40"></div>
          <span className="px-4 text-white/80 text-sm tracking-wide">
            Login As
          </span>
          <div className="h-px w-1/4 bg-white/40"></div>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          {/* Admin Login */}
          <Link href="/login" className="block group">
            <button className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/30 border border-white/40 text-white font-medium shadow-lg hover:bg-white/40 hover:shadow-2xl transition-all backdrop-blur">
              <ShieldCheck className="w-5 h-5 opacity-90 group-hover:scale-110 transition" />
              <span>Admin</span>
            </button>
          </Link>

          {/* (Optional) Employee Login — remove if not needed */}
          <Link href="/login" className="block group">
            <button className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/20 border border-white/30 text-white/90 font-medium shadow hover:bg-white/30 hover:shadow-2xl transition-all backdrop-blur">
              <User className="w-5 h-5 opacity-90 group-hover:scale-110 transition" />
              <span>Employee</span>
            </button>
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-10 text-xs text-white/70">
          © {new Date().getFullYear()} SKAVO — All Rights Reserved
        </p>
      </div>
    </div>
  );
}

