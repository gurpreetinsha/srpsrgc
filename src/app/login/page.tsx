"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ShieldCheck, UserCheck, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Role-based redirection
      if (data.role === "ADMIN") {
        router.push("/admin");
      } else if (data.role === "FACULTY") {
        router.push("/faculty");
      } else if (data.role === "STUDENT") {
        router.push("/student");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#991b1b] shadow-md ring-4 ring-red-100">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#991b1b]">
            Shri Ram Group of Colleges
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Official Examination & Result Management System
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 border-b border-slate-100 pb-4">
            <h2 className="text-base font-semibold text-slate-900">Sign In to Your Account</h2>
            <p className="text-xs text-slate-500">
              Enter your institutional Roll Number, Faculty ID, or Admin Email.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Institutional Identifier
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 230101, FAC001, admin@srgc.edu.in"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#991b1b] focus:outline-none focus:ring-1 focus:ring-[#991b1b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#991b1b] focus:outline-none focus:ring-1 focus:ring-[#991b1b]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#991b1b] px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#7f1d1d] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-white" />
                  <span>Secure Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Role access guidance */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
              <div className="rounded border border-slate-100 bg-slate-50 p-2">
                <UserCheck className="mx-auto mb-1 h-3.5 w-3.5 text-slate-600" />
                <span className="font-medium text-slate-700">Students</span>
                <p className="text-[10px] text-slate-400">Roll No.</p>
              </div>
              <div className="rounded border border-slate-100 bg-slate-50 p-2">
                <GraduationCap className="mx-auto mb-1 h-3.5 w-3.5 text-slate-600" />
                <span className="font-medium text-slate-700">Faculty</span>
                <p className="text-[10px] text-slate-400">Faculty ID</p>
              </div>
              <div className="rounded border border-slate-100 bg-slate-50 p-2">
                <ShieldCheck className="mx-auto mb-1 h-3.5 w-3.5 text-slate-600" />
                <span className="font-medium text-slate-700">Admins</span>
                <p className="text-[10px] text-slate-400">Admin Email</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-4 text-center text-xs text-slate-400">
          Encrypted with Argon2id & SHA-256 session tokens.
          <br />
          Unauthorized access attempts are audited and rate-limited.
        </p>
      </div>
    </div>
  );
}

